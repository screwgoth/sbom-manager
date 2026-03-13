import { Hono } from 'hono';
import { db, components, sboms } from '../db';
import { eq, isNull, or } from 'drizzle-orm';
import { getUserId, verifySbomOwnership, verifyComponentOwnership } from '../utils/ownership';
import { EnrichmentService } from '../services/enrichment-service';
import { Ecosystem } from '../scanner/types';

const componentsRouter = new Hono();

// Get components by SBOM ID (verify ownership)
componentsRouter.get('/sbom/:sbomId', async (c) => {
  try {
    const userId = getUserId(c);
    const sbomId = c.req.param('sbomId');
    const owned = await verifySbomOwnership(userId, sbomId);
    if (!owned) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const sbomComponents = await db.select()
      .from(components)
      .where(eq(components.sbomId, sbomId));

    return c.json({ components: sbomComponents });
  } catch (error) {
    return c.json({ error: 'Failed to fetch components' }, 500);
  }
});

// Get component by ID (verify ownership)
componentsRouter.get('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param('id');
    const owned = await verifyComponentOwnership(userId, id);
    if (!owned) {
      return c.json({ error: 'Component not found' }, 404);
    }

    return c.json({ component: owned.component });
  } catch (error) {
    return c.json({ error: 'Failed to fetch component' }, 500);
  }
});

// Create component (verify SBOM ownership)
componentsRouter.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const {
      sbomId, name, version, supplier, license, purl,
      checksumSha256, dependencies, metadata, releaseDate,
      eolDate, description, origin, criticality, usageRestrictions
    } = body;

    if (!sbomId || !name || !version) {
      return c.json({ error: 'sbomId, name, and version are required' }, 400);
    }

    const owned = await verifySbomOwnership(userId, sbomId);
    if (!owned) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const newComponent = await db.insert(components).values({
      sbomId,
      name,
      version,
      supplier,
      license,
      purl,
      checksumSha256,
      dependencies,
      metadata,
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      eolDate: eolDate ? new Date(eolDate) : undefined,
      description,
      origin,
      criticality,
      usageRestrictions,
    }).returning();

    return c.json({ component: newComponent[0] }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create component' }, 500);
  }
});

// Bulk create components (verify SBOM ownership)
componentsRouter.post('/bulk', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const { components: componentsData } = body;

    if (!Array.isArray(componentsData) || componentsData.length === 0) {
      return c.json({ error: 'Components array is required' }, 400);
    }

    const sbomId = componentsData[0].sbomId;
    if (!sbomId) {
      return c.json({ error: 'sbomId is required for each component' }, 400);
    }

    const owned = await verifySbomOwnership(userId, sbomId);
    if (!owned) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const newComponents = await db.insert(components).values(componentsData).returning();

    return c.json({ components: newComponents }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create components' }, 500);
  }
});

// Batch enrichment endpoint - enrich components with missing CPE/PURL/SWID/relationship data
componentsRouter.post('/enrich', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const { sbomId, force = false } = body;

    if (!sbomId) {
      return c.json({ error: 'sbomId is required' }, 400);
    }

    const owned = await verifySbomOwnership(userId, sbomId);
    if (!owned) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    // Get SBOM details for ecosystem detection
    const sbomData = await db.select()
      .from(sboms)
      .where(eq(sboms.id, sbomId))
      .limit(1);

    if (sbomData.length === 0) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    // Detect ecosystem from SBOM content or metadata
    let ecosystem: Ecosystem = Ecosystem.UNKNOWN;
    let projectName = 'project';
    
    try {
      const rawContent = sbomData[0].rawContent;
      if (typeof rawContent === 'object' && rawContent !== null) {
        // Try to extract ecosystem from SPDX metadata
        const spdxDoc = rawContent as any;
        
        // Extract project name if available
        if (spdxDoc.name) {
          projectName = spdxDoc.name;
        }
        
        if (spdxDoc.packages && spdxDoc.packages.length > 0) {
          const firstPackage = spdxDoc.packages[0];
          if (firstPackage.externalRefs) {
            const purlRef = firstPackage.externalRefs.find((ref: any) => ref.referenceType === 'purl');
            if (purlRef && purlRef.referenceLocator) {
              const purlType = purlRef.referenceLocator.split(':')[1]?.split('/')[0];
              if (purlType === 'npm') ecosystem = Ecosystem.NPM;
              else if (purlType === 'pypi') ecosystem = Ecosystem.PYTHON;
              else if (purlType === 'maven') ecosystem = Ecosystem.JAVA;
              else if (purlType === 'golang') ecosystem = Ecosystem.GO;
              else if (purlType === 'cargo') ecosystem = Ecosystem.RUST;
            }
          }
        }
      }
    } catch (error) {
      console.warn('[Enrichment] Could not detect ecosystem from SBOM:', error);
    }

    // Query components that need enrichment
    const whereConditions = force 
      ? eq(components.sbomId, sbomId)
      : or(
          isNull(components.cpe),
          isNull(components.purl),
          isNull(components.dependencyRelationship)
        );

    const componentsToEnrich = await db.select()
      .from(components)
      .where(eq(components.sbomId, sbomId));

    if (componentsToEnrich.length === 0) {
      return c.json({ 
        message: 'No components need enrichment',
        enriched: 0
      });
    }

    console.log(`[Enrichment] Enriching ${componentsToEnrich.length} components for SBOM ${sbomId}`);

    // Enrich components
    const enrichmentService = new EnrichmentService();
    
    // Convert DB components to scanner Component type for enrichment
    const componentsForEnrichment = componentsToEnrich.map(comp => ({
      name: comp.name,
      version: comp.version,
      supplier: comp.supplier || undefined,
      license: comp.license || undefined,
      purl: comp.purl || undefined,
      cpe: comp.cpe || undefined,
      swid: comp.swid || undefined,
      dependencyRelationship: comp.dependencyRelationship || undefined,
      checksumSha256: comp.checksumSha256 || undefined,
      dependencies: comp.dependencies as string[] | undefined,
      metadata: comp.metadata as Record<string, any> | undefined,
      description: comp.description || undefined,
      origin: comp.origin || undefined,
    }));

    const enrichedComponents = await enrichmentService.enrichComponents(
      componentsForEnrichment,
      ecosystem,
      null, // Lock file data not available for existing components
      projectName
    );

    // Update database with enriched data
    let updatedCount = 0;
    for (let i = 0; i < enrichedComponents.length; i++) {
      const enriched = enrichedComponents[i];
      const original = componentsToEnrich[i];
      
      try {
        await db.update(components)
          .set({
            purl: enriched.purl,
            cpe: enriched.cpe,
            swid: enriched.swid,
            dependencyRelationship: enriched.dependencyRelationship,
            metadata: enriched.metadata,
          })
          .where(eq(components.id, original.id));
        
        updatedCount++;
      } catch (error) {
        console.error(`[Enrichment] Failed to update component ${enriched.name}:`, error);
      }
    }

    console.log(`[Enrichment] Successfully enriched ${updatedCount} components`);

    return c.json({
      message: `Enriched ${updatedCount} components`,
      enriched: updatedCount,
      total: componentsToEnrich.length,
      ecosystem: ecosystem,
    });
  } catch (error: any) {
    console.error('[Enrichment] Batch enrichment failed:', error);
    return c.json({ 
      error: 'Failed to enrich components',
      details: error.message 
    }, 500);
  }
});

export default componentsRouter;
