#!/usr/bin/env node
/**
 * Generates checksum files (.sha256, SHA256SUMS.txt), update-manifest.json,
 * and clean user-facing release-notes.md with an embedded hidden UPDATE_METADATA JSON block.
 *
 * Usage:
 *   node .github/scripts/prepare-release-assets.mjs \
 *     --dir release-assets \
 *     --version-name 1.0.11 \
 *     --version-code 111 \
 *     --notes "Faster order loading\nImproved stability"
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ASSET_PACKAGE_MAP = {
  'GOM.apk': {
    packageName: 'com.gom.globalonlinemarket',
    appName: 'GOM',
  },
};

const DEFAULT_USER_NOTES = [
  'Performance and stability improvements',
  'Security enhancements and bug fixes',
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const hasValue = i + 1 < argv.length && !argv[i + 1].startsWith('--');
      if (hasValue) {
        args[key] = argv[i + 1];
        i += 1;
      } else {
        args[key] = '';
      }
    }
  }
  return args;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function sanitizeNotes(rawNotes) {
  if (!rawNotes || !rawNotes.trim()) {
    return [...DEFAULT_USER_NOTES];
  }

  const normalized = rawNotes.replace(/\\n/g, '\n');
  const forbidden = [
    'github',
    '.apk',
    'sha256',
    'sha-256',
    'checksum',
    'update_metadata',
    'versioncode',
    'http://',
    'https://',
    'merge pull request',
    'merge branch',
  ];

  const lines = [];
  const seen = new Set();

  for (const rawLine of normalized.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (/^(#{1,6}\s|---|===|```|>|<)/.test(trimmed)) continue;

    const cleaned = trimmed
      .replace(/^[-*•+]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/[*_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length < 4 || cleaned.length > 140) continue;
    const lower = cleaned.toLowerCase();
    if (['true', 'false', 'null', 'undefined', 'none', 'n/a'].includes(lower)) continue;
    if (forbidden.some((term) => lower.includes(term))) continue;
    if (/\b[0-9a-f]{7,64}\b/i.test(cleaned)) continue;
    if (/^(feat|fix|chore|ci|docs|refactor|style|test|perf|build)(\([^)]+\))?:\s*/i.test(cleaned)) continue;

    if (!seen.has(lower)) {
      seen.add(lower);
      lines.push(cleaned);
    }
    if (lines.length >= 5) break;
  }

  return lines.length > 0 ? lines : [...DEFAULT_USER_NOTES];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const releaseDir = path.resolve(args.dir || 'release-assets');
  const versionName = String(args['version-name'] || '1.0.0').trim().replace(/^v/i, '');
  const versionCode = Number.parseInt(String(args['version-code'] || '1'), 10);
  const userNotes = sanitizeNotes(args.notes || '');

  if (!fs.existsSync(releaseDir)) {
    throw new Error(`Release assets directory not found: ${releaseDir}`);
  }
  if (!Number.isInteger(versionCode) || versionCode <= 0) {
    throw new Error(`Invalid versionCode: ${args['version-code']}`);
  }

  const apkFiles = fs
    .readdirSync(releaseDir)
    .filter((file) => file.endsWith('.apk'))
    .sort();

  if (apkFiles.length === 0) {
    throw new Error(`No APK files found in ${releaseDir}`);
  }

  const sha256SumsLines = [];
  const assetsMeta = {};
  const packagesMeta = {};

  for (const fileName of apkFiles) {
    const fullPath = path.join(releaseDir, fileName);
    const stat = fs.statSync(fullPath);
    const sha256 = sha256File(fullPath);
    const mapped = ASSET_PACKAGE_MAP[fileName] || {
      packageName: 'com.gom.globalonlinemarket',
      appName: 'GOM',
    };

    // Individual .sha256 file
    fs.writeFileSync(path.join(releaseDir, `${fileName}.sha256`), `${sha256}  ${fileName}\n`, 'utf8');
    sha256SumsLines.push(`${sha256}  ${fileName}`);

    assetsMeta[fileName] = {
      packageName: mapped.packageName,
      appName: mapped.appName,
      versionName,
      versionCode,
      sha256,
      size: stat.size,
    };

    packagesMeta[mapped.packageName] = {
      assetName: fileName,
      appName: mapped.appName,
      versionName,
      versionCode,
      sha256,
      size: stat.size,
    };
  }

  // SHA256SUMS.txt
  fs.writeFileSync(path.join(releaseDir, 'SHA256SUMS.txt'), `${sha256SumsLines.join('\n')}\n`, 'utf8');

  const manifest = {
    schemaVersion: 1,
    publishedAt: new Date().toISOString(),
    versionName,
    versionCode,
    notes: userNotes,
    assets: assetsMeta,
    packages: packagesMeta,
  };

  // update-manifest.json
  fs.writeFileSync(
    path.join(releaseDir, 'update-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  // Compact metadata embedded inside hidden HTML comment in release-notes.md
  // Allows the in-app updater to read versionCode + per-APK SHA-256 directly from the
  // releases/latest JSON response with zero CORS issues in WebView.
  const embeddedMetadata = {
    versionName,
    versionCode,
    assets: assetsMeta,
    packages: packagesMeta,
  };

  const releaseNotesMarkdown = [
    ...userNotes.map((line) => `- ${line}`),
    '',
    `<!-- UPDATE_METADATA ${JSON.stringify(embeddedMetadata)} -->`,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(releaseDir, 'release-notes.md'), releaseNotesMarkdown, 'utf8');

  console.log(`Prepared release assets for v${versionName} (code ${versionCode}): ${apkFiles.join(', ')}`);
}

main();
