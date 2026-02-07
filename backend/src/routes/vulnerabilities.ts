import { Hono } from 'hono';
import { db, vulnerabilities, componentVulnerabilities } from '../db';
import { eq } from 'drizzle-orm';

const vulnerabilitiesRouter = new Hono();

// Get all vulnerabilities
vulnerabilitiesRouter.get('/', async (c) => {
  try {
    const allVulnerabilities = await db.select().from(vulnerabilities);
    return c.json({ vulnerabilities: allVulnerabilities });
  } catch (error) {
    return c.json({ error: 'Failed to fetch vulnerabilities' }, 500);
  }
});

// Get vulnerability by ID
vulnerabilitiesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const vulnerability = await db.select()
      .from(vulnerabilities)
      .where(eq(vulnerabilities.id, id))
      .limit(1);
    
    if (vulnerability.length === 0) {
      return c.json({ error: 'Vulnerability not found' }, 404);
    }
    
    return c.json({ vulnerability: vulnerability[0] });
  } catch (error) {
    return c.json({ error: 'Failed to fetch vulnerability' }, 500);
  }
});

// Get vulnerability by CVE ID
vulnerabilitiesRouter.get('/cve/:cveId', async (c) => {
  try {
    const cveId = c.req.param('cveId');
    const vulnerability = await db.select()
      .from(vulnerabilities)
      .where(eq(vulnerabilities.cveId, cveId))
      .limit(1);
    
    if (vulnerability.length === 0) {
      return c.json({ error: 'Vulnerability not found' }, 404);
    }
    
    return c.json({ vulnerability: vulnerability[0] });
  } catch (error) {
    return c.json({ error: 'Failed to fetch vulnerability' }, 500);
  }
});

// Get vulnerabilities for a component
vulnerabilitiesRouter.get('/component/:componentId', async (c) => {
  try {
    const componentId = c.req.param('componentId');
    
    const componentVulns = await db.select({
      vulnerability: vulnerabilities,
      status: componentVulnerabilities.status,
    })
    .from(componentVulnerabilities)
    .innerJoin(vulnerabilities, eq(componentVulnerabilities.vulnerabilityId, vulnerabilities.id))
    .where(eq(componentVulnerabilities.componentId, componentId));
    
    return c.json({ vulnerabilities: componentVulns });
  } catch (error) {
    return c.json({ error: 'Failed to fetch component vulnerabilities' }, 500);
  }
});

// Create vulnerability
vulnerabilitiesRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      cveId, severity, cvssScore, description, 
      affectedVersions, fixedVersion, references, publishedDate
    } = body;
    
    if (!cveId || !severity) {
      return c.json({ error: 'cveId and severity are required' }, 400);
    }
    
    const newVulnerability = await db.insert(vulnerabilities).values({
      cveId,
      severity,
      cvssScore,
      description,
      affectedVersions,
      fixedVersion,
      references,
      publishedDate: publishedDate ? new Date(publishedDate) : undefined,
    }).returning();
    
    return c.json({ vulnerability: newVulnerability[0] }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create vulnerability' }, 500);
  }
});

// Link vulnerability to component
vulnerabilitiesRouter.post('/link', async (c) => {
  try {
    const body = await c.req.json();
    const { componentId, vulnerabilityId, status } = body;
    
    if (!componentId || !vulnerabilityId) {
      return c.json({ error: 'componentId and vulnerabilityId are required' }, 400);
    }
    
    const link = await db.insert(componentVulnerabilities).values({
      componentId,
      vulnerabilityId,
      status: status || 'open',
    }).returning();
    
    return c.json({ link: link[0] }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to link vulnerability to component' }, 500);
  }
});

export default vulnerabilitiesRouter;
