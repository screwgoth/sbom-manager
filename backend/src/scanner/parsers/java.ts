import { Parser, ParseResult, Ecosystem, Component } from '../types';

export class JavaParser implements Parser {
  ecosystem = Ecosystem.JAVA;
  filePatterns = ['pom.xml', 'build.gradle', 'build.gradle.kts'];

  async parse(filePath: string, content: string): Promise<ParseResult> {
    if (filePath.endsWith('pom.xml')) {
      return this.parsePomXml(content);
    } else if (filePath.endsWith('build.gradle') || filePath.endsWith('build.gradle.kts')) {
      return this.parseGradle(content, filePath.endsWith('.kts'));
    }
    
    throw new Error('Unsupported Java dependency file');
  }

  private parsePomXml(content: string): ParseResult {
    const components: Component[] = [];
    
    // Parse XML dependencies using regex (simple approach)
    const dependencyRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
    const matches = content.matchAll(dependencyRegex);

    for (const match of matches) {
      const depBlock = match[1];
      
      const groupId = this.extractXmlTag(depBlock, 'groupId');
      const artifactId = this.extractXmlTag(depBlock, 'artifactId');
      const version = this.extractXmlTag(depBlock, 'version');
      const scope = this.extractXmlTag(depBlock, 'scope');
      const optional = this.extractXmlTag(depBlock, 'optional');

      if (groupId && artifactId) {
        const name = `${groupId}:${artifactId}`;
        const cleanVersion = version?.replace(/[\$\{\}]/g, '') || 'unknown';
        
        components.push({
          name,
          version: cleanVersion,
          supplier: 'Maven Central',
          purl: `pkg:maven/${groupId}/${artifactId}${version ? `@${cleanVersion}` : ''}`,
          origin: 'maven',
          metadata: {
            ecosystem: 'java',
            groupId,
            artifactId,
            scope: scope || 'compile',
            optional: optional === 'true',
          },
        });
      }
    }

    // Extract project metadata
    const projectGroupId = this.extractXmlTag(content, 'groupId');
    const projectArtifactId = this.extractXmlTag(content, 'artifactId');
    const projectVersion = this.extractXmlTag(content, 'version');

    return {
      ecosystem: 'java',
      components,
      metadata: {
        buildTool: 'maven',
        projectGroupId,
        projectArtifactId,
        projectVersion,
      },
    };
  }

  private parseGradle(content: string, isKotlinDsl: boolean): ParseResult {
    const components: Component[] = [];
    
    // Parse Gradle dependencies using regex
    // Matches: implementation 'group:artifact:version'
    // Matches: implementation("group:artifact:version")
    // Matches: implementation group: 'group', name: 'artifact', version: 'version'
    
    const patterns = [
      // String notation: 'group:artifact:version'
      /(?:implementation|api|compile|runtime|testImplementation|testCompile)\s*[("']\s*([^:]+):([^:]+):([^"')]+)\s*["')]/g,
      // Map notation: group: 'x', name: 'y', version: 'z'
      /(?:implementation|api|compile|runtime|testImplementation|testCompile)\s*(?:group|name|version):\s*["']([^"']+)["']/g,
    ];

    // Try string notation first
    const stringMatches = content.matchAll(patterns[0]);
    for (const match of stringMatches) {
      const [, groupId, artifactId, version] = match;
      const name = `${groupId}:${artifactId}`;
      
      components.push({
        name,
        version,
        supplier: 'Maven Central',
        purl: `pkg:maven/${groupId}/${artifactId}@${version}`,
        origin: 'maven',
        metadata: {
          ecosystem: 'java',
          buildTool: 'gradle',
          groupId,
          artifactId,
        },
      });
    }

    // Also try to extract from plugins
    const pluginRegex = /id\s+["']([^"']+)["']\s+version\s+["']([^"']+)["']/g;
    const pluginMatches = content.matchAll(pluginRegex);
    
    for (const match of pluginMatches) {
      const [, pluginId, version] = match;
      
      components.push({
        name: pluginId,
        version,
        supplier: 'Gradle Plugin Portal',
        purl: `pkg:gradle/${pluginId}@${version}`,
        origin: 'gradle-plugin',
        metadata: {
          ecosystem: 'java',
          buildTool: 'gradle',
          type: 'plugin',
        },
      });
    }

    return {
      ecosystem: 'java',
      components,
      metadata: {
        buildTool: 'gradle',
        kotlinDsl: isKotlinDsl,
      },
    };
  }

  private extractXmlTag(content: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}>([^<]+)<\/${tagName}>`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }
}
