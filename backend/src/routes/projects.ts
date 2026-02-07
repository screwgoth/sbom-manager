import { Hono } from 'hono';
import { db, projects } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { getUserId, verifyProjectOwnership } from '../utils/ownership';

const projectsRouter = new Hono();

// Get all projects (user's own only)
projectsRouter.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const allProjects = await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
    return c.json({ projects: allProjects });
  } catch (error) {
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// Get project by ID (verify ownership)
projectsRouter.get('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param('id');
    const project = await verifyProjectOwnership(userId, id);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project });
  } catch (error) {
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// Create project (set userId)
projectsRouter.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const { name, description } = body;

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const newProject = await db.insert(projects).values({
      name,
      description,
      userId,
    }).returning();

    return c.json({ project: newProject[0] }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Update project (verify ownership)
projectsRouter.put('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param('id');
    const owned = await verifyProjectOwnership(userId, id);
    if (!owned) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const body = await c.req.json();
    const { name, description } = body;

    const updatedProject = await db.update(projects)
      .set({
        name,
        description,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();

    return c.json({ project: updatedProject[0] });
  } catch (error) {
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Delete project (verify ownership)
projectsRouter.delete('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const id = c.req.param('id');
    const owned = await verifyProjectOwnership(userId, id);
    if (!owned) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await db.delete(projects).where(eq(projects.id, id));
    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

export default projectsRouter;
