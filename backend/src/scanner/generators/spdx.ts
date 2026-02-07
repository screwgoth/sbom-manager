import { Component } from '../types';
import { randomUUID } from 'crypto';

export interface SPDXDocument {
  spdxVersion: string;
  dataLicense: string;
  SPDXID: string;
  name: string;
  documentNamespace: string;
  creationInfo: {
    created: string;
    creators: string[];
    licenseListVersion?: string;
  };
  packages: SPDXPackage[];
  relationships: SPDXRelationship[];
  documentDescribes?: string[];
}

export interface SPDXPackage {
  SPDXID: string;
  name: string;
  versionInfo: string;
  downloadLocation?: string;
  filesAnalyzed?: boolean;
  supplier?: string;
  homepage?: string;
  licenseConcluded?: string;
  licenseDeclared?: string;
  copyrightText?: string;
  externalRefs?: SPDXExternalRef[];
  checksums?: SPDXChecksum[];
  description?: string;
  releaseDate?: string;
  builtDate?: string;
  validUntilDate?: string;
  comment?: string;
}

export interface SPDXExternalRef {
  referenceCategory: string;
  referenceType: string;
  referenceLocator: string;
}

export interface SPDXChecksum {
  algorithm: string;
  checksumValue: string;
}

export interface SPDXRelationship {
  spdxElementId: string;
  relationshipType: string;
  relatedSpdxElement: string;
}

export class SPDXGenerator {
  generateSPDX(
    projectName: string,
    projectVersion: string,
    components: Component[],
    author?: string,
    ecosystem?: string
  ): SPDXDocument {
    const timestamp = new Date().toISOString();
    const documentId = randomUUID();
    const namespace = `https://sbom-manager.local/${projectName}/${documentId}`;

    const spdxPackages: SPDXPackage[] = [];
    const relationships: SPDXRelationship[] = [];
    const packageIdMap = new Map<string, string>();

    // Create root package for the project
    const rootPackageId = 'SPDXRef-RootPackage';
    spdxPackages.push({
      SPDXID: rootPackageId,
      name: projectName,
      versionInfo: projectVersion,
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      supplier: 'Organization: ' + (author || 'Unknown'),
      description: `SBOM for ${projectName}`,
      copyrightText: 'NOASSERTION',
    });

    // Convert components to SPDX packages
    components.forEach((component, index) => {
      const packageId = `SPDXRef-Package-${this.sanitizeId(component.name)}-${index}`;
      packageIdMap.set(`${component.name}@${component.version}`, packageId);

      const spdxPackage: SPDXPackage = {
        SPDXID: packageId,
        name: component.name,
        versionInfo: component.version,
        downloadLocation: component.purl || 'NOASSERTION',
        filesAnalyzed: false,
        supplier: component.supplier ? `Organization: ${component.supplier}` : 'NOASSERTION',
        licenseDeclared: component.license || 'NOASSERTION',
        licenseConcluded: component.license || 'NOASSERTION',
        copyrightText: 'NOASSERTION',
        description: component.description || undefined,
      };

      // Add external references (PURL)
      if (component.purl) {
        spdxPackage.externalRefs = [
          {
            referenceCategory: 'PACKAGE-MANAGER',
            referenceType: 'purl',
            referenceLocator: component.purl,
          },
        ];
      }

      // Add checksums
      if (component.checksumSha256) {
        spdxPackage.checksums = [
          {
            algorithm: 'SHA256',
            checksumValue: component.checksumSha256,
          },
        ];
      }

      // Add metadata as comment (CERT-In additional fields)
      const certInFields: string[] = [];
      if (component.origin) certInFields.push(`Origin: ${component.origin}`);
      if (component.metadata?.criticality) certInFields.push(`Criticality: ${component.metadata.criticality}`);
      if (component.metadata?.usageRestrictions) certInFields.push(`Usage Restrictions: ${component.metadata.usageRestrictions}`);
      if (ecosystem) certInFields.push(`Ecosystem: ${ecosystem}`);
      
      if (certInFields.length > 0) {
        spdxPackage.comment = certInFields.join(' | ');
      }

      spdxPackages.push(spdxPackage);

      // Add relationship: root package DEPENDS_ON this package
      relationships.push({
        spdxElementId: rootPackageId,
        relationshipType: 'DEPENDS_ON',
        relatedSpdxElement: packageId,
      });
    });

    // Add dependency relationships
    components.forEach((component, index) => {
      const packageId = `SPDXRef-Package-${this.sanitizeId(component.name)}-${index}`;
      
      if (component.dependencies && component.dependencies.length > 0) {
        component.dependencies.forEach(depName => {
          // Try to find the dependency in our package map
          const depKey = Object.keys(Object.fromEntries(packageIdMap)).find(key => 
            key.startsWith(depName + '@')
          );
          
          if (depKey) {
            const depPackageId = packageIdMap.get(depKey);
            if (depPackageId) {
              relationships.push({
                spdxElementId: packageId,
                relationshipType: 'DEPENDS_ON',
                relatedSpdxElement: depPackageId,
              });
            }
          }
        });
      }
    });

    const spdxDocument: SPDXDocument = {
      spdxVersion: 'SPDX-2.3',
      dataLicense: 'CC0-1.0',
      SPDXID: 'SPDXRef-DOCUMENT',
      name: `${projectName}-${projectVersion}-sbom`,
      documentNamespace: namespace,
      creationInfo: {
        created: timestamp,
        creators: [
          'Tool: SBOM-Manager-1.0',
          author ? `Person: ${author}` : 'Organization: Unknown',
        ],
        licenseListVersion: '3.21',
      },
      packages: spdxPackages,
      relationships,
      documentDescribes: [rootPackageId],
    };

    return spdxDocument;
  }

  private sanitizeId(str: string): string {
    // SPDX IDs must be alphanumeric, dot, dash, or underscore
    return str.replace(/[^a-zA-Z0-9._-]/g, '-');
  }

  validateSPDX(doc: SPDXDocument): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!doc.spdxVersion) errors.push('Missing spdxVersion');
    if (!doc.dataLicense) errors.push('Missing dataLicense');
    if (!doc.SPDXID) errors.push('Missing SPDXID');
    if (!doc.name) errors.push('Missing name');
    if (!doc.documentNamespace) errors.push('Missing documentNamespace');
    if (!doc.creationInfo) errors.push('Missing creationInfo');
    if (!doc.packages || doc.packages.length === 0) errors.push('No packages defined');

    // Validate each package
    doc.packages?.forEach((pkg, idx) => {
      if (!pkg.SPDXID) errors.push(`Package ${idx}: Missing SPDXID`);
      if (!pkg.name) errors.push(`Package ${idx}: Missing name`);
      if (!pkg.versionInfo) errors.push(`Package ${idx}: Missing versionInfo`);
      if (pkg.downloadLocation === undefined) errors.push(`Package ${idx}: Missing downloadLocation`);
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
