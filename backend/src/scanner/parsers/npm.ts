import { Parser, ParseResult, Ecosystem, Component } from '../types';

export class NpmParser implements Parser {
  ecosystem = Ecosystem.NPM;
  filePatterns = ['package.json', 'package-lock.json'];

  async parse(filePath: string, content: string): Promise<ParseResult> {
    const components: Component[] = [];
    
    try {
      const data = JSON.parse(content);
      
      if (filePath.endsWith('package-lock.json')) {
        // Parse package-lock.json (more detailed)
        return this.parsePackageLock(data);
      } else {
        // Parse package.json
        return this.parsePackageJson(data);
      }
    } catch (error) {
      throw new Error(`Failed to parse NPM file: ${error}`);
    }
  }

  private parsePackageJson(data: any): ParseResult {
    const components: Component[] = [];
    
    // Parse dependencies
    const allDeps = {
      ...data.dependencies,
      ...data.devDependencies,
      ...data.peerDependencies,
      ...data.optionalDependencies,
    };

    for (const [name, version] of Object.entries(allDeps)) {
      components.push({
        name,
        version: this.cleanVersion(version as string),
        supplier: 'npm',
        purl: `pkg:npm/${name}@${this.cleanVersion(version as string)}`,
        origin: 'npm',
        metadata: {
          ecosystem: 'npm',
          isDev: data.devDependencies?.[name] !== undefined,
          isPeer: data.peerDependencies?.[name] !== undefined,
          isOptional: data.optionalDependencies?.[name] !== undefined,
        },
      });
    }

    return {
      ecosystem: 'npm',
      components,
      metadata: {
        projectName: data.name,
        projectVersion: data.version,
        description: data.description,
        license: data.license,
      },
    };
  }

  private parsePackageLock(data: any): ParseResult {
    const components: Component[] = [];
    
    // package-lock.json v2/v3 format
    const packages = data.packages || {};
    const dependencies = data.dependencies || {};

    // Process packages (lockfileVersion >= 2)
    if (Object.keys(packages).length > 0) {
      for (const [pkgPath, pkgData] of Object.entries(packages)) {
        if (pkgPath === '') continue; // Skip root package
        
        const name = pkgData.name || pkgPath.replace(/^node_modules\//, '');
        const version = pkgData.version;
        
        if (!version) continue;

        components.push({
          name,
          version,
          supplier: 'npm',
          license: pkgData.license,
          purl: `pkg:npm/${name}@${version}`,
          checksumSha256: pkgData.integrity ? this.extractSha256(pkgData.integrity) : undefined,
          dependencies: pkgData.dependencies ? Object.keys(pkgData.dependencies) : [],
          origin: 'npm',
          metadata: {
            ecosystem: 'npm',
            resolved: pkgData.resolved,
            dev: pkgData.dev || false,
            optional: pkgData.optional || false,
          },
        });
      }
    } else if (Object.keys(dependencies).length > 0) {
      // Fallback to old format (lockfileVersion 1)
      this.parseLegacyDependencies(dependencies, components);
    }

    return {
      ecosystem: 'npm',
      components,
      metadata: {
        lockfileVersion: data.lockfileVersion,
      },
    };
  }

  private parseLegacyDependencies(deps: any, components: Component[], prefix = '') {
    for (const [name, depData] of Object.entries(deps)) {
      const fullName = prefix ? `${prefix}/${name}` : name;
      
      components.push({
        name,
        version: depData.version,
        supplier: 'npm',
        purl: `pkg:npm/${name}@${depData.version}`,
        checksumSha256: depData.integrity ? this.extractSha256(depData.integrity) : undefined,
        dependencies: depData.requires ? Object.keys(depData.requires) : [],
        origin: 'npm',
        metadata: {
          ecosystem: 'npm',
          resolved: depData.resolved,
          dev: depData.dev || false,
        },
      });

      // Recursively process nested dependencies
      if (depData.dependencies) {
        this.parseLegacyDependencies(depData.dependencies, components, fullName);
      }
    }
  }

  private cleanVersion(version: string): string {
    // Remove npm version prefixes like ^, ~, >=, etc.
    return version.replace(/^[\^~>=<]+/, '');
  }

  private extractSha256(integrity: string): string | undefined {
    // Extract SHA-256 from integrity string (e.g., "sha512-abc..." or "sha256-abc...")
    if (integrity.startsWith('sha256-')) {
      return integrity.replace('sha256-', '');
    }
    return undefined;
  }
}
