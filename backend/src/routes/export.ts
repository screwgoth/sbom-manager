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

// Export SBOM as JSON (native format)
exportRouter.get('/sbom/:id/json', async (c) => {
  try {
    const sbomId = c.req.param('id');
    const data = await getSbomData(sbomId);

    if (!data) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const jsonExport = {
      sbom: {
        id: data.sbom.id,
        version: data.sbom.version,
        format: data.sbom.format,
        createdAt: data.sbom.createdAt,
        author: data.sbom.author,
      },
      project: {
        id: data.project?.id,
        name: data.project?.name,
        description: data.project?.description,
      },
      components: data.components.map((comp) => ({
        id: comp.id,
        name: comp.name,
        version: comp.version,
        license: comp.license,
        supplier: comp.supplier,
        purl: comp.purl,
        description: comp.description,
        vulnerabilities: comp.vulnerabilities.map((v) => ({
          cveId: v.cveId,
          severity: v.severity,
          cvssScore: v.cvssScore,
          description: v.description,
          fixedVersion: v.fixedVersion,
          status: v.status,
        })),
      })),
      metadata: {
        totalComponents: data.components.length,
        totalVulnerabilities: data.components.reduce(
          (acc, c) => acc + (c.vulnerabilities?.length || 0),
          0
        ),
        exportedAt: new Date().toISOString(),
      },
    };

    const filename = `sbom-${data.project?.name || 'unknown'}-v${data.sbom.version}.json`;

    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.json(jsonExport);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return c.json({ error: 'Failed to export JSON' }, 500);
  }
});

// Export SBOM as SPDX format
exportRouter.get('/sbom/:id/spdx', async (c) => {
  try {
    const sbomId = c.req.param('id');
    const data = await getSbomData(sbomId);

    if (!data) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const spdxDocument = {
      spdxVersion: 'SPDX-2.3',
      dataLicense: 'CC0-1.0',
      SPDXID: 'SPDXRef-DOCUMENT',
      name: `${data.project?.name || 'Unknown'}-${data.sbom.version}`,
      documentNamespace: `https://sbom-manager.local/spdx/${data.sbom.id}`,
      creationInfo: {
        created: new Date(data.sbom.createdAt).toISOString(),
        creators: [data.sbom.author ? `Person: ${data.sbom.author}` : 'Tool: SBOM Manager'],
        licenseListVersion: '3.20',
      },
      packages: data.components.map((comp, index) => ({
        SPDXID: `SPDXRef-Package-${index + 1}`,
        name: comp.name,
        versionInfo: comp.version,
        supplier: comp.supplier ? `Organization: ${comp.supplier}` : 'NOASSERTION',
        downloadLocation: comp.purl || 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: comp.license || 'NOASSERTION',
        licenseDeclared: comp.license || 'NOASSERTION',
        copyrightText: 'NOASSERTION',
        description: comp.description || '',
        ...(comp.checksumSha256 && {
          checksums: [
            {
              algorithm: 'SHA256',
              checksumValue: comp.checksumSha256,
            },
          ],
        }),
        externalRefs: comp.purl
          ? [
              {
                referenceCategory: 'PACKAGE-MANAGER',
                referenceType: 'purl',
                referenceLocator: comp.purl,
              },
            ]
          : [],
      })),
      relationships: [
        {
          spdxElementId: 'SPDXRef-DOCUMENT',
          relationshipType: 'DESCRIBES',
          relatedSpdxElement: 'SPDXRef-Package-1',
        },
      ],
    };

    const filename = `sbom-${data.project?.name || 'unknown'}-v${data.sbom.version}-spdx.json`;

    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.json(spdxDocument);
  } catch (error) {
    console.error('Error exporting SPDX:', error);
    return c.json({ error: 'Failed to export SPDX' }, 500);
  }
});

// Export SBOM as CycloneDX format
exportRouter.get('/sbom/:id/cyclonedx', async (c) => {
  try {
    const sbomId = c.req.param('id');
    const data = await getSbomData(sbomId);

    if (!data) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const cycloneDxDocument = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      serialNumber: `urn:uuid:${data.sbom.id}`,
      version: 1,
      metadata: {
        timestamp: new Date(data.sbom.createdAt).toISOString(),
        tools: [
          {
            name: 'SBOM Manager',
            version: '1.0.0',
          },
        ],
        ...(data.sbom.author && {
          authors: [
            {
              name: data.sbom.author,
            },
          ],
        }),
        component: {
          type: 'application',
          name: data.project?.name || 'Unknown',
          version: data.sbom.version,
          description: data.project?.description || '',
        },
      },
      components: data.components.map((comp) => ({
        type: 'library',
        'bom-ref': comp.id,
        name: comp.name,
        version: comp.version,
        ...(comp.supplier && { supplier: { name: comp.supplier } }),
        ...(comp.purl && { purl: comp.purl }),
        ...(comp.description && { description: comp.description }),
        ...(comp.license && {
          licenses: [
            {
              license: {
                id: comp.license,
              },
            },
          ],
        }),
        ...(comp.checksumSha256 && {
          hashes: [
            {
              alg: 'SHA-256',
              content: comp.checksumSha256,
            },
          ],
        }),
      })),
      ...(data.components.some((c) => c.vulnerabilities && c.vulnerabilities.length > 0) && {
        vulnerabilities: data.components.flatMap((comp) =>
          (comp.vulnerabilities || []).map((vuln) => ({
            'bom-ref': vuln.id,
            id: vuln.cveId,
            source: {
              name: 'NVD',
              url: `https://nvd.nist.gov/vuln/detail/${vuln.cveId}`,
            },
            ratings: [
              {
                severity: vuln.severity?.toUpperCase(),
                ...(vuln.cvssScore && { score: parseFloat(vuln.cvssScore) }),
              },
            ],
            description: vuln.description,
            ...(vuln.fixedVersion && {
              recommendation: `Upgrade to version ${vuln.fixedVersion}`,
            }),
            affects: [
              {
                ref: comp.id,
              },
            ],
          }))
        ),
      }),
    };

    const filename = `sbom-${data.project?.name || 'unknown'}-v${data.sbom.version}-cdx.json`;

    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.json(cycloneDxDocument);
  } catch (error) {
    console.error('Error exporting CycloneDX:', error);
    return c.json({ error: 'Failed to export CycloneDX' }, 500);
  }
});

export default exportRouter;
