import path from 'path';
import { promises as fs } from 'fs';
import { gunzip } from 'zlib';
import { promisify } from 'util';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const LOCAL_SYNC_ROOT = path.resolve(__dirname, 'local-sync');
const API_BASE = '/api/saves';

const sanitizeUserId = (value: string) =>
  value.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

const sanitizeFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9_.-]/g, '_');

const normalizeFileName = (value: string) => {
  const safe = sanitizeFileName(value || 'slot_unknown');
  return safe.endsWith('.json') ? safe : `${safe}.json`;
};

const parseSlotIndex = (value: string) => {
  const match = value.match(/(\d+)/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
};

const gunzipAsync = promisify(gunzip);

const readBody = async (req: any): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const sendJson = (res: any, status: number, data: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

const localSyncMiddleware = async (req: any, res: any, next: () => void) => {
  if (!req.url) return next();
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith(API_BASE)) return next();

  const method = (req.method || 'GET').toUpperCase();
  const pathRemainder = url.pathname.slice(API_BASE.length).replace(/^\/+/, '');
  const userIdParam = url.searchParams.get('userId') || '';
  const isSummary = url.searchParams.get('summary') === '1';
  let payload: any = null;

  if (method === 'PUT' || method === 'POST') {
    const raw = await readBody(req);
    let text: string;
    try {
      if ((req.headers['content-encoding'] || '').toString().includes('gzip')) {
        text = (await gunzipAsync(raw)).toString('utf-8');
      } else {
        text = raw.toString('utf-8');
      }
    } catch {
      return sendJson(res, 400, { error: 'Invalid compressed payload' });
    }
    try {
      payload = text ? JSON.parse(text) : null;
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  const resolvedUserId = (userIdParam || payload?.userId || '').trim();
  const safeUserId = sanitizeUserId(resolvedUserId);
  if (!safeUserId) {
    return sendJson(res, 400, { error: 'userId is required' });
  }

  const userDir = path.join(LOCAL_SYNC_ROOT, safeUserId);
  await fs.mkdir(userDir, { recursive: true });

  if (!pathRemainder) {
    if (method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
    const entries = await fs.readdir(userDir, { withFileTypes: true });
    const saves: any[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(userDir, entry.name), 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (isSummary) {
            const { data, ...rest } = parsed;
            saves.push(rest);
          } else {
            saves.push(parsed);
          }
        }
      } catch {
        continue;
      }
    }
    saves.sort((a, b) => (Number(a.slotIndex) || 0) - (Number(b.slotIndex) || 0));
    return sendJson(res, 200, saves);
  }

  const fileName = normalizeFileName(pathRemainder);
  const filePath = path.join(userDir, fileName);

  if (method === 'GET') {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return sendJson(res, 200, parsed);
    } catch (err: any) {
      if (err?.code === 'ENOENT') return sendJson(res, 404, { error: 'Not found' });
      return sendJson(res, 500, { error: 'Failed to read save' });
    }
  }

  if (method === 'PUT') {
    if (!payload || typeof payload !== 'object') {
      return sendJson(res, 400, { error: 'Invalid payload' });
    }
    payload.userId = resolvedUserId;
    payload.id = payload.id || pathRemainder;
    if (payload.slotIndex === undefined || payload.slotIndex === null) {
      const slotIndex = parseSlotIndex(pathRemainder);
      if (slotIndex !== null) payload.slotIndex = slotIndex;
    }
    await fs.writeFile(filePath, JSON.stringify(payload));
    return sendJson(res, 200, { ok: true });
  }

  if (method === 'DELETE') {
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        return sendJson(res, 500, { error: 'Failed to delete save' });
      }
    }
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'local-sync-storage',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              localSyncMiddleware(req, res, next).catch((err) => {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || 'Local sync error' }));
              });
            });
          },
          configurePreviewServer(server) {
            server.middlewares.use((req, res, next) => {
              localSyncMiddleware(req, res, next).catch((err) => {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || 'Local sync error' }));
              });
            });
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
