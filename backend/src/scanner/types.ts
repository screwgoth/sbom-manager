// Core types for the scanner system

export interface Component {
  name: string;
  version: string;
  supplier?: string;
  license?: string;
  purl?: string;
  checksumSha256?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
  description?: string;
  origin?: string;
}

export interface ParseResult {
  ecosystem: string;
  components: Component[];
  metadata?: Record<string, any>;
}

export interface ScanResult {
  projectId: string;
  sbomId: string;
  ecosystem: string;
  componentsCount: number;
  components: Component[];
  sbomContent: any;
  filesProcessed?: Array<{ fileName: string; ecosystem: string; componentCount: number }>;
  ecosystems?: string[];
}

export enum Ecosystem {
  NPM = 'npm',
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust',
  UNKNOWN = 'unknown'
}

export interface Parser {
  ecosystem: Ecosystem;
  filePatterns: string[];
  parse(filePath: string, content: string): Promise<ParseResult>;
}
