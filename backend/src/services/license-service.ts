import { db, components } from '../db';
import { eq } from 'drizzle-orm';

// SPDX License List (commonly used licenses)
const SPDX_LICENSES: Record<string, {
  id: string;
  name: string;
  category: 'permissive' | 'weak-copyleft' | 'strong-copyleft' | 'proprietary' | 'public-domain';
  riskLevel: 'low' | 'medium' | 'high';
}> = {
  'MIT': { id: 'MIT', name: 'MIT License', category: 'permissive', riskLevel: 'low' },
  'Apache-2.0': { id: 'Apache-2.0', name: 'Apache License 2.0', category: 'permissive', riskLevel: 'low' },
  'BSD-2-Clause': { id: 'BSD-2-Clause', name: 'BSD 2-Clause License', category: 'permissive', riskLevel: 'low' },
  'BSD-3-Clause': { id: 'BSD-3-Clause', name: 'BSD 3-Clause License', category: 'permissive', riskLevel: 'low' },
  'ISC': { id: 'ISC', name: 'ISC License', category: 'permissive', riskLevel: 'low' },
  'GPL-2.0': { id: 'GPL-2.0', name: 'GNU General Public License v2.0', category: 'strong-copyleft', riskLevel: 'high' },
  'GPL-3.0': { id: 'GPL-3.0', name: 'GNU General Public License v3.0', category: 'strong-copyleft', riskLevel: 'high' },
  'AGPL-3.0': { id: 'AGPL-3.0', name: 'GNU Affero General Public License v3.0', category: 'strong-copyleft', riskLevel: 'high' },
  'LGPL-2.1': { id: 'LGPL-2.1', name: 'GNU Lesser General Public License v2.1', category: 'weak-copyleft', riskLevel: 'medium' },
  'LGPL-3.0': { id: 'LGPL-3.0', name: 'GNU Lesser General Public License v3.0', category: 'weak-copyleft', riskLevel: 'medium' },
  'MPL-2.0': { id: 'MPL-2.0', name: 'Mozilla Public License 2.0', category: 'weak-copyleft', riskLevel: 'medium' },
  'EPL-2.0': { id: 'EPL-2.0', name: 'Eclipse Public License 2.0', category: 'weak-copyleft', riskLevel: 'medium' },
  'CC0-1.0': { id: 'CC0-1.0', name: 'Creative Commons Zero v1.0 Universal', category: 'public-domain', riskLevel: 'low' },
  'Unlicense': { id: 'Unlicense', name: 'The Unlicense', category: 'public-domain', riskLevel: 'low' },
};

// License aliases and variations
const LICENSE_ALIASES: Record<string, string> = {
  'MIT': 'MIT',
  'Apache-2': 'Apache-2.0',
  'Apache 2.0': 'Apache-2.0',
  'BSD': 'BSD-3-Clause',
  'BSD-2': 'BSD-2-Clause',
  'BSD-3': 'BSD-3-Clause',
  'GPL-2': 'GPL-2.0',
  'GPL-3': 'GPL-3.0',
  'GPLv2': 'GPL-2.0',
  'GPLv3': 'GPL-3.0',
  'LGPL-2': 'LGPL-2.1',
  'LGPL-3': 'LGPL-3.0',
  'LGPLv2': 'LGPL-2.1',
  'LGPLv3': 'LGPL-3.0',
  'AGPLv3': 'AGPL-3.0',
  'MPL-2': 'MPL-2.0',
  'EPL-2': 'EPL-2.0',
  'CC0': 'CC0-1.0',
  'Public Domain': 'CC0-1.0',
};

// License policy rules
interface LicensePolicy {
  name: string;
  description: string;
  rules: {
    allowPermissive?: boolean;
    allowWeakCopyleft?: boolean;
    allowStrongCopyleft?: boolean;
    allowProprietary?: boolean;
    allowPublicDomain?: boolean;
    blockedLicenses?: string[];
    allowedLicenses?: string[];
  };
}

const DEFAULT_POLICIES: Record<string, LicensePolicy> = {
  'commercial': {
    name: 'Commercial',
    description: 'Strict policy for commercial/proprietary software',
    rules: {
      allowPermissive: true,
      allowWeakCopyleft: false,
      allowStrongCopyleft: false,
      allowProprietary: true,
      allowPublicDomain: true,
      blockedLicenses: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0'],
    },
  },
  'permissive': {
    name: 'Permissive',
    description: 'Only allow permissive and public domain licenses',
    rules: {
      allowPermissive: true,
      allowWeakCopyleft: false,
      allowStrongCopyleft: false,
      allowProprietary: false,
      allowPublicDomain: true,
    },
  },
  'open-source': {
    name: 'Open Source',
    description: 'Allow most open source licenses',
    rules: {
      allowPermissive: true,
      allowWeakCopyleft: true,
      allowStrongCopyleft: true,
      allowProprietary: false,
      allowPublicDomain: true,
    },
  },
  'unrestricted': {
    name: 'Unrestricted',
    description: 'Allow all licenses',
    rules: {
      allowPermissive: true,
      allowWeakCopyleft: true,
      allowStrongCopyleft: true,
      allowProprietary: true,
      allowPublicDomain: true,
    },
  },
};

