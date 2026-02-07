import { Hono } from 'hono';
import { db, projects } from '../db';
import { eq, desc } from 'drizzle-orm';

const projectsRouter = new Hono();

// Get all projects
projectsRouter.get('/', async (c) => {
  try {
    const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return c.json({ projects: allProjects });
  } catch (error) {
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// Get project by ID
projectsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    
    if (project.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    return c.json({ project: project[0] });
  } catch (error) {
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// Create project
projectsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, description } = body;
    
    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }
    
    const newProject = await db.insert(projects).values({
      name,
      description,
    }).returning();
    
    return c.json({ project: newProject[0] }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Update project
projectsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
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
    
    if (updatedProject.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    return c.json({ project: updatedProject[0] });
  } catch (error) {
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Delete project
projectsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const deletedProject = await db.delete(projects)
      .where(eq(projects.id, id))
      .returning();
    
    if (deletedProject.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

export default projectsRouter;
