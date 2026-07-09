import 'dotenv/config';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import cookieParser from 'cookie-parser';
import { initFirebase, getDb } from './app/services/firebase.server';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(cookieParser());
const angularApp = new AngularNodeAppEngine();

/** API — Debug: test Firebase init */
app.get('/api/debug', async (_req, res) => {
  try {
    const env = process.env['ENVIRONMENT'] || '(not set)';
    const ok = await initFirebase();
    res.json({ ok, environment: env });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

/** API — Auth: verify session cookie and return user profile */
app.get('/api/auth/me', async (req, res) => {
  const session = req.cookies?.['session'];
  if (!session) { res.status(401).json({ error: 'No session' }); return; }
  try {
    await initFirebase();
    const { getAuth } = await import('firebase-admin/auth');
    const decoded = await getAuth().verifySessionCookie(session, true);
    const { uid, email, name, picture } = decoded;
    res.json({ uid, email, name, picture } as Record<string, string>);
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
});

const KAISTU_DOMAIN = '@kaistu.com';

/** API — Auth: exchange Firebase idToken for a session cookie */
app.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) { res.status(400).json({ error: 'Missing idToken' }); return; }
    await initFirebase();
    const { getAuth } = await import('firebase-admin/auth');
    const decoded = await getAuth().verifyIdToken(idToken);
    const email = decoded.email as string | undefined;
    if (!email || !email.endsWith(KAISTU_DOMAIN)) {
      res.status(403).json({ error: `Access restricted to ${KAISTU_DOMAIN} accounts` });
      return;
    }
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env['ENVIRONMENT'] !== 'LOCAL',
      sameSite: 'lax',
      path: '/',
    });
    const { uid, name, picture } = decoded;
    res.json({ uid, email, name, picture } as Record<string, string>);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

/** API — Auth: clear session cookie */
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('session', { path: '/' });
  res.json({ ok: true });
});

/** API — Integration connection test */
app.get('/api/integrations/test', (req, res) => {
  const targetUrl = req.query['url'] as string | undefined;
  if (!targetUrl) {
    res.json({ ok: false, error: 'Missing url parameter' });
    return;
  }
  const isHttps = targetUrl.startsWith('https:');
  const requester = isHttps ? httpsRequest : httpRequest;
  const urlObj = new URL(targetUrl);
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    timeout: 5000,
    headers: { 'User-Agent': 'KaistuAdmin/1.0' },
  };
  const proxyReq = requester(options, (proxyRes) => {
    res.json({ ok: true, status: proxyRes.statusCode });
  });
  proxyReq.on('error', (err: NodeJS.ErrnoException) => {
    res.json({ ok: false, error: err.code || err.message });
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.json({ ok: false, error: 'TIMEOUT' });
  });
  proxyReq.end();
});

/** API — n8n proxy: forwards requests to n8n REST API */
app.all('/api/n8n/proxy', express.json(), (req, res) => {
  const baseUrl = req.query['baseUrl'] as string | undefined;
  const apiPath = req.query['path'] as string | undefined;
  const apiKey = req.query['apiKey'] as string | undefined;
  if (!baseUrl || !apiPath) {
    res.status(400).json({ error: 'Missing baseUrl or path' });
    return;
  }
  const targetUrl = `${baseUrl.replace(/\/+$/, '')}/${apiPath.replace(/^\/+/, '')}`;
  const isHttps = targetUrl.startsWith('https:');
  const requester = isHttps ? httpsRequest : httpRequest;
  const urlObj = new URL(targetUrl);
  const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined;
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: req.method,
    timeout: 15000,
    headers: {
      'User-Agent': 'KaistuAdmin/1.0',
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-N8N-API-KEY': apiKey } : {}),
      ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {}),
    } as Record<string, string>,
  };
  const proxyReq = requester(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk: string) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        res.status(proxyRes.statusCode ?? 200).json(JSON.parse(data));
      } catch {
        res.status(proxyRes.statusCode ?? 200).send(data);
      }
    });
  });
  proxyReq.on('error', (err: NodeJS.ErrnoException) => {
    res.status(502).json({ error: err.code || err.message });
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'TIMEOUT' });
  });
  if (body) proxyReq.write(body);
  proxyReq.end();
});

