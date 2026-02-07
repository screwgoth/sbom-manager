import { Context } from 'hono';
import { db, projects, sboms, components } from '../db';
import { eq, and } from 'drizzle-orm';

export function getUserId(c: Context): string {
  const user = c.get('user') as { userId: string; email: string } | undefined;
  if (!user || !user.userId) {
    throw new Error('Unauthorized');
  }
  return user.userId;
}

export async function verifyProjectOwnership(userId: string, projectId: string) {
  const result = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function verifySbomOwnership(userId: string, sbomId: string) {
  const result = await db.select({ sbom: sboms, project: projects })
    .from(sboms)
    .innerJoin(projects, eq(sboms.projectId, projects.id))
    .where(and(eq(sboms.id, sbomId), eq(projects.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function verifyComponentOwnership(userId: string, componentId: string) {
  const result = await db.select({ component: components, sbom: sboms, project: projects })
    .from(components)
    .innerJoin(sboms, eq(components.sbomId, sboms.id))
    .innerJoin(projects, eq(sboms.projectId, projects.id))
    .where(and(eq(components.id, componentId), eq(projects.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}
