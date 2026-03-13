import { Component, Ecosystem } from '../scanner/types';
import axios from 'axios';

/**
 * Rate limiter for NVD API calls
 * NVD limits: 5 requests per 30 seconds without API key
 */
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly delayMs: number;

  constructor(requestsPerInterval: number, intervalMs: number) {
    this.delayMs = intervalMs / requestsPerInterval;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.delayMs) {
        await this.sleep(this.delayMs - timeSinceLastRequest);
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface CPEMatch {
  cpeNameId: string;
  criteria: string;
  matchCriteriaId?: string;
  versionStartIncluding?: string;
  versionEndExcluding?: string;
}

interface CPEProduct {
  cpe: {
    cpeName: string;
    cpeNameId: string;
    lastModified?: string;
    created?: string;
    deprecated?: boolean;
    titles?: Array<{ title: string; lang: string }>;
    refs?: Array<{ ref: string; type?: string }>;
  };
}

interface NVDCPEResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  format: string;
  version: string;
  timestamp: string;
  products?: CPEProduct[];
}

interface EnrichmentResult {
  purl?: string;
  cpe?: string;
  swid?: string;
  dependencyRelationship?: string;
  metadata?: Record<string, any>;
}

export class EnrichmentService {
  private nvdRateLimiter: RateLimiter;
  private cpeCache = new Map<string, string | null>();
  private readonly NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cpes/2.0';

  constructor() {
    // 5 requests per 30 seconds for NVD API without key
    this.nvdRateLimiter = new RateLimiter(5, 30000);
  }

  /**
   * Enrich a single component with missing metadata
   */
  async enrichComponent(
    component: Component,
    ecosystem: Ecosystem,
    lockFileData?: any,
    projectName?: string
  ): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {};

