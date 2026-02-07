import { Hono } from 'hono';
import { db, components, sboms, projects, componentVulnerabilities, vulnerabilities } from '../db';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';

const exportRouter = new Hono();

// Helper function to get SBOM data with components and vulnerabilities
async function getSbomData(sbomId: string) {
  // Get SBOM details
  const sbomResult = await db.select({
    sbom: sboms,
    project: projects,
  })
    .from(sboms)
    .leftJoin(projects, eq(sboms.projectId, projects.id))
    .where(eq(sboms.id, sbomId))
    .limit(1);

  if (sbomResult.length === 0) {
    return null;
  }

  const { sbom, project } = sbomResult[0];

  // Get components with their vulnerabilities
  const componentsResult = await db.select({
    component: components,
  })
    .from(components)
    .where(eq(components.sbomId, sbomId));

  // Get vulnerabilities for each component
  const componentsWithVulns = await Promise.all(
    componentsResult.map(async ({ component }) => {
      const vulns = await db.select({
        vulnerability: vulnerabilities,
        link: componentVulnerabilities,
      })
        .from(componentVulnerabilities)
        .leftJoin(vulnerabilities, eq(componentVulnerabilities.vulnerabilityId, vulnerabilities.id))
        .where(eq(componentVulnerabilities.componentId, component.id));

      return {
        ...component,
        vulnerabilities: vulns.map((v) => ({
          ...v.vulnerability,
          status: v.link?.status,
        })),
      };
    })
  );

  return {
    sbom,
    project,
    components: componentsWithVulns,
  };
}

// Helper function to convert data to CSV format
function convertToCSV(data: any) {
  const { sbom, project, components } = data;

  // Create CSV rows
  const rows = [];

  // Add header
  rows.push([
    'Component Name',
    'Version',
    'License',
    'Supplier',
    'PURL',
    'Description',
    'CVE ID',
    'Severity',
    'CVSS Score',
    'Vulnerability Description',
    'Fixed Version',
    'Status',
  ]);

  // Add component data
  for (const component of components) {
    if (component.vulnerabilities && component.vulnerabilities.length > 0) {
      // Add row for each vulnerability
      for (const vuln of component.vulnerabilities) {
        rows.push([
          component.name,
          component.version,
          component.license || '',
          component.supplier || '',
          component.purl || '',
          component.description || '',
          vuln.cveId || '',
          vuln.severity || '',
          vuln.cvssScore || '',
          vuln.description || '',
          vuln.fixedVersion || '',
          vuln.status || '',
        ]);
      }
    } else {
      // Add component without vulnerabilities
      rows.push([
        component.name,
        component.version,
        component.license || '',
        component.supplier || '',
        component.purl || '',
        component.description || '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
    }
  }

  // Convert to CSV string
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// Export SBOM as CSV
exportRouter.get('/sbom/:id/csv', async (c) => {
  try {
    const sbomId = c.req.param('id');
    const data = await getSbomData(sbomId);

    if (!data) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const csv = convertToCSV(data);
    const filename = `sbom-${data.project?.name || 'unknown'}-v${data.sbom.version}.csv`;

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.body(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return c.json({ error: 'Failed to export CSV' }, 500);
  }
});

// Export SBOM as Excel
exportRouter.get('/sbom/:id/excel', async (c) => {
  try {
    const sbomId = c.req.param('id');
    const data = await getSbomData(sbomId);

    if (!data) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare component data for Excel
    const componentRows = [];
    for (const component of data.components) {
      if (component.vulnerabilities && component.vulnerabilities.length > 0) {
        for (const vuln of component.vulnerabilities) {
          componentRows.push({
            'Component Name': component.name,
            'Version': component.version,
            'License': component.license || '',
            'Supplier': component.supplier || '',
            'PURL': component.purl || '',
            'Description': component.description || '',
            'CVE ID': vuln.cveId || '',
            'Severity': vuln.severity || '',
            'CVSS Score': vuln.cvssScore || '',
            'Vulnerability Description': vuln.description || '',
            'Fixed Version': vuln.fixedVersion || '',
            'Status': vuln.status || '',
          });
        }
      } else {
        componentRows.push({
          'Component Name': component.name,
          'Version': component.version,
          'License': component.license || '',
          'Supplier': component.supplier || '',
          'PURL': component.purl || '',
          'Description': component.description || '',
          'CVE ID': '',
          'Severity': '',
          'CVSS Score': '',
          'Vulnerability Description': '',
          'Fixed Version': '',
          'Status': '',
        });
      }
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(componentRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Component Name
      { wch: 12 }, // Version
      { wch: 20 }, // License
      { wch: 20 }, // Supplier
      { wch: 40 }, // PURL
      { wch: 40 }, // Description
      { wch: 18 }, // CVE ID
      { wch: 12 }, // Severity
      { wch: 12 }, // CVSS Score
      { wch: 50 }, // Vulnerability Description
      { wch: 15 }, // Fixed Version
      { wch: 12 }, // Status
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Components');

    // Create summary sheet
    const summary = [
      ['SBOM Report'],
      [''],
      ['Project', data.project?.name || 'Unknown'],
      ['SBOM Version', data.sbom.version],
      ['Format', data.sbom.format.toUpperCase()],
      ['Created', new Date(data.sbom.createdAt).toLocaleString()],
      ['Author', data.sbom.author || 'Unknown'],
      ['Total Components', data.components.length],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `sbom-${data.project?.name || 'unknown'}-v${data.sbom.version}.xlsx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.body(excelBuffer);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return c.json({ error: 'Failed to export Excel' }, 500);
  }
});

export default exportRouter;
