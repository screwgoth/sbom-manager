import { Hono } from 'hono';
import { ScannerService } from '../scanner/scanner-service';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getUserId, verifyProjectOwnership } from '../utils/ownership';

const scannerRouter = new Hono();
const scannerService = new ScannerService();

// Scan directory
scannerRouter.post('/scan/directory', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, projectName, projectVersion, author, directoryPath } = body;

    if (!projectId || !projectName || !directoryPath) {
      return c.json({ error: 'projectId, projectName, and directoryPath are required' }, 400);
    }

    const userId = getUserId(c);
    const owned = await verifyProjectOwnership(userId, projectId);
    if (!owned) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Validate directory exists
    try {
      await fs.access(directoryPath);
    } catch {
      return c.json({ error: 'Directory does not exist or is not accessible' }, 400);
    }

    const result = await scannerService.scanDirectory(directoryPath, {
      projectId,
      projectName,
      projectVersion,
      author,
    });

    return c.json({ 
      success: true,
      result: {
        sbomId: result.sbomId,
        ecosystem: result.ecosystem,
        componentsCount: result.componentsCount,
      }
    }, 201);
  } catch (error) {
    console.error('Scan directory error:', error);
    return c.json({ error: `Failed to scan directory: ${error}` }, 500);
  }
});

// Upload and scan files
scannerRouter.post('/scan/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const projectId = body.projectId as string;
    const projectName = body.projectName as string;
    const projectVersion = body.projectVersion as string | undefined;
    const author = body.author as string | undefined;

    if (!projectId || !projectName) {
      return c.json({ error: 'projectId and projectName are required' }, 400);
    }

    const userId = getUserId(c);
    const owned = await verifyProjectOwnership(userId, projectId);
    if (!owned) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get uploaded files
    const files = [];
    for (const key in body) {
      if (key.startsWith('file')) {
        files.push(body[key]);
      }
    }

    if (files.length === 0) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    // Create temp directory for uploaded files
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sbom-scan-'));
    const filePaths: string[] = [];

    try {
      // Save uploaded files to temp directory
      for (const file of files) {
        if (file instanceof File) {
          const fileName = file.name;
          const filePath = path.join(tempDir, fileName);
          const buffer = await file.arrayBuffer();
          await fs.writeFile(filePath, Buffer.from(buffer));
          filePaths.push(filePath);
        }
      }

      // Scan the files
      const result = await scannerService.scanFiles(filePaths, {
        projectId,
        projectName,
        projectVersion,
        author,
      });

      return c.json({
        success: true,
        result: {
          sbomId: result.sbomId,
          ecosystem: result.ecosystem,
          componentsCount: result.componentsCount,
        },
      }, 201);
    } finally {
      // Cleanup temp files
      try {
        await fs.rm(tempDir, { recursive: true });
      } catch (error) {
        console.error('Failed to cleanup temp directory:', error);
      }
    }
  } catch (error) {
    console.error('Upload scan error:', error);
    return c.json({ error: `Failed to scan uploaded files: ${error}` }, 500);
  }
});

// Detect ecosystem from file content (preview)
scannerRouter.post('/detect', async (c) => {
  try {
    const body = await c.req.parseBody();
    const fileNames: string[] = [];

    for (const key in body) {
      if (key.startsWith('file')) {
        const file = body[key];
        if (file instanceof File) {
          fileNames.push(file.name);
        }
      }
    }

    if (fileNames.length === 0) {
      return c.json({ error: 'No files provided' }, 400);
    }

    const ecosystem = scannerService.detectEcosystem(fileNames);

    return c.json({
      ecosystem,
      fileNames,
      supported: ecosystem !== 'unknown',
    });
  } catch (error) {
    return c.json({ error: `Failed to detect ecosystem: ${error}` }, 500);
  }
});

export default scannerRouter;
