import { Hono } from 'hono';
import { db, sboms } from '../db';
import { eq, desc } from 'drizzle-orm';

const sbomsRouter = new Hono();

// Get all SBOMs
sbomsRouter.get('/', async (c) => {
  try {
    const allSboms = await db.select().from(sboms).orderBy(desc(sboms.createdAt));
    return c.json({ sboms: allSboms });
  } catch (error) {
    return c.json({ error: 'Failed to fetch SBOMs' }, 500);
  }
});

// Get SBOMs by project ID
sbomsRouter.get('/project/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const projectSboms = await db.select()
      .from(sboms)
      .where(eq(sboms.projectId, projectId))
      .orderBy(desc(sboms.createdAt));
    
    return c.json({ sboms: projectSboms });
  } catch (error) {
    return c.json({ error: 'Failed to fetch SBOMs' }, 500);
  }
});

// Get SBOM by ID
sbomsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const sbom = await db.select().from(sboms).where(eq(sboms.id, id)).limit(1);
    
    if (sbom.length === 0) {
      return c.json({ error: 'SBOM not found' }, 404);
    }
    
    return c.json({ sbom: sbom[0] });
  } catch (error) {
    return c.json({ error: 'Failed to fetch SBOM' }, 500);
  }
});

// Create SBOM
sbomsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, version, format, author, rawContent } = body;
    
    if (!projectId || !version || !format) {
      return c.json({ error: 'projectId, version, and format are required' }, 400);
    }
    
    const newSbom = await db.insert(sboms).values({
      projectId,
      version,
      format,
      author,
      rawContent,
    }).returning();
    
    return c.json({ sbom: newSbom[0] }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create SBOM' }, 500);
  }
});

// Delete SBOM
sbomsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const deletedSbom = await db.delete(sboms)
      .where(eq(sboms.id, id))
      .returning();
    
    if (deletedSbom.length === 0) {
      return c.json({ error: 'SBOM not found' }, 404);
    }
    
    return c.json({ message: 'SBOM deleted successfully' });
  } catch (error) {
    return c.json({ error: 'Failed to delete SBOM' }, 500);
  }
});

export default sbomsRouter;
