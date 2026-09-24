'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { exec } = require('child_process');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'election.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const PID_FILE = path.join(ROOT, '.server.pid');
const BASE_PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
// SHA-256 of the configured admin password. Default password requested by project owner: ElectionMasco.
// The plain password is deliberately NOT stored in browser JavaScript.
const DEFAULT_PASSWORD_HASH = '578976d4b60b34e0dc254e94e65ac127a18b7bd342bc3dc551493c50cfcd78f4';
const ADMIN_PASSWORD_HASH = String(process.env.ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH).toLowerCase();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 30 * 1024 * 1024;
const sessions = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sha256(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function json(res, code, obj, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...extraHeaders
  });
  res.end(body);
}

function send(res, code, body, type = 'text/plain; charset=utf-8', extraHeaders = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  res.writeHead(code, {
    'Content-Type': type,
    'Content-Length': buf.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...extraHeaders
  });
  res.end(buf);
}

function safePath(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split('?')[0]); }
  catch { return null; }
  if (p === '/' || p === '') p = '/index.html';
  if (p === '/data' || p.startsWith('/data/')) return null;
  const full = path.normalize(path.join(ROOT, p));
  return full.startsWith(ROOT) ? full : null;
}

function validateElectionData(obj) {
  if (!obj || typeof obj !== 'object') return 'Invalid election data';
  if (!Array.isArray(obj.branches)) return 'branches must be an array';
  if (!Array.isArray(obj.units)) return 'units must be an array';
  if (!Array.isArray(obj.candidates)) return 'candidates must be an array';
  if (obj.symbols !== undefined && !Array.isArray(obj.symbols)) return 'symbols must be an array';
  if (obj.symbolAllocations !== undefined && !Array.isArray(obj.symbolAllocations)) return 'symbolAllocations must be an array';
  return '';
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) { reject(new Error('Invalid JSON request')); }
    });
    req.on('error', reject);
  });
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
}

