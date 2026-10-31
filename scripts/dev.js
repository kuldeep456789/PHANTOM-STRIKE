// scripts/dev.js
// Universal dev launcher with production fallback for platforms like Render

const { spawn } = require('child_process');

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

if (isProduction) {
  console.log('[Phantom Strike] Production environment detected. Delegating `npm run dev` to production startup...');
  require('./start.js');
} else {
  const targetService = (process.env.SERVICE || 'backend').toLowerCase();
  console.log(`[Phantom Strike] Starting development service: ${targetService}`);

  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const scriptToRun = targetService === 'frontend' ? 'dev:frontend' : 'dev:backend';

  const child = spawn(npmCmd, ['run', scriptToRun], {
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error('[Phantom Strike] Failed to start dev service:', err);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (code !== null) {
      process.exit(code);
    } else if (signal) {
      process.kill(process.pid, signal);
    }
  });
}
