#!/usr/bin/env node
/**
 * Scans public/remote-images/ and updates public/remote-images/manifest.json
 * without modifying any original uploaded image files.
 *
 * - Newly uploaded images get version: 1 and current updatedAt timestamp.
 * - Replaced images (detected by SHA-256 content hash change) auto-increment version and update updatedAt.
 * - Unchanged images preserve their existing version and updatedAt so clients skip re-downloading them.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const REMOTE_IMAGES_DIR = path.join(REPO_ROOT, 'public', 'remote-images');
const MANIFEST_PATH = path.join(REMOTE_IMAGES_DIR, 'manifest.json');

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function collectImageFiles(dirPath, baseDir = dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectImageFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (MIME_BY_EXT[ext]) {
        const relFromRemoteDir = path.relative(baseDir, fullPath).split(path.sep).join('/');
        results.push({
          fullPath,
          fileName: relFromRemoteDir,
          ext,
        });
      }
    }
  }

  return results.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function loadExistingManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.images)) {
      return parsed;
    }
  } catch {
    // Ignore malformed existing manifest and regenerate cleanly
  }
  return null;
}

function main() {
  fs.mkdirSync(REMOTE_IMAGES_DIR, { recursive: true });

  const existingManifest = loadExistingManifest();
  const previousByPath = new Map();
  if (existingManifest?.images) {
    for (const item of existingManifest.images) {
      if (item && typeof item.path === 'string') {
        previousByPath.set(item.path, item);
      }
    }
  }

  const nowIso = new Date().toISOString();
  const files = collectImageFiles(REMOTE_IMAGES_DIR);
  let hasChanges = !existingManifest;

  const images = files.map(({ fullPath, fileName, ext }) => {
    const repoPath = `public/remote-images/${fileName}`;
    const stat = fs.statSync(fullPath);
    const hash = sha256File(fullPath);
    const logicalName = fileName.replace(/\.[^.]+$/, '');
    const prev = previousByPath.get(repoPath);

    if (prev && prev.hash === hash) {
      return {
        name: logicalName,
        fileName,
        path: repoPath,
        version: Number.isInteger(prev.version) && prev.version > 0 ? prev.version : 1,
        hash,
        size: stat.size,
        mimeType: MIME_BY_EXT[ext],
        updatedAt: typeof prev.updatedAt === 'string' && prev.updatedAt ? prev.updatedAt : nowIso,
      };
    }

    hasChanges = true;
    const nextVersion = prev && Number.isInteger(prev.version) && prev.version > 0 ? prev.version + 1 : 1;

    return {
      name: logicalName,
      fileName,
      path: repoPath,
      version: nextVersion,
      hash,
      size: stat.size,
      mimeType: MIME_BY_EXT[ext],
      updatedAt: nowIso,
    };
  });

  if (existingManifest && existingManifest.images.length !== images.length) {
    hasChanges = true;
  }

  const nextManifest = {
    schemaVersion: 1,
    directory: 'public/remote-images',
    generatedAt: hasChanges ? nowIso : (existingManifest?.generatedAt || nowIso),
    images,
  };

  const serialized = `${JSON.stringify(nextManifest, null, 2)}\n`;
  const currentContent = fs.existsSync(MANIFEST_PATH) ? fs.readFileSync(MANIFEST_PATH, 'utf8') : '';

  if (serialized !== currentContent) {
    fs.writeFileSync(MANIFEST_PATH, serialized, 'utf8');
    console.log(`Updated public/remote-images/manifest.json (${images.length} image(s) tracked).`);
  } else {
    console.log(`public/remote-images/manifest.json is already up to date (${images.length} image(s)).`);
  }
}

main();
