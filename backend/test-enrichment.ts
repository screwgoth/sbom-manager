#!/usr/bin/env ts-node
/**
 * Test script for the enrichment service
 * Tests PURL generation, CPE lookups, and dependency relationship detection
 */

import { EnrichmentService } from './src/services/enrichment-service';
import { Component, Ecosystem } from './src/scanner/types';

async function testEnrichment() {
  console.log('🧪 Testing Enrichment Service\n');
  
  const enrichmentService = new EnrichmentService();

  // Test components
  const testComponents: Component[] = [
    {
      name: 'express',
      version: '4.18.2',
      supplier: 'npm',
    },
    {
      name: 'react',
      version: '18.2.0',
      supplier: 'npm',
    },
    {
      name: 'lodash',
      version: '4.17.21',
      supplier: 'npm',
    },
    {
      name: '@types/node',
      version: '20.0.0',
      supplier: 'npm',
    },
  ];

  // Mock package-lock.json data for dependency relationship testing
  const mockLockFile = {
    name: 'test-project',
    version: '1.0.0',
    lockfileVersion: 3,
    packages: {
      '': {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.2',
          react: '^18.2.0',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
        },
      },
      'node_modules/express': {
        name: 'express',
        version: '4.18.2',
        dependencies: {
          'accepts': '~1.3.8',
          'array-flatten': '1.1.1',
        },
      },
      'node_modules/react': {
        name: 'react',
        version: '18.2.0',
        dependencies: {
          'loose-envify': '^1.1.0',
        },
      },
      'node_modules/@types/node': {
        name: '@types/node',
        version: '20.0.0',
      },
      'node_modules/lodash': {
        name: 'lodash',
        version: '4.17.21',
        dependencies: {},
      },
      'node_modules/accepts': {
        name: 'accepts',
        version: '1.3.8',
        dependencies: {
          'mime-types': '~2.1.34',
          'negotiator': '0.6.3',
        },
      },
    },
  };

  console.log('📦 Testing component enrichment...\n');

  for (const component of testComponents) {
    console.log(`\n━━━ ${component.name}@${component.version} ━━━`);
    
    try {
      const result = await enrichmentService.enrichComponent(
        component,
        Ecosystem.NPM,
        mockLockFile,
        'test-project'
      );

      console.log('✅ Enrichment Results:');
      console.log(`   PURL: ${result.purl || 'N/A'}`);
      console.log(`   CPE:  ${result.cpe || 'N/A'}`);
      console.log(`   SWID: ${result.swid || 'N/A'}`);
      console.log(`   Relationship: ${result.dependencyRelationship || 'N/A'}`);
      
    } catch (error: any) {
      console.error(`❌ Error enriching ${component.name}:`, error.message);
    }
  }

  console.log('\n\n🧪 Testing batch enrichment...\n');

  try {
    const enriched = await enrichmentService.enrichComponents(
      testComponents,
      Ecosystem.NPM,
      mockLockFile,
      'test-project'
    );

    console.log(`✅ Batch enrichment completed for ${enriched.length} components`);
    console.log('\nSummary:');
    
    let purlCount = 0;
    let cpeCount = 0;
    let swidCount = 0;
    let relationshipCount = 0;

    for (const comp of enriched) {
      if (comp.purl) purlCount++;
      if (comp.cpe) cpeCount++;
      if (comp.swid) swidCount++;
      if (comp.dependencyRelationship) relationshipCount++;
    }

    console.log(`   Components with PURL: ${purlCount}/${enriched.length}`);
    console.log(`   Components with CPE:  ${cpeCount}/${enriched.length}`);
    console.log(`   Components with SWID: ${swidCount}/${enriched.length}`);
    console.log(`   Components with Relationship: ${relationshipCount}/${enriched.length}`);

  } catch (error: any) {
    console.error('❌ Batch enrichment failed:', error.message);
  }

  console.log('\n\n🧪 Testing transitive dependency detection...\n');

  const transitiveComponent: Component = {
    name: 'accepts',
    version: '1.3.8',
    supplier: 'npm',
  };

  try {
    const result = await enrichmentService.enrichComponent(
      transitiveComponent,
      Ecosystem.NPM,
      mockLockFile,
      'test-project'
    );

    console.log(`Accepts package relationship: ${result.dependencyRelationship}`);
    if (result.dependencyRelationship?.includes('Transitive dependency via express')) {
      console.log('✅ Transitive dependency detection works!');
    } else {
      console.log('⚠️  Expected transitive dependency via express');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✨ Test complete!\n');
}

// Run tests
testEnrichment().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
