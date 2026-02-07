import { promises as fs } from 'fs';
import * as path from 'path';
import { getParserForFile } from './parsers';
import { SPDXGenerator } from './generators/spdx';
import { Component, Ecosystem, ScanResult } from './types';
import { db, sboms, components } from '../db';

export interface ScanOptions {
  projectId: string;
  projectName: string;
  projectVersion?: string;
  author?: string;
}

export class ScannerService {
  private spdxGenerator: SPDXGenerator;

  constructor() {
    this.spdxGenerator = new SPDXGenerator();
  }

  /**
   * Scan a directory for dependency files and generate SBOM
   */
  async scanDirectory(dirPath: string, options: ScanOptions): Promise<ScanResult> {
    const files = await this.findDependencyFiles(dirPath);
    
    if (files.length === 0) {
      throw new Error('No dependency files found in the directory');
    }

    return this.scanFiles(files, options);
  }

  /**
   * Scan uploaded dependency files and generate SBOM
   */
  async scanFiles(filePaths: string[], options: ScanOptions): Promise<ScanResult> {
    const allComponents: Component[] = [];
    let detectedEcosystem: Ecosystem = Ecosystem.UNKNOWN;

    // Parse each file
    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      const parser = getParserForFile(fileName);

      if (!parser) {
        console.warn(`No parser found for file: ${fileName}`);
        continue;
      }

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parseResult = await parser.parse(fileName, content);
        
        allComponents.push(...parseResult.components);
        detectedEcosystem = parser.ecosystem;
      } catch (error) {
        console.error(`Error parsing ${fileName}:`, error);
        throw new Error(`Failed to parse ${fileName}: ${error}`);
      }
    }

    // Deduplicate components by name@version
    const uniqueComponents = this.deduplicateComponents(allComponents);

    // Generate SPDX SBOM
    const spdxDoc = this.spdxGenerator.generateSPDX(
      options.projectName,
      options.projectVersion || '1.0.0',
      uniqueComponents,
      options.author,
      detectedEcosystem
    );

    // Validate SBOM
    const validation = this.spdxGenerator.validateSPDX(spdxDoc);
    if (!validation.valid) {
      throw new Error(`Invalid SBOM: ${validation.errors.join(', ')}`);
    }

    // Store SBOM in database
    const newSbom = await db.insert(sboms).values({
      projectId: options.projectId,
      version: options.projectVersion || '1.0.0',
      format: 'spdx',
      author: options.author,
      rawContent: spdxDoc,
    }).returning();

    const sbomId = newSbom[0].id;

    // Store components in database
    if (uniqueComponents.length > 0) {
      const componentsData = uniqueComponents.map(comp => ({
        sbomId,
        name: comp.name,
        version: comp.version,
        supplier: comp.supplier,
        license: comp.license,
        purl: comp.purl,
        checksumSha256: comp.checksumSha256,
        dependencies: comp.dependencies,
        metadata: comp.metadata,
        description: comp.description,
        origin: comp.origin,
      }));

      await db.insert(components).values(componentsData);
    }

    return {
      projectId: options.projectId,
      sbomId,
      ecosystem: detectedEcosystem,
      componentsCount: uniqueComponents.length,
      components: uniqueComponents,
      sbomContent: spdxDoc,
    };
  }

  /**
   * Find all dependency files in a directory
   */
  private async findDependencyFiles(dirPath: string): Promise<string[]> {
    const dependencyFilePatterns = [
      'package.json',
      'package-lock.json',
      'requirements.txt',
      'Pipfile',
      'Pipfile.lock',
      'pyproject.toml',
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'go.mod',
      'go.sum',
      'Cargo.toml',
      'Cargo.lock',
    ];

    const foundFiles: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && dependencyFilePatterns.includes(entry.name)) {
          foundFiles.push(path.join(dirPath, entry.name));
        }
      }
    } catch (error) {
      throw new Error(`Failed to scan directory: ${error}`);
    }

    return foundFiles;
  }

  /**
   * Detect ecosystem from file names
   */
  detectEcosystem(fileNames: string[]): Ecosystem {
    for (const fileName of fileNames) {
      if (fileName.includes('package.json') || fileName.includes('package-lock.json')) {
        return Ecosystem.NPM;
      }
      if (fileName.includes('requirements.txt') || fileName.includes('Pipfile') || fileName.includes('pyproject.toml')) {
        return Ecosystem.PYTHON;
      }
      if (fileName.includes('pom.xml') || fileName.includes('build.gradle')) {
        return Ecosystem.JAVA;
      }
      if (fileName.includes('go.mod') || fileName.includes('go.sum')) {
        return Ecosystem.GO;
      }
      if (fileName.includes('Cargo.toml') || fileName.includes('Cargo.lock')) {
        return Ecosystem.RUST;
      }
    }
    
    return Ecosystem.UNKNOWN;
  }

  /**
   * Deduplicate components by name@version
   */
  private deduplicateComponents(components: Component[]): Component[] {
    const seen = new Map<string, Component>();

    for (const component of components) {
      const key = `${component.name}@${component.version}`;
      
      // Keep first occurrence or merge if needed
      if (!seen.has(key)) {
        seen.set(key, component);
      }
    }

    return Array.from(seen.values());
  }
}
