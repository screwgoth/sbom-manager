import { Parser, ParseResult, Ecosystem, Component } from '../types';

export class GoParser implements Parser {
  ecosystem = Ecosystem.GO;
  filePatterns = ['go.mod', 'go.sum'];

  async parse(filePath: string, content: string): Promise<ParseResult> {
    if (filePath.endsWith('go.mod')) {
      return this.parseGoMod(content);
    } else if (filePath.endsWith('go.sum')) {
      return this.parseGoSum(content);
    }
    
    throw new Error('Unsupported Go dependency file');
  }

  private parseGoMod(content: string): ParseResult {
    const components: Component[] = [];
    const lines = content.split('\n');
    
    let inRequireBlock = false;
    let moduleName = '';
    let goVersion = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract module name
      if (trimmed.startsWith('module ')) {
        moduleName = trimmed.replace('module ', '');
        continue;
      }
      
      // Extract Go version
      if (trimmed.startsWith('go ')) {
        goVersion = trimmed.replace('go ', '');
        continue;
      }
      
      // Detect require block
      if (trimmed.startsWith('require (')) {
        inRequireBlock = true;
        continue;
      }
      
      // Exit require block
      if (inRequireBlock && trimmed === ')') {
        inRequireBlock = false;
        continue;
      }
      
      // Parse single-line require
      if (trimmed.startsWith('require ') && !trimmed.includes('(')) {
        const match = trimmed.match(/require\s+([^\s]+)\s+v?([^\s]+)/);
        if (match) {
          const [, name, version] = match;
          components.push(this.createGoComponent(name, version, trimmed.includes('// indirect')));
        }
        continue;
      }
      
      // Parse require block entries
      if (inRequireBlock && trimmed) {
        const match = trimmed.match(/([^\s]+)\s+v?([^\s]+)/);
        if (match) {
          const [, name, version] = match;
          components.push(this.createGoComponent(name, version, trimmed.includes('// indirect')));
        }
      }
    }

    return {
      ecosystem: 'go',
      components,
      metadata: {
        moduleName,
        goVersion,
      },
    };
  }

  private parseGoSum(content: string): ParseResult {
    const components: Component[] = [];
    const lines = content.split('\n');
    const seen = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // go.sum format: module version hash
      // Example: github.com/user/repo v1.2.3 h1:abc123...
      // Example: github.com/user/repo v1.2.3/go.mod h1:abc123...
      
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const name = parts[0];
        let version = parts[1];
        const hash = parts[2];
        
        // Skip go.mod entries (they duplicate the main entry)
        if (version.includes('/go.mod')) continue;
        
        // Remove 'v' prefix if present
        version = version.replace(/^v/, '');
        
        // Deduplicate
        const key = `${name}@${version}`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        components.push({
          name,
          version,
          supplier: 'Go Modules',
          purl: `pkg:golang/${name}@${version}`,
          checksumSha256: hash.startsWith('h1:') ? hash.substring(3) : undefined,
          origin: 'golang',
          metadata: {
            ecosystem: 'go',
            hash,
          },
        });
      }
    }

    return {
      ecosystem: 'go',
      components,
    };
  }

  private createGoComponent(name: string, version: string, indirect: boolean): Component {
    return {
      name,
      version,
      supplier: 'Go Modules',
      purl: `pkg:golang/${name}@${version}`,
      origin: 'golang',
      metadata: {
        ecosystem: 'go',
        indirect,
      },
    };
  }
}
