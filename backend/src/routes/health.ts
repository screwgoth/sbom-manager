import { Hono } from 'hono';
import { db } from '../db';

const health = new Hono();

health.get('/', async (c) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 503);
  }
});

export default health;
