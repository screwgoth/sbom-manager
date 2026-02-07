import { Parser, ParseResult, Ecosystem, Component } from '../types';

export class RustParser implements Parser {
  ecosystem = Ecosystem.RUST;
  filePatterns = ['Cargo.toml', 'Cargo.lock'];

  async parse(filePath: string, content: string): Promise<ParseResult> {
    if (filePath.endsWith('Cargo.toml')) {
      return this.parseCargoToml(content);
    } else if (filePath.endsWith('Cargo.lock')) {
      return this.parseCargoLock(content);
    }
    
    throw new Error('Unsupported Rust dependency file');
  }

  private parseCargoToml(content: string): ParseResult {
    const components: Component[] = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let packageName = '';
    let packageVersion = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect sections
      if (trimmed.startsWith('[')) {
        currentSection = trimmed.replace(/[\[\]]/g, '');
        continue;
      }
      
      // Extract package metadata
      if (currentSection === 'package') {
        if (trimmed.startsWith('name =')) {
          packageName = this.extractTomlValue(trimmed);
        } else if (trimmed.startsWith('version =')) {
          packageVersion = this.extractTomlValue(trimmed);
        }
        continue;
      }
      
      // Parse dependencies
      if ((currentSection === 'dependencies' || currentSection === 'dev-dependencies' || currentSection === 'build-dependencies') && trimmed.includes('=')) {
        const component = this.parseCargoTomlDependency(trimmed, currentSection);
        if (component) {
          components.push(component);
        }
      }
    }

    return {
      ecosystem: 'rust',
      components,
      metadata: {
        packageName,
        packageVersion,
      },
    };
  }

  private parseCargoLock(content: string): ParseResult {
    const components: Component[] = [];
    const lines = content.split('\n');
    
    let currentPackage: any = {};
    let inPackageBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect package blocks
      if (trimmed === '[[package]]') {
        // Save previous package
        if (currentPackage.name && currentPackage.version) {
          components.push(this.createRustComponent(currentPackage));
        }
        
        currentPackage = {};
        inPackageBlock = true;
        continue;
      }
      
      if (inPackageBlock) {
        if (trimmed.startsWith('name =')) {
          currentPackage.name = this.extractTomlValue(trimmed);
        } else if (trimmed.startsWith('version =')) {
          currentPackage.version = this.extractTomlValue(trimmed);
        } else if (trimmed.startsWith('source =')) {
          currentPackage.source = this.extractTomlValue(trimmed);
        } else if (trimmed.startsWith('checksum =')) {
          currentPackage.checksum = this.extractTomlValue(trimmed);
        } else if (trimmed.startsWith('dependencies =')) {
          // Dependencies are in array format, parse if needed
          currentPackage.hasDependencies = true;
        }
      }
    }
    
    // Save last package
    if (currentPackage.name && currentPackage.version) {
      components.push(this.createRustComponent(currentPackage));
    }

    return {
      ecosystem: 'rust',
      components,
    };
  }

  private parseCargoTomlDependency(line: string, section: string): Component | null {
    const parts = line.split('=').map(s => s.trim());
    if (parts.length < 2) return null;
    
    const name = parts[0].replace(/['"]/g, '');
    const valueStr = parts.slice(1).join('=');
    
    let version = '';
    let features: string[] = [];
    
    // Simple version: name = "1.0"
    if (valueStr.startsWith('"') && !valueStr.includes('{')) {
      version = this.extractTomlValue(line);
    } else if (valueStr.includes('{')) {
      // Complex format: name = { version = "1.0", features = ["foo"] }
      const versionMatch = valueStr.match(/version\s*=\s*"([^"]+)"/);
      if (versionMatch) {
        version = versionMatch[1];
      }
      
      const featuresMatch = valueStr.match(/features\s*=\s*\[([^\]]+)\]/);
      if (featuresMatch) {
        features = featuresMatch[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
      }
    }
    
    return {
      name,
      version: version || 'unknown',
      supplier: 'crates.io',
      purl: `pkg:cargo/${name}${version ? `@${version}` : ''}`,
      origin: 'crates.io',
      metadata: {
        ecosystem: 'rust',
        isDev: section === 'dev-dependencies',
        isBuild: section === 'build-dependencies',
        features,
      },
    };
  }

  private createRustComponent(pkgData: any): Component {
    return {
      name: pkgData.name,
      version: pkgData.version,
      supplier: 'crates.io',
      purl: `pkg:cargo/${pkgData.name}@${pkgData.version}`,
      checksumSha256: pkgData.checksum,
      origin: 'crates.io',
      metadata: {
        ecosystem: 'rust',
        source: pkgData.source,
      },
    };
  }

  private extractTomlValue(line: string): string {
    // Extract value from TOML line: key = "value" or key = 'value'
    const match = line.match(/=\s*["']([^"']+)["']/);
    return match ? match[1] : '';
  }
}
