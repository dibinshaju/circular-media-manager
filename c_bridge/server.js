import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const daemonPath = path.join(projectRoot, 'bin', 'c_daemon');

console.log(`[C Bridge] Starting native C CDLL Daemon: ${daemonPath}`);

const cProcess = spawn(daemonPath, [], {
  cwd: projectRoot,
  stdio: ['pipe', 'pipe', 'inherit'],
});

let pendingResolvers = [];

cProcess.stdout.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line.trim());
      if (pendingResolvers.length > 0) {
        const resolve = pendingResolvers.shift();
        resolve(parsed);
      }
    } catch (e) {
      console.warn('[C Bridge] Non-JSON stdout from C daemon:', line);
    }
  }
});

function sendCommandToC(cmd) {
  return new Promise((resolve, reject) => {
    pendingResolvers.push(resolve);
    cProcess.stdin.write(cmd + '\n', (err) => {
      if (err) reject(err);
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === '/api/cdll/state' && req.method === 'GET') {
      const state = await sendCommandToC('GET_ALL');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
      return;
    }

    if (url.pathname === '/api/cdll/next' && req.method === 'POST') {
      const state = await sendCommandToC('NEXT');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
      return;
    }

    if (url.pathname === '/api/cdll/prev' && req.method === 'POST') {
      const state = await sendCommandToC('PREV');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
      return;
    }

    if (url.pathname === '/api/cdll/select' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', async () => {
        const { id } = JSON.parse(body || '{}');
        const state = await sendCommandToC(`SELECT ${id || ''}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
      });
      return;
    }

    if (url.pathname === '/api/cdll/remove' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', async () => {
        const { id } = JSON.parse(body || '{}');
        const state = await sendCommandToC(`REMOVE ${id || ''}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
      });
      return;
    }

    if (url.pathname === '/api/cdll/add' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', async () => {
        const { id, title, artist, type, source } = JSON.parse(body || '{}');
        const cmd = `ADD ${id}|${title}|${artist || ''}|${type || 'audio'}|${source || ''}`;
        const state = await sendCommandToC(cmd);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
      });
      return;
    }

    if (url.pathname === '/api/cdll/clear' && req.method === 'POST') {
      const state = await sendCommandToC('CLEAR');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[C Bridge] Native C Engine HTTP Bridge listening on http://localhost:${PORT}`);
});