/**
 * Normalize license string to SPDX identifier
 */
export function normalizeLicense(license: string | null | undefined): string {
  if (!license) return 'UNKNOWN';
  
  // Clean up the license string
  const cleaned = license.trim().replace(/\s+/g, ' ');
  
  // Check direct SPDX match
  if (SPDX_LICENSES[cleaned]) {
    return cleaned;
  }
  
  // Check aliases
  const alias = LICENSE_ALIASES[cleaned];
  if (alias) {
    return alias;
  }
  
  // Try case-insensitive match
  const upperCleaned = cleaned.toUpperCase();
  for (const [spdxId, info] of Object.entries(SPDX_LICENSES)) {
    if (spdxId.toUpperCase() === upperCleaned) {
      return spdxId;
    }
    if (info.name.toUpperCase() === upperCleaned) {
      return spdxId;
    }
  }
  
  // Try partial match
  for (const [spdxId, info] of Object.entries(SPDX_LICENSES)) {
    if (upperCleaned.includes(spdxId.toUpperCase()) || spdxId.toUpperCase().includes(upperCleaned)) {
      return spdxId;
    }
  }
  
  return 'UNKNOWN';
}

/**
 * Get license information
 */
export function getLicenseInfo(spdxId: string): {
  id: string;
  name: string;
  category: string;
  riskLevel: string;
  isKnown: boolean;
} {
  const licenseInfo = SPDX_LICENSES[spdxId];
  
  if (licenseInfo) {
    return {
      id: licenseInfo.id,
      name: licenseInfo.name,
      category: licenseInfo.category,
      riskLevel: licenseInfo.riskLevel,
      isKnown: true,
    };
  }
  
  return {
    id: spdxId,
    name: spdxId,
    category: 'unknown',
    riskLevel: 'medium',
    isKnown: false,
  };
}

/**
 * Check license against policy
 */
export function checkLicensePolicy(
  spdxId: string,
  policyName: keyof typeof DEFAULT_POLICIES = 'commercial'
): {
  allowed: boolean;
  reason?: string;
  riskLevel: string;
} {
  const policy = DEFAULT_POLICIES[policyName];
  const licenseInfo = SPDX_LICENSES[spdxId];
  
  if (!licenseInfo) {
    return {
      allowed: false,
      reason: 'Unknown license',
      riskLevel: 'medium',
    };
  }
  
  // Check blocked licenses
  if (policy.rules.blockedLicenses?.includes(spdxId)) {
    return {
      allowed: false,
      reason: `License ${spdxId} is explicitly blocked by policy`,
      riskLevel: 'high',
    };
  }
  
  // Check allowed licenses (if whitelist exists)
  if (policy.rules.allowedLicenses && policy.rules.allowedLicenses.length > 0) {
    if (!policy.rules.allowedLicenses.includes(spdxId)) {
      return {
        allowed: false,
        reason: `License ${spdxId} is not in the allowed list`,
        riskLevel: licenseInfo.riskLevel,
      };
    }
  }
  
  // Check by category
  switch (licenseInfo.category) {
    case 'permissive':
      if (!policy.rules.allowPermissive) {
        return {
          allowed: false,
          reason: 'Permissive licenses are not allowed by policy',
          riskLevel: licenseInfo.riskLevel,
        };
      }
      break;
    
    case 'weak-copyleft':
      if (!policy.rules.allowWeakCopyleft) {
        return {
          allowed: false,
          reason: 'Weak copyleft licenses are not allowed by policy',
          riskLevel: licenseInfo.riskLevel,
        };
      }
      break;
    
    case 'strong-copyleft':
      if (!policy.rules.allowStrongCopyleft) {
        return {
          allowed: false,
          reason: 'Strong copyleft licenses (GPL) are not allowed by policy',
          riskLevel: licenseInfo.riskLevel,
        };
      }
      break;
    
    case 'proprietary':
      if (!policy.rules.allowProprietary) {
        return {
          allowed: false,
          reason: 'Proprietary licenses are not allowed by policy',
          riskLevel: licenseInfo.riskLevel,
        };
      }
      break;
    
    case 'public-domain':
      if (!policy.rules.allowPublicDomain) {
        return {
          allowed: false,
          reason: 'Public domain licenses are not allowed by policy',
          riskLevel: licenseInfo.riskLevel,
        };
      }
      break;
  }
  
  return {
    allowed: true,
    riskLevel: licenseInfo.riskLevel,
  };
}