    try {
      // Generate PURL if missing
      if (!component.purl) {
        result.purl = this.generatePURL(component.name, component.version, ecosystem);
      }

      // Fetch CPE if missing
      if (!component.cpe) {
        result.cpe = await this.fetchCPE(component.name, component.version, ecosystem);
      }

      // Attempt to find SWID tags (rare, but try)
      if (!component.swid) {
        result.swid = await this.fetchSWID(component.name, component.version, ecosystem);
      }

      // Determine dependency relationship if missing
      if (!component.dependencyRelationship && lockFileData) {
        result.dependencyRelationship = this.determineDependencyRelationship(
          component.name,
          lockFileData,
          projectName
        );
      }

      return result;
    } catch (error) {
      console.error(`[Enrichment] Failed to enrich ${component.name}@${component.version}:`, error);
      return result; // Return partial data
    }
  }

  /**
   * Enrich multiple components in batch
   */
  async enrichComponents(
    components: Component[],
    ecosystem: Ecosystem,
    lockFileData?: any,
    projectName?: string
  ): Promise<Component[]> {
    const enriched: Component[] = [];

    for (const component of components) {
      try {
        const enrichmentData = await this.enrichComponent(
          component,
          ecosystem,
          lockFileData,
          projectName
        );

        enriched.push({
          ...component,
          purl: enrichmentData.purl || component.purl,
          cpe: enrichmentData.cpe || component.cpe,
          swid: enrichmentData.swid || component.swid,
          dependencyRelationship: enrichmentData.dependencyRelationship || component.dependencyRelationship,
          metadata: {
            ...component.metadata,
            ...enrichmentData.metadata,
          },
        });
      } catch (error) {
        console.error(`[Enrichment] Error enriching component ${component.name}:`, error);
        enriched.push(component); // Add original component on error
      }
    }

    return enriched;
  }

  /**
   * Generate Package URL (PURL) from component data
   * Spec: https://github.com/package-url/purl-spec
   */
  private generatePURL(name: string, version: string, ecosystem: Ecosystem): string {
    const ecosystemMap: Record<string, string> = {
      [Ecosystem.NPM]: 'npm',
      [Ecosystem.PYTHON]: 'pypi',
      [Ecosystem.JAVA]: 'maven',
      [Ecosystem.GO]: 'golang',
      [Ecosystem.RUST]: 'cargo',
    };

    const purlType = ecosystemMap[ecosystem] || ecosystem;

    // Handle scoped NPM packages
    if (ecosystem === Ecosystem.NPM && name.startsWith('@')) {
      const [namespace, packageName] = name.slice(1).split('/');
      return `pkg:${purlType}/${namespace}/${packageName}@${version}`;
    }

    // Handle Maven coordinates (groupId:artifactId)
    if (ecosystem === Ecosystem.JAVA && name.includes(':')) {
      const [groupId, artifactId] = name.split(':');
      return `pkg:${purlType}/${groupId}/${artifactId}@${version}`;
    }

    // Standard format
    return `pkg:${purlType}/${encodeURIComponent(name)}@${version}`;
  }

  /**
   * Fetch CPE (Common Platform Enumeration) from NVD API
   */
  private async fetchCPE(name: string, version: string, ecosystem: Ecosystem): Promise<string | undefined> {
    const cacheKey = `${name}@${version}`;

    // Check cache first
    if (this.cpeCache.has(cacheKey)) {
      const cached = this.cpeCache.get(cacheKey);
      return cached || undefined;
    }

    try {
      // Normalize package name for search
      const searchTerm = this.normalizePackageName(name);

      const cpe = await this.nvdRateLimiter.execute(async () => {
        try {
          console.log(`[Enrichment] Querying NVD CPE for: ${searchTerm}`);
          
          const response = await axios.get<NVDCPEResponse>(this.NVD_API_BASE, {
            params: {
              keywordSearch: searchTerm,
              resultsPerPage: 5,
            },
            timeout: 10000,
          });

          if (response.data.products && response.data.products.length > 0) {
            // Find best match
            for (const product of response.data.products) {
              const cpeName = product.cpe.cpeName;
              
              // Check if CPE matches our package and version
              if (this.isCPEMatch(cpeName, name, version)) {
                console.log(`[Enrichment] Found CPE match: ${cpeName}`);
                return cpeName;
              }
            }

            // If no exact match, use first result but modify version
            const firstCPE = response.data.products[0].cpe.cpeName;
            const modifiedCPE = this.updateCPEVersion(firstCPE, version);
            console.log(`[Enrichment] Using modified CPE: ${modifiedCPE}`);
            return modifiedCPE;
          }

          // No results found, construct a CPE
          const constructedCPE = this.constructCPE(name, version, ecosystem);
          console.log(`[Enrichment] Constructed CPE: ${constructedCPE}`);
          return constructedCPE;
        } catch (error: any) {
          if (error.response?.status === 403) {
            console.warn('[Enrichment] NVD API rate limit exceeded, using constructed CPE');
          } else {
            console.error('[Enrichment] NVD API error:', error.message);
          }
          return this.constructCPE(name, version, ecosystem);
        }
      });

      // Cache result
      this.cpeCache.set(cacheKey, cpe || null);
      return cpe;
    } catch (error) {
      console.error(`[Enrichment] Failed to fetch CPE for ${name}:`, error);
      return this.constructCPE(name, version, ecosystem);
    }
  }

  /**
   * Normalize package name for CPE search
   */
  private normalizePackageName(name: string): string {
    // Remove scopes from NPM packages (@org/package -> package)
    let normalized = name.replace(/^@[^/]+\//, '');
    
    // Remove special characters
    normalized = normalized.replace(/[^a-zA-Z0-9-_.]/g, '_');
    
    return normalized;
  }

  /**
   * Check if a CPE matches the package name and version
   */
  private isCPEMatch(cpeName: string, packageName: string, version: string): boolean {
    const normalizedName = this.normalizePackageName(packageName).toLowerCase();
    const cpeNameLower = cpeName.toLowerCase();
    const versionNormalized = version.replace(/[^0-9.]/g, '');

    return cpeNameLower.includes(normalizedName) && cpeNameLower.includes(versionNormalized);
  }

  /**
   * Update version in existing CPE string
   */
  private updateCPEVersion(cpeName: string, version: string): string {
    const parts = cpeName.split(':');
    if (parts.length >= 6) {
      parts[5] = version; // Version is at index 5 in CPE 2.3
    }
    return parts.join(':');
  }

  /**
   * Construct a CPE string manually
   * Format: cpe:2.3:a:vendor:product:version:*:*:*:*:*:*:*
   */
  private constructCPE(name: string, version: string, ecosystem: Ecosystem): string {
    const normalizedName = this.normalizePackageName(name).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    
    // Try to determine vendor
    let vendor = '*';
    if (name.startsWith('@')) {
      vendor = name.split('/')[0].slice(1).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    }

    // Construct CPE 2.3 format
    return `cpe:2.3:a:${vendor}:${normalizedName}:${version}:*:*:*:*:*:*:*`;
  }

  /**
   * Attempt to fetch SWID tags (Software Identification Tags)
   * Note: SWID tags are rare in package registries, so this often returns null
   */
  private async fetchSWID(name: string, version: string, ecosystem: Ecosystem): Promise<string | undefined> {
    try {
      // For NPM, check if package metadata contains SWID
      if (ecosystem === Ecosystem.NPM) {
        const response = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
          timeout: 5000,
        });

        const versionData = response.data.versions?.[version];
        if (versionData?.swid) {
          return versionData.swid;
        }
      }

      // For Python/PyPI
      if (ecosystem === Ecosystem.PYTHON) {
        const response = await axios.get(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`, {
          timeout: 5000,
        });

        if (response.data.info?.swid) {
          return response.data.info.swid;
        }
      }

      // SWID tags are not commonly available
      return undefined;
    } catch (error) {
      // SWID is optional, don't log errors
      return undefined;
    }
  }

  /**
   * Determine dependency relationship from lock file data
   */
  private determineDependencyRelationship(
    packageName: string,
    lockFileData: any,
    projectName?: string
  ): string {
    if (!lockFileData) {
      return 'Unknown';
    }

    // NPM package-lock.json
    if (lockFileData.packages) {
      const packages = lockFileData.packages;
      
      // Check if it's a direct dependency (in root package)
      const rootPackage = packages[''];
      if (rootPackage) {
        if (rootPackage.dependencies?.[packageName]) {
          return `Direct dependency of ${projectName || 'project'}`;
        }
        if (rootPackage.devDependencies?.[packageName]) {
          return `Development dependency of ${projectName || 'project'}`;
        }
        if (rootPackage.optionalDependencies?.[packageName]) {
          return `Optional dependency of ${projectName || 'project'}`;
        }
      }

      // Find which package depends on this one (transitive)
      for (const [pkgPath, pkgData] of Object.entries(packages)) {
        if (pkgPath === '') continue;
        
        const pkg = pkgData as any;
        if (pkg.dependencies?.[packageName]) {
          const parentName = pkg.name || pkgPath.replace(/^node_modules\//, '').split('/node_modules/')[0];
          return `Transitive dependency via ${parentName}`;
        }
      }
    }

    // Python requirements.txt or Pipfile
    if (lockFileData.default || lockFileData.develop) {
      if (lockFileData.default?.[packageName]) {
        return `Direct dependency of ${projectName || 'project'}`;
      }
      if (lockFileData.develop?.[packageName]) {
        return `Development dependency of ${projectName || 'project'}`;
      }
    }

    return 'Unknown relationship';
  }

  /**
   * Clear the CPE cache (useful for testing or periodic cleanup)
   */
  clearCache(): void {
    this.cpeCache.clear();
    console.log('[Enrichment] Cache cleared');
  }
}
