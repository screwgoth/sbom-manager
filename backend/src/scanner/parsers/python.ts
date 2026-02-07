import { Parser, ParseResult, Ecosystem, Component } from '../types';

export class PythonParser implements Parser {
  ecosystem = Ecosystem.PYTHON;
  filePatterns = ['requirements.txt', 'Pipfile', 'Pipfile.lock', 'pyproject.toml'];

  async parse(filePath: string, content: string): Promise<ParseResult> {
    if (filePath.endsWith('requirements.txt')) {
      return this.parseRequirementsTxt(content);
    } else if (filePath.endsWith('Pipfile.lock')) {
      return this.parsePipfileLock(content);
    } else if (filePath.endsWith('Pipfile')) {
      return this.parsePipfile(content);
    } else if (filePath.endsWith('pyproject.toml')) {
      return this.parsePyprojectToml(content);
    }
    
    throw new Error('Unsupported Python dependency file');
  }

  private parseRequirementsTxt(content: string): ParseResult {
    const components: Component[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Skip -r includes, -e editable installs for now
      if (trimmed.startsWith('-r') || trimmed.startsWith('-e')) continue;

      // Parse package name and version
      const match = trimmed.match(/^([a-zA-Z0-9_-]+[a-zA-Z0-9._-]*)\s*([>=<~!]+)?\s*([0-9.]+.*)?/);
      
      if (match) {
        const [, name, operator, version] = match;
        
        components.push({
          name: name.toLowerCase(),
          version: version || 'unknown',
          supplier: 'PyPI',
          purl: `pkg:pypi/${name.toLowerCase()}${version ? `@${version}` : ''}`,
          origin: 'pypi',
          metadata: {
            ecosystem: 'python',
            versionOperator: operator,
          },
        });
      }
    }

    return {
      ecosystem: 'python',
      components,
    };
  }

  private parsePipfile(content: string): ParseResult {
    const components: Component[] = [];
    
    // Basic TOML parsing for Pipfile
    const lines = content.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect sections
      if (trimmed.startsWith('[')) {
        currentSection = trimmed.replace(/[\[\]]/g, '');
        continue;
      }
      
      // Parse dependencies in [packages] or [dev-packages]
      if ((currentSection === 'packages' || currentSection === 'dev-packages') && trimmed.includes('=')) {
        const [name, versionSpec] = trimmed.split('=').map(s => s.trim());
        const cleanName = name.replace(/['"]/g, '');
        const cleanVersion = versionSpec.replace(/['"]/g, '').replace('==', '');
        
        components.push({
          name: cleanName.toLowerCase(),
          version: cleanVersion === '*' ? 'latest' : cleanVersion,
          supplier: 'PyPI',
          purl: `pkg:pypi/${cleanName.toLowerCase()}@${cleanVersion}`,
          origin: 'pypi',
          metadata: {
            ecosystem: 'python',
            isDev: currentSection === 'dev-packages',
          },
        });
      }
    }

    return {
      ecosystem: 'python',
      components,
    };
  }

  private parsePipfileLock(content: string): ParseResult {
    const components: Component[] = [];
    
    try {
      const data = JSON.parse(content);
      
      // Parse default (production) packages
      if (data.default) {
        for (const [name, pkgData] of Object.entries(data.default)) {
          components.push(this.createPipfileLockComponent(name, pkgData as any, false));
        }
      }
      
      // Parse develop (dev) packages
      if (data.develop) {
        for (const [name, pkgData] of Object.entries(data.develop)) {
          components.push(this.createPipfileLockComponent(name, pkgData as any, true));
        }
      }

      return {
        ecosystem: 'python',
        components,
        metadata: {
          pythonVersion: data._meta?.requires?.python_version,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse Pipfile.lock: ${error}`);
    }
  }

  private createPipfileLockComponent(name: string, pkgData: any, isDev: boolean): Component {
    const version = pkgData.version?.replace('==', '') || 'unknown';
    
    return {
      name: name.toLowerCase(),
      version,
      supplier: 'PyPI',
      purl: `pkg:pypi/${name.toLowerCase()}@${version}`,
      checksumSha256: this.extractSha256FromHashes(pkgData.hashes),
      origin: 'pypi',
      metadata: {
        ecosystem: 'python',
        isDev,
        index: pkgData.index,
        markers: pkgData.markers,
      },
    };
  }

  private parsePyprojectToml(content: string): ParseResult {
    const components: Component[] = [];
    
    // Basic TOML parsing for pyproject.toml
    const lines = content.split('\n');
    let inDependencies = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect dependencies section
      if (trimmed.includes('dependencies') && trimmed.includes('[')) {
        inDependencies = true;
        continue;
      }
      
      // Exit dependencies section
      if (inDependencies && trimmed.startsWith('[')) {
        inDependencies = false;
        continue;
      }
      
      // Parse dependency lines
      if (inDependencies && trimmed.startsWith('"')) {
        const match = trimmed.match(/"([a-zA-Z0-9_-]+)\s*([>=<~!]+)?\s*([0-9.]+.*)?"*/);
        if (match) {
          const [, name, operator, version] = match;
          
          components.push({
            name: name.toLowerCase(),
            version: version || 'unknown',
            supplier: 'PyPI',
            purl: `pkg:pypi/${name.toLowerCase()}${version ? `@${version}` : ''}`,
            origin: 'pypi',
            metadata: {
              ecosystem: 'python',
              versionOperator: operator,
            },
          });
        }
      }
    }

    return {
      ecosystem: 'python',
      components,
    };
  }

  private extractSha256FromHashes(hashes: string[] | undefined): string | undefined {
    if (!hashes || hashes.length === 0) return undefined;
    
    // Find sha256 hash
    const sha256Hash = hashes.find(h => h.startsWith('sha256:'));
    return sha256Hash?.replace('sha256:', '');
  }
}
