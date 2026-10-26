import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const processes = [
  spawn(process.execPath, [viteEntry, '--host', '0.0.0.0'], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
  spawn(process.execPath, ['src/server.js'], {
    cwd: path.join(projectRoot, 'server'),
    stdio: 'inherit',
  }),
];

let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (child.exitCode === null) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error('Could not start a LifeOS development service:', error.message);
    stopAll(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stopAll(code || 0);
  });
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