/**
 * Check license compatibility
 */
export function checkLicenseCompatibility(
  license1: string,
  license2: string
): {
  compatible: boolean;
  reason?: string;
} {
  const info1 = SPDX_LICENSES[license1];
  const info2 = SPDX_LICENSES[license2];
  
  if (!info1 || !info2) {
    return {
      compatible: false,
      reason: 'One or both licenses are unknown',
    };
  }
  
  // Permissive licenses are compatible with everything
  if (info1.category === 'permissive' || info2.category === 'permissive') {
    return { compatible: true };
  }
  
  // Public domain is compatible with everything
  if (info1.category === 'public-domain' || info2.category === 'public-domain') {
    return { compatible: true };
  }
  
  // Strong copyleft requires same license
  if (info1.category === 'strong-copyleft' || info2.category === 'strong-copyleft') {
    if (license1 === license2) {
      return { compatible: true };
    }
    return {
      compatible: false,
      reason: 'Strong copyleft licenses require the entire work to use the same license',
    };
  }
  
  // Weak copyleft is compatible with itself and permissive
  if (info1.category === 'weak-copyleft' && info2.category === 'weak-copyleft') {
    return { compatible: true };
  }
  
  return { compatible: true };
}

/**
 * Get license summary for SBOM
 */
export async function getLicenseSummaryForSBOM(
  sbomId: string,
  policyName: keyof typeof DEFAULT_POLICIES = 'commercial'
): Promise<{
  totalComponents: number;
  licenseCounts: Record<string, number>;
  unknownCount: number;
  policyViolations: Array<{
    componentId: string;
    componentName: string;
    license: string;
    reason: string;
    riskLevel: string;
  }>;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}> {
  const sbomComponents = await db.select()
    .from(components)
    .where(eq(components.sbomId, sbomId));
  
  const licenseCounts: Record<string, number> = {};
  let unknownCount = 0;
  const policyViolations: Array<{
    componentId: string;
    componentName: string;
    license: string;
    reason: string;
    riskLevel: string;
  }> = [];
  
  const riskDistribution = {
    low: 0,
    medium: 0,
    high: 0,
  };
  
  for (const component of sbomComponents) {
    const rawLicense = component.license;
    const spdxId = normalizeLicense(rawLicense);
    
    if (spdxId === 'UNKNOWN') {
      unknownCount++;
      riskDistribution.medium++;
    } else {
      licenseCounts[spdxId] = (licenseCounts[spdxId] || 0) + 1;
      
      // Check policy
      const policyCheck = checkLicensePolicy(spdxId, policyName);
      
      if (!policyCheck.allowed) {
        policyViolations.push({
          componentId: component.id,
          componentName: component.name,
          license: spdxId,
          reason: policyCheck.reason || 'Policy violation',
          riskLevel: policyCheck.riskLevel,
        });
      }
      
      // Update risk distribution
      if (policyCheck.riskLevel === 'low') {
        riskDistribution.low++;
      } else if (policyCheck.riskLevel === 'medium') {
        riskDistribution.medium++;
      } else {
        riskDistribution.high++;
      }
    }
  }
  
  return {
    totalComponents: sbomComponents.length,
    licenseCounts,
    unknownCount,
    policyViolations,
    riskDistribution,
  };
}

/**
 * Get available policies
 */
export function getAvailablePolicies() {
  return Object.entries(DEFAULT_POLICIES).map(([key, policy]) => ({
    key,
    name: policy.name,
    description: policy.description,
  }));
}

/**
 * Analyze component license
 */
export async function analyzeComponentLicense(componentId: string, policyName: keyof typeof DEFAULT_POLICIES = 'commercial') {
  const component = await db.select()
    .from(components)
    .where(eq(components.id, componentId))
    .limit(1);
  
  if (component.length === 0) {
    throw new Error('Component not found');
  }
  
  const rawLicense = component[0].license;
  const spdxId = normalizeLicense(rawLicense);
  const licenseInfo = getLicenseInfo(spdxId);
  const policyCheck = checkLicensePolicy(spdxId, policyName);
  
  return {
    rawLicense,
    spdxId,
    licenseInfo,
    policyCheck,
  };
}