/** API — ComfyUI: list workflow files from local filesystem */
app.get('/api/comfyui/list-workflows', (req, res) => {
  const installPath = req.query['installPath'] as string | undefined;
  if (!installPath) {
    res.status(400).json({ error: 'Missing installPath' });
    return;
  }
  const workflowsDir = join(installPath, 'user', 'default', 'workflows');
  try {
    if (!existsSync(workflowsDir)) {
      res.status(404).json({ error: 'Workflows directory not found', path: workflowsDir });
      return;
    }
    const files = readdirSync(workflowsDir)
      .filter((f) => f.endsWith('.json') || f.endsWith('.JSON'))
      .map((f) => f.replace(/\.json$/i, ''));
    res.json({ files, path: workflowsDir });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** API — ComfyUI: read a single workflow file from local filesystem */
app.get('/api/comfyui/read-workflow', (req, res) => {
  const installPath = req.query['installPath'] as string | undefined;
  const filename = req.query['filename'] as string | undefined;
  if (!installPath || !filename) {
    res.status(400).json({ error: 'Missing installPath or filename' });
    return;
  }
  const safeName = filename.replace(/\.\.\//g, '').replace(/\\/g, '').replace(/\//g, '');
  const filePath = join(installPath, 'user', 'default', 'workflows', `${safeName}.json`);
  try {
    if (!existsSync(filePath)) {
      res.status(404).json({ error: 'Workflow file not found', path: filePath });
      return;
    }
    const content = JSON.parse(readFileSync(filePath, 'utf-8'));
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** API — ComfyUI: auto-discover installations by scanning default Windows path */
app.get('/api/comfyui/discover', (_req, res) => {
  const userProfile = process.env['USERPROFILE'];
  if (!userProfile) { res.json({ installations: [], baseDir: null }); return; }
  const baseDir = join(userProfile, 'AppData', 'Local', 'Comfy-Desktop', 'ComfyUI-Installs');
  let installNames: string[] = [];
  try { installNames = readdirSync(baseDir).filter((f) => existsSync(join(baseDir, f, 'ComfyUI'))); }
  catch { /* no ComfyUI-Desktop installs found */ }
  const installations = installNames.map((name) => {
    const comfyDir = join(baseDir, name, 'ComfyUI');
    const wfDir = join(comfyDir, 'user', 'default', 'workflows');
    let workflows: string[] = [];
    try { workflows = readdirSync(wfDir).filter((f) => f.endsWith('.json') || f.endsWith('.JSON')).map((f) => f.replace(/\.json$/i, '')); }
    catch { /* no workflows dir */ }
    return { name, path: comfyDir, workflows, workflowCount: workflows.length };
  });
  res.json({ installations, baseDir });
});

// Ensure Firebase is ready before any API call
async function withDb(): Promise<Firestore> {
  await initFirebase();
  return getDb();
}

/** API — Universes CRUD (BFF) */
app.get('/api/universes', async (_req, res) => {
  try {
    const dbs = await withDb();
    const snapshot = await dbs.collection('universes').orderBy('createdAt', 'desc').get();
    const universes = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
      .filter((u: Record<string, unknown>) => u['status'] !== 'deleted');
    res.json(universes);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/universes/:slug', async (req, res) => {
  try {
    const dbs = await withDb();
    const snapshot = await dbs.collection('universes').where('slug', '==', req.params['slug']).limit(1).get();
    if (snapshot.empty) { res.status(404).json({ error: 'Not found' }); return; }
    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/universes', express.json(), async (req, res) => {
  try {
    const dbs = await withDb();
    const slug = req.body.slug;
    if (!slug) { res.status(400).json({ error: 'slug is required' }); return; }
    const data = { ...req.body, createdAt: Date.now(), updatedAt: Date.now() };
    await dbs.collection('universes').doc(slug).set(data);
    res.json({ id: slug });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/universes/:slug', express.json(), async (req, res) => {
  try {
    const dbs = await withDb();
    const snapshot = await dbs.collection('universes').where('slug', '==', req.params['slug']).limit(1).get();
    if (snapshot.empty) { res.status(404).json({ error: 'Not found' }); return; }
    await snapshot.docs[0].ref.update({ ...req.body, updatedAt: Date.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/universes/:slug', async (req, res) => {
  try {
    const dbs = await withDb();
    const snapshot = await dbs.collection('universes').where('slug', '==', req.params['slug']).limit(1).get();
    if (snapshot.empty) { res.status(404).json({ error: 'Not found' }); return; }
    await snapshot.docs[0].ref.update({ status: 'deleted', updatedAt: Date.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Worlds CRUD ─────────────────────────────────────────────────

app.get('/api/worlds', async (_req, res) => {
  try {
    const dbs = await withDb();
    const snapshot = await dbs.collection('worlds').orderBy('createdAt', 'desc').get();
    const worlds = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
      .filter((w: Record<string, unknown>) => w['status'] !== 'deleted');
    res.json(worlds);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/worlds/:slug', async (req, res) => {
  try {
    const dbs = await withDb();
    const doc = await dbs.collection('worlds').doc(req.params['slug']).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/worlds', express.json(), async (req, res) => {
  try {
    const dbs = await withDb();
    const slug = req.body.slug;
    if (!slug) { res.status(400).json({ error: 'slug is required' }); return; }
    const data = { ...req.body, createdAt: Date.now(), updatedAt: Date.now() };
    await dbs.collection('worlds').doc(slug).set(data);
    res.json({ id: slug });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/worlds/:slug', express.json(), async (req, res) => {
  try {
    const dbs = await withDb();
    const doc = dbs.collection('worlds').doc(req.params['slug']);
    const snap = await doc.get();
    if (!snap.exists) { res.status(404).json({ error: 'Not found' }); return; }
    await doc.update({ ...req.body, updatedAt: Date.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/worlds/:slug', async (req, res) => {
  try {
    const dbs = await withDb();
    const doc = dbs.collection('worlds').doc(req.params['slug']);
    const snap = await doc.get();
    if (!snap.exists) { res.status(404).json({ error: 'Not found' }); return; }
    await doc.update({ status: 'deleted', updatedAt: Date.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Studio Workers CRUD ──────────────────────────────────────────

app.get('/api/studio-workers', async (_req, res) => {
  try {
    const dbs = await withDb();
    const snapshot = await dbs.collection('studio_workers').orderBy('createdAt', 'desc').get();
    const workers = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
      .filter((w: Record<string, unknown>) => w['status'] !== 'deleted');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/studio-workers/:slug', async (req, res) => {
  try {
    const dbs = await withDb();
    const doc = await dbs.collection('studio_workers').doc(req.params['slug']).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/studio-workers', express.json(), async (req, res) => {
  try {
    const dbs = await withDb();
    const slug = req.body.slug;
    if (!slug) { res.status(400).json({ error: 'slug is required' }); return; }
    const data = { ...req.body, createdAt: Date.now(), updatedAt: Date.now() };
    await dbs.collection('studio_workers').doc(slug).set(data);
    res.json({ id: slug });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/studio-workers/:slug', express.json(), async (req, res) => {
  try {
    const dbs = await withDb();
    const doc = dbs.collection('studio_workers').doc(req.params['slug']);
    const snap = await doc.get();
    if (!snap.exists) { res.status(404).json({ error: 'Not found' }); return; }
    await doc.update({ ...req.body, updatedAt: Date.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/studio-workers/:slug', async (req, res) => {
  try {
    const dbs = await withDb();
    const doc = dbs.collection('studio_workers').doc(req.params['slug']);
    const snap = await doc.get();
    if (!snap.exists) { res.status(404).json({ error: 'Not found' }); return; }
    await doc.update({ status: 'deleted', updatedAt: Date.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** Serve static files from /browser */
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false, redirect: false }));

/** Angular SSR rendering */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/** Start server */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  const server = app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  // WebSocket proxy for ComfyUI (bypasses ComfyUI's origin check)
  const wss = new WebSocketServer({ server, path: '/api/n8n/ws-proxy' });
  wss.on('connection', (clientWs, req) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const host = url.searchParams.get('host');
      const port = url.searchParams.get('port');
      const clientId = url.searchParams.get('clientId') ?? '';
      if (!host || !port) {
        clientWs.close(4000, 'Missing host or port');
        return;
      }
      const comfyUrl = `ws://${host}:${port}/ws?clientId=${clientId}`;
      const comfyWs = new WebSocket(comfyUrl);
      comfyWs.on('open', () => {
        clientWs.send(JSON.stringify({ type: 'connected', data: 'Proxy conectado a ComfyUI' }));
      });
      comfyWs.on('message', (data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data.toString());
        }
      });
      comfyWs.on('error', () => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'error', data: 'Error de conexión con ComfyUI' }));
        }
      });
      comfyWs.on('close', () => {
        clientWs.close();
      });
      clientWs.on('message', (data) => {
        if (comfyWs.readyState === WebSocket.OPEN) {
          comfyWs.send(data.toString());
        }
      });
      clientWs.on('close', () => {
        comfyWs.close();
      });
    } catch {
      clientWs.close(4000, 'Internal error');
    }
  });

  // Pre-warm Firebase in background (doesn't block startup)
  initFirebase().catch((err) => console.error('Firebase init failed:', err));
}

export const reqHandler = createNodeRequestHandler(app);
