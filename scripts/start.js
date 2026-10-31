// scripts/start.js
// Production startup script for Phantom Strike on Render, Railway, or Docker

const { spawn } = require('child_process');

const targetService = (process.env.SERVICE || process.env.RENDER_SERVICE || 'backend').toLowerCase();

console.log(`[Phantom Strike] Starting production service: ${targetService}`);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const scriptToRun = targetService === 'frontend' ? 'start:frontend' : 'start:backend';

const child = spawn(npmCmd, ['run', scriptToRun], {
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('[Phantom Strike] Failed to start service:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  } else if (signal) {
    process.kill(process.pid, signal);
  }
});