function getToken(req) {
  const auth = String(req.headers.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return String(req.headers['x-admin-token'] || '').trim();
}

function requireAdmin(req, res) {
  cleanupSessions();
  const token = getToken(req);
  const session = token && sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    json(res, 401, { ok: false, message: 'Admin session expired. Please login again.' });
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}

function createBackup() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(DATA_FILE, path.join(BACKUP_DIR, `election-${stamp}.json`));
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(x => /^election-.*\.json$/i.test(x))
      .map(name => ({ name, mtime: fs.statSync(path.join(BACKUP_DIR, name)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    files.slice(30).forEach(f => { try { fs.unlinkSync(path.join(BACKUP_DIR, f.name)); } catch (_) {} });
  } catch (err) {
    console.warn('Backup warning:', err.message);
  }
}

function saveElectionData(obj) {
  const validationError = validateElectionData(obj);
  if (validationError) throw new Error(validationError);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  createBackup();
  const temp = path.join(DATA_DIR, `election.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(temp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(temp, DATA_FILE);
}

function localIpv4Addresses() {
  const out = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const info of entries || []) {
      if (info.family === 'IPv4' && !info.internal) out.push(info.address);
    }
  }
  return [...new Set(out)];
}

function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      const cleanUrl = req.url.split('?')[0];

      if (cleanUrl === '/api/health' && req.method === 'GET') {
        return json(res, 200, { ok: true, app: 'MASCO Election Server', time: new Date().toISOString() });
      }

      if (cleanUrl === '/api/auth/login' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const userOk = crypto.timingSafeEqual(Buffer.from(sha256(body.username || '')), Buffer.from(sha256(ADMIN_USER)));
        const passOk = crypto.timingSafeEqual(Buffer.from(sha256(body.password || '')), Buffer.from(ADMIN_PASSWORD_HASH));
        if (!userOk || !passOk) return json(res, 401, { ok: false, message: 'ব্যবহারকারীর নাম অথবা পাসওয়ার্ড সঠিক নয়' });
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, { username: ADMIN_USER, expiresAt: Date.now() + SESSION_TTL_MS });
        return json(res, 200, { ok: true, token, expiresIn: Math.floor(SESSION_TTL_MS / 1000) });
      }

      if (cleanUrl === '/api/auth/check' && req.method === 'GET') {
        const session = requireAdmin(req, res);
        if (!session) return;
        return json(res, 200, { ok: true, username: session.username });
      }

      if (cleanUrl === '/api/auth/logout' && req.method === 'POST') {
        const token = getToken(req);
        if (token) sessions.delete(token);
        return json(res, 200, { ok: true });
      }

      if (cleanUrl === '/api/data') {
        if (req.method === 'GET') {
          return fs.readFile(DATA_FILE, (err, buf) => {
            if (err) return json(res, 500, { ok: false, message: 'Election data read failed' });
            return send(res, 200, buf, 'application/json; charset=utf-8');
          });
        }
        if (req.method === 'POST') {
          if (!requireAdmin(req, res)) return;
          try {
            const obj = await readJsonBody(req);
            saveElectionData(obj);
            return json(res, 200, { ok: true, savedAt: new Date().toISOString() });
          } catch (err) {
            return json(res, 400, { ok: false, message: 'JSON save failed: ' + err.message });
          }
        }
        return json(res, 405, { ok: false, message: 'Method not allowed' }, { Allow: 'GET, POST' });
      }

      const file = safePath(req.url);
      if (!file) return send(res, 403, 'Forbidden');
      fs.stat(file, (err, stat) => {
        if (err || !stat.isFile()) return send(res, 404, 'Not found');
        fs.readFile(file, (readErr, buf) => {
          if (readErr) return send(res, 500, 'Read failed');
          const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
          return send(res, 200, buf, type);
        });
      });
    } catch (err) {
      console.error('Request error:', err);
      if (!res.headersSent) json(res, 500, { ok: false, message: 'Server error' });
      else res.end();
    }
  });
}

let activeServer = null;
let activePort = null;
let shuttingDown = false;

function writePidFile() { try { fs.writeFileSync(PID_FILE, String(process.pid), 'utf8'); } catch (_) {} }
function removePidFile() { try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch (_) {} }
function openAdmin(port) { if (process.platform === 'win32') exec(`start "" "http://localhost:${port}/admin.html"`); }

function tryListen(port, remaining = 20) {
  const server = createAppServer();
  server.once('error', err => {
    if (err && err.code === 'EADDRINUSE' && remaining > 0) {
      console.log(`Port ${port} is busy. Trying ${port + 1}...`);
      return tryListen(port + 1, remaining - 1);
    }
    console.error('Server could not start:', err?.message || err);
    removePidFile();
    process.exit(1);
  });

  server.listen(port, HOST, () => {
    activeServer = server;
    activePort = port;
    writePidFile();
    console.log('\n==============================================');
    console.log(' MASCO Election Node Server is running');
    console.log('==============================================');
    console.log(`Admin  : http://localhost:${port}/admin.html`);
    console.log(`Result : http://localhost:${port}/index.html?branch=branch-concept`);
    for (const ip of localIpv4Addresses()) {
      console.log(`LAN    : http://${ip}:${port}/admin.html`);
      console.log(`LAN    : http://${ip}:${port}/index.html?branch=branch-concept`);
    }
    console.log(`Data   : ${DATA_FILE}`);
    console.log('Dashboard refreshes server data every 5 seconds.');
    console.log('Press Ctrl + C to stop.\n');
    openAdmin(port);
  });
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal}: stopping MASCO Election Server...`);
  removePidFile();
  if (!activeServer) return process.exit(0);
  const timer = setTimeout(() => process.exit(0), 3000); timer.unref();
  activeServer.close(() => { clearTimeout(timer); process.exit(0); });
  if (typeof activeServer.closeIdleConnections === 'function') activeServer.closeIdleConnections();
}

process.on('SIGINT', () => shutdown('Ctrl + C'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', removePidFile);
process.on('uncaughtException', err => { console.error('Unexpected server error:', err); removePidFile(); process.exit(1); });

tryListen(BASE_PORT);
