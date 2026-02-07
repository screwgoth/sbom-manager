import { Hono } from 'hono';
import { db, sboms, projects } from '../db';
import { eq, desc } from 'drizzle-orm';
import { getUserId, verifyProjectOwnership, verifySbomOwnership } from '../utils/ownership';

const sbomsRouter = new Hono();

// Get all SBOMs (user's projects only)
sbomsRouter.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const allSboms = await db.select({ sbom: sboms })
      .from(sboms)
      .innerJoin(projects, eq(sboms.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(sboms.createdAt));
    return c.json({ sboms: allSboms.map(r => r.sbom) });
  } catch (error) {
    return c.json({ error: 'Failed to fetch SBOMs' }, 500);
  }
});

// Get SBOMs by project ID (verify ownership)
sbomsRouter.get('/project/:projectId', async (c) => {
  try {
    const userId = getUserId(c);
    const projectId = c.req.param('projectId');
    const owned = await verifyProjectOwnership(userId, projectId);
    if (!owned) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const projectSboms = await db.select()
      .from(sboms)
      .where(eq(sboms.projectId, projectId))
      .orderBy(desc(sboms.createdAt));

    return c.json({ sboms: projectSboms });
  } catch (error) {
    return c.json({ error: 'Failed to fetch SBOMs' }, 500);
  }
});

// Get SBOM by ID (verify ownership)
sbomsRouter.get('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param('id');
    const result = await verifySbomOwnership(userId, id);
    if (!result) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    return c.json({ sbom: result.sbom });
  } catch (error) {
    return c.json({ error: 'Failed to fetch SBOM' }, 500);
  }
});

// Create SBOM (verify project ownership)
sbomsRouter.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const { projectId, version, format, author, rawContent } = body;

    if (!projectId || !version || !format) {
      return c.json({ error: 'projectId, version, and format are required' }, 400);
    }

    const owned = await verifyProjectOwnership(userId, projectId);
    if (!owned) {
      return c.json({ error: 'Project not found' }, 404);
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

// Delete SBOM (verify ownership)
sbomsRouter.delete('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param('id');
    const result = await verifySbomOwnership(userId, id);
    if (!result) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    await db.delete(sboms).where(eq(sboms.id, id));
    return c.json({ message: 'SBOM deleted successfully' });
  } catch (error) {
    return c.json({ error: 'Failed to delete SBOM' }, 500);
  }
});

export default sbomsRouter;
