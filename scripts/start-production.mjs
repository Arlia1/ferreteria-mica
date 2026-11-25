import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const fullPath = path.join(ROOT_DIR, file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          const val = values.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val.trim();
          }
        }
      }
    } catch {}
  }
}
loadEnv();

const BACKEND_PORT = process.env.BACKEND_PORT || '4000';
const STORE_PORT = process.env.NEXT_PORT || (process.env.PORT && process.env.PORT !== BACKEND_PORT ? process.env.PORT : '3000');
const ADMIN_PORT = process.env.ADMIN_PORT || '3001';

console.log('=======================================================');
console.log('  FERRETERIA MICA - INICIANDO MODO PRODUCCION          ');
console.log(`  Backend: http://localhost:${BACKEND_PORT}`);
console.log(`  Storefront: http://localhost:${STORE_PORT}`);
console.log(`  Gateway Admin: http://localhost:${ADMIN_PORT}`);
console.log('=======================================================');

const children = [];

function runProcess(command, args, name, customEnv = {}) {
  const proc = spawn(command, args, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', ...customEnv },
  });

  proc.on('error', (err) => console.error(`[${name}] Error:`, err));
  proc.on('exit', (code, signal) => console.log(`[${name}] termino con codigo ${code || signal}`));
  children.push(proc);
  return proc;
}

async function waitForBackend(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

runProcess('node', ['backend/server.mjs'], 'BACKEND', { BACKEND_PORT });
runProcess('npx', ['next', 'start', '-p', STORE_PORT], 'NEXTJS', {
  BACKEND_URL: process.env.BACKEND_URL || `http://127.0.0.1:${BACKEND_PORT}`,
});

waitForBackend().then((ready) => {
  if (!ready) {
    console.warn('Backend demoro en responder. Iniciando Gateway Administrador...');
  }
  runProcess('node', ['scripts/admin-server.mjs'], 'ADMIN', {
    BACKEND_PORT,
    NEXT_PORT: STORE_PORT,
    ADMIN_PORT,
  });
});

function cleanup() {
  console.log('\nDeteniendo servicios de Ferreteria Mica...');
  for (const proc of children) {
    try {
      proc.kill('SIGTERM');
    } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
