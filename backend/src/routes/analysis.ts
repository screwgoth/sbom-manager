import { Hono } from 'hono';
import { scanSBOMForVulnerabilities, getVulnerabilitySummaryForSBOM, getVulnerabilitiesForComponent } from '../services/vulnerability-service';
import { getLicenseSummaryForSBOM, analyzeComponentLicense, getAvailablePolicies } from '../services/license-service';
import { getUserId, verifySbomOwnership, verifyComponentOwnership } from '../utils/ownership';

const analysisRouter = new Hono();

/**
 * Trigger vulnerability scan for SBOM
 * POST /api/analysis/vulnerabilities/scan/:sbomId
 */
analysisRouter.post('/vulnerabilities/scan/:sbomId', async (c) => {
  try {
    const userId = getUserId(c);
    const sbomId = c.req.param('sbomId');

    const owned = await verifySbomOwnership(userId, sbomId);
    if (!owned) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    console.log(`[API] Starting vulnerability scan for SBOM ${sbomId}`);
    const result = await scanSBOMForVulnerabilities(sbomId);

    return c.json({
      success: true,
      message: 'Vulnerability scan completed',
      result,
    });
  } catch (error: any) {
    console.error('[API] Vulnerability scan error:', error);
    return c.json({ error: error.message || 'Failed to scan vulnerabilities' }, 500);
  }
});

/**
 * Get vulnerability summary for SBOM
 * GET /api/analysis/vulnerabilities/summary/:sbomId
 */
analysisRouter.get('/vulnerabilities/summary/:sbomId', async (c) => {
  try {
    const userId = getUserId(c);
    const sbomId = c.req.param('sbomId');

    const owned = await verifySbomOwnership(userId, sbomId);
    if (!owned) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const summary = await getVulnerabilitySummaryForSBOM(sbomId);

    return c.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('[API] Error getting vulnerability summary:', error);
    return c.json({ error: error.message || 'Failed to get vulnerability summary' }, 500);
  }
});

/**
 * Get vulnerabilities for a component
 * GET /api/analysis/vulnerabilities/component/:componentId
 */
analysisRouter.get('/vulnerabilities/component/:componentId', async (c) => {
  try {
    const userId = getUserId(c);
    const componentId = c.req.param('componentId');

    const owned = await verifyComponentOwnership(userId, componentId);
    if (!owned) {
      return c.json({ error: 'Component not found' }, 404);
    }

    const vulnerabilities = await getVulnerabilitiesForComponent(componentId);

    return c.json({
      success: true,
      vulnerabilities,
    });
  } catch (error: any) {
    console.error('[API] Error getting component vulnerabilities:', error);
    return c.json({ error: error.message || 'Failed to get component vulnerabilities' }, 500);
  }
});

/**
 * Get license summary for SBOM
 * GET /api/analysis/licenses/summary/:sbomId?policy=commercial
 */
analysisRouter.get('/licenses/summary/:sbomId', async (c) => {
  try {
    const userId = getUserId(c);
    const sbomId = c.req.param('sbomId');

    const owned = await verifySbomOwnership(userId, sbomId);
    if (!owned) {
      return c.json({ error: 'SBOM not found' }, 404);
    }

    const policy = c.req.query('policy') || 'commercial';
    const summary = await getLicenseSummaryForSBOM(sbomId, policy as any);

    return c.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('[API] Error getting license summary:', error);
    return c.json({ error: error.message || 'Failed to get license summary' }, 500);
  }
});

/**
 * Analyze component license
 * GET /api/analysis/licenses/component/:componentId?policy=commercial
 */
analysisRouter.get('/licenses/component/:componentId', async (c) => {
  try {
    const userId = getUserId(c);
    const componentId = c.req.param('componentId');

    const owned = await verifyComponentOwnership(userId, componentId);
    if (!owned) {
      return c.json({ error: 'Component not found' }, 404);
    }

    const policy = c.req.query('policy') || 'commercial';
    const analysis = await analyzeComponentLicense(componentId, policy as any);

    return c.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('[API] Error analyzing component license:', error);
    return c.json({ error: error.message || 'Failed to analyze component license' }, 500);
  }
});

/**
 * Get available license policies
 * GET /api/analysis/licenses/policies
 */
analysisRouter.get('/licenses/policies', async (c) => {
  try {
    const policies = getAvailablePolicies();

    return c.json({
      success: true,
      policies,
    });
  } catch (error: any) {
    console.error('[API] Error getting policies:', error);
    return c.json({ error: error.message || 'Failed to get policies' }, 500);
  }
});

export default analysisRouter;
