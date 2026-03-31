import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function resolveEnvPath(name) {
  const value = String(process.env[name] ?? '').trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return path.resolve(ROOT, value);
}

function copyFile(sourcePath, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.copyFileSync(sourcePath, outputPath);
}

export function buildSelectedOutlineLookup({
  sourcePath,
  outputPath,
}) {
  copyFile(sourcePath, outputPath);
}

function main() {
  buildSelectedOutlineLookup({
    sourcePath: resolveEnvPath('SELECTED_OUTLINE_SOURCE_PATH'),
    outputPath: resolveEnvPath('SELECTED_OUTLINE_OUTPUT_PATH'),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
