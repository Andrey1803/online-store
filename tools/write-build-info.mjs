import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public');
mkdirSync(outDir, { recursive: true });

function resolveSha() {
  const fromEnv =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromEnv) return String(fromEnv).slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: root }).trim();
  } catch {
    return 'dev';
  }
}

const info = {
  sha: resolveSha(),
  builtAt: new Date().toISOString(),
};

writeFileSync(join(outDir, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`, 'utf-8');
console.log(`build-info.json → ${info.sha} @ ${info.builtAt}`);
