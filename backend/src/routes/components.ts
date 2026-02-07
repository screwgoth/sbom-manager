import { Hono } from 'hono';
import { db, components } from '../db';
import { eq } from 'drizzle-orm';

const componentsRouter = new Hono();

// Get components by SBOM ID
componentsRouter.get('/sbom/:sbomId', async (c) => {
  try {
    const sbomId = c.req.param('sbomId');
    const sbomComponents = await db.select()
      .from(components)
      .where(eq(components.sbomId, sbomId));
    
    return c.json({ components: sbomComponents });
  } catch (error) {
    return c.json({ error: 'Failed to fetch components' }, 500);
  }
});

// Get component by ID
componentsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const component = await db.select().from(components).where(eq(components.id, id)).limit(1);
    
    if (component.length === 0) {
      return c.json({ error: 'Component not found' }, 404);
    }
    
    return c.json({ component: component[0] });
  } catch (error) {
    return c.json({ error: 'Failed to fetch component' }, 500);
  }
});

// Create component
componentsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      sbomId, name, version, supplier, license, purl, 
      checksumSha256, dependencies, metadata, releaseDate,
      eolDate, description, origin, criticality, usageRestrictions
    } = body;
    
    if (!sbomId || !name || !version) {
      return c.json({ error: 'sbomId, name, and version are required' }, 400);
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

// Bulk create components
componentsRouter.post('/bulk', async (c) => {
  try {
    const body = await c.req.json();
    const { components: componentsData } = body;
    
    if (!Array.isArray(componentsData) || componentsData.length === 0) {
      return c.json({ error: 'Components array is required' }, 400);
    }
    
    const newComponents = await db.insert(components).values(componentsData).returning();
    
    return c.json({ components: newComponents }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create components' }, 500);
  }
});

export default componentsRouter;
