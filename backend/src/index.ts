import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import projectsRouter from './routes/projects';
import sbomsRouter from './routes/sboms';
import componentsRouter from './routes/components';
import vulnerabilitiesRouter from './routes/vulnerabilities';
import healthRouter from './routes/health';
import scannerRouter from './routes/scanner';
import analysisRouter from './routes/analysis';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Routes
app.route('/api/health', healthRouter);
app.route('/api/projects', projectsRouter);
app.route('/api/sboms', sbomsRouter);
app.route('/api/components', componentsRouter);
app.route('/api/vulnerabilities', vulnerabilitiesRouter);
app.route('/api/scanner', scannerRouter);
app.route('/api/analysis', analysisRouter);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'SBOM Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      projects: '/api/projects',
      sboms: '/api/sboms',
      components: '/api/components',
      vulnerabilities: '/api/vulnerabilities',
      scanner: '/api/scanner',
      analysis: '/api/analysis',
    },
  });
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 SBOM Manager API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
