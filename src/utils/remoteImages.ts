/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getInstalledAppInfo } from './appUpdater';

export interface RemoteImageEntry {
  name: string;
  fileName: string;
  path: string;
  version: number;
  hash: string;
  size: number;
  mimeType: string;
  updatedAt: string;
}

export interface RemoteImagesManifest {
  schemaVersion: number;
  directory: string;
  generatedAt: string;
  images: RemoteImageEntry[];
}

export interface CachedRemoteImageRecord extends RemoteImageEntry {
  blob: Blob;
  cachedAt: number;
}

export interface RemoteImageSyncResult {
  status: 'synced' | 'offline' | 'unconfigured' | 'not_found' | 'error';
  total: number;
  downloaded: number;
  skipped: number;
  removed: number;
  syncedAt: number | null;
}

const DB_NAME = 'gom_remote_images_db';
const DB_VERSION = 1;
const STORE_IMAGES = 'images';
const STORE_META = 'meta';

const REMOTE_DIR_PREFIX = 'public/remote-images/';
const MANIFEST_REPO_PATH = 'public/remote-images/manifest.json';
const ALLOWED_RAW_HOST = 'raw.githubusercontent.com';
const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_PATTERN = /^[A-Za-z0-9._/-]+$/;
const ALLOWED_IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|avif)$/i;

const MANIFEST_TIMEOUT_MS = 12_000;
const IMAGE_DOWNLOAD_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB per image safety cap

export const REMOTE_IMAGES_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const REMOTE_IMAGES_RESUME_STALE_MS = 2 * 60 * 1000; // 2 minutes

function normalizeRepoSlug(raw: string | undefined | null): string {
  const trimmed = String(raw ?? '').trim().replace(/^\/+|\/+$/g, '');
  return REPO_PATTERN.test(trimmed) ? trimmed : '';
}

function normalizeBranch(raw: string | undefined | null): string {
  const trimmed = String(raw ?? '').trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed || trimmed.includes('..') || !BRANCH_PATTERN.test(trimmed)) {
    return 'main';
  }
  return trimmed;
}

export async function resolveRemoteImagesConfig(): Promise<{ repo: string; branch: string }> {
  const branch = normalizeBranch(import.meta.env.VITE_GITHUB_BRANCH);

  // 1. Optional dedicated images repo env override
  const envImagesRepo = normalizeRepoSlug(import.meta.env.VITE_GITHUB_IMAGES_REPO);
  if (envImagesRepo) {
    return { repo: envImagesRepo, branch };
  }

  // 2. Native Android BuildConfig.GITHUB_UPDATE_REPO (injected by GitHub Actions)
  try {
    const appInfo = await getInstalledAppInfo();
    const nativeRepo = normalizeRepoSlug(appInfo.updateRepo);
    if (nativeRepo) {
      return { repo: nativeRepo, branch };
    }
  } catch {
    // Fall through to Vite build-time env
  }

  // 3. Vite build-time VITE_GITHUB_REPO
  const envRepo = normalizeRepoSlug(import.meta.env.VITE_GITHUB_REPO);
  return { repo: envRepo, branch };
}

export function isValidRemoteImagePath(rawPath: string): boolean {
  if (!rawPath || typeof rawPath !== 'string') return false;
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith(REMOTE_DIR_PREFIX)) return false;
  if (
    trimmed.includes('..') ||
    trimmed.includes('\\') ||
    trimmed.includes('//') ||
    trimmed.includes('?') ||
    trimmed.includes('#')
  ) {
    return false;
  }
  return ALLOWED_IMAGE_EXT.test(trimmed);
}

export function buildGitHubRawUrl(
  repo: string,
  branch: string,
  repoRelativePath: string,
  cacheBustToken?: string
): string | null {
  const validRepo = normalizeRepoSlug(repo);
  const validBranch = normalizeBranch(branch);
  if (!validRepo) return null;

  const cleanPath = repoRelativePath.trim().replace(/^\/+/, '');
  if (!cleanPath || cleanPath.includes('..') || cleanPath.includes('\\')) {
    return null;
  }

  const encodedPath = cleanPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const encodedBranch = validBranch
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const url = new URL(`https://${ALLOWED_RAW_HOST}/${validRepo}/${encodedBranch}/${encodedPath}`);
  if (cacheBustToken) {
    url.searchParams.set('v', cacheBustToken);
  }

  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== ALLOWED_RAW_HOST) {
    return null;
  }

  return url.toString();
}

export function getBundledFallbackUrl(fileNameOrPath: string): string {
  const clean = fileNameOrPath
    .trim()
    .replace(/^\/+/, '')
    .replace(/^public\/remote-images\//, '')
    .replace(/^remote-images\//, '');
  if (!clean || clean.includes('..') || clean.includes('\\')) {
    return '';
  }
  const encoded = clean
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/remote-images/${encoded}`;
}

function normalizeManifestEntry(raw: unknown): RemoteImageEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  let normalizedPath = typeof obj.path === 'string' ? obj.path.trim().replace(/^\/+/, '') : '';
  if (normalizedPath && !normalizedPath.startsWith(REMOTE_DIR_PREFIX)) {
    if (normalizedPath.startsWith('remote-images/')) {
      normalizedPath = `public/${normalizedPath}`;
    } else if (!normalizedPath.includes('/')) {
      normalizedPath = `${REMOTE_DIR_PREFIX}${normalizedPath}`;
    }
  }

  if (!isValidRemoteImagePath(normalizedPath)) {
    return null;
  }

  const derivedFileName = normalizedPath.slice(REMOTE_DIR_PREFIX.length);
  const fileName =
    typeof obj.fileName === 'string' && obj.fileName.trim()
      ? obj.fileName.trim().replace(/^\/+/, '')
      : derivedFileName;
  const derivedName = derivedFileName.replace(/\.[^.]+$/, '');
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : derivedName;

  const parsedVersion = Number.parseInt(String(obj.version ?? '1'), 10);
  const version = Number.isFinite(parsedVersion) && parsedVersion > 0 ? parsedVersion : 1;
  const hash = typeof obj.hash === 'string' ? obj.hash.trim().toLowerCase() : '';
  const size = Number.isFinite(Number(obj.size)) && Number(obj.size) >= 0 ? Number(obj.size) : 0;
  const mimeType = typeof obj.mimeType === 'string' && obj.mimeType.trim() ? obj.mimeType.trim() : '';
  const updatedAt =
    typeof obj.updatedAt === 'string' && obj.updatedAt.trim()
      ? obj.updatedAt.trim()
      : '';

  return {
    name,
    fileName,
    path: normalizedPath,
    version,
    hash,
    size,
    mimeType,
    updatedAt,
  };
}

function parseManifestPayload(payload: unknown): RemoteImagesManifest | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  if (!Array.isArray(obj.images)) return null;

  const seenPaths = new Set<string>();
  const images: RemoteImageEntry[] = [];
  for (const item of obj.images) {
    const normalized = normalizeManifestEntry(item);
    if (normalized && !seenPaths.has(normalized.path)) {
      seenPaths.add(normalized.path);
      images.push(normalized);
    }
  }

  return {
    schemaVersion: Number(obj.schemaVersion) || 1,
    directory: typeof obj.directory === 'string' ? obj.directory : 'public/remote-images',
    generatedAt: typeof obj.generatedAt === 'string' ? obj.generatedAt : '',
    images,
  };
}

function isCachedRecordUnchanged(
  cached: CachedRemoteImageRecord | undefined,
  remote: RemoteImageEntry
): boolean {
  if (!cached || !(cached.blob instanceof Blob) || cached.blob.size <= 0) {
    return false;
  }
  if (cached.version !== remote.version) {
    return false;
  }
  if (remote.hash) {
    return cached.hash === remote.hash;
  }
  if (remote.updatedAt) {
    return cached.updatedAt === remote.updatedAt;
  }
  return true;
}

// --- IndexedDB Storage Layer (Offline-Ready Device Cache) ---

function openImageCacheDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: 'path' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getAllCachedRemoteImages(): Promise<CachedRemoteImageRecord[]> {
  const db = await openImageCacheDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? (req.result as CachedRemoteImageRecord[]) : [];
        resolve(rows.filter((r) => r && typeof r.path === 'string' && r.blob instanceof Blob));
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    } finally {
      db.close();
    }
  });
}

async function putCachedRemoteImage(record: CachedRemoteImageRecord): Promise<void> {
  const db = await openImageCacheDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      tx.objectStore(STORE_IMAGES).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    } finally {
      db.close();
    }
  });
}

async function deleteCachedRemoteImage(imagePath: string): Promise<void> {
  const db = await openImageCacheDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      tx.objectStore(STORE_IMAGES).delete(imagePath);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    } finally {
      db.close();
    }
  });
}

export async function getCachedRemoteMeta<T>(key: string): Promise<T | null> {
  const db = await openImageCacheDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readonly');
      const req = tx.objectStore(STORE_META).get(key);
      req.onsuccess = () => {
        const row = req.result as { key: string; value: T } | undefined;
        resolve(row ? row.value : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    } finally {
      db.close();
    }
  });
}

async function putCachedRemoteMeta(key: string, value: unknown): Promise<void> {
  const db = await openImageCacheDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readwrite');
      tx.objectStore(STORE_META).put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    } finally {
      db.close();
    }
  });
}

// --- Network Fetch Helpers ---

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function downloadOriginalImageBlob(
  repo: string,
  branch: string,
  entry: RemoteImageEntry
): Promise<Blob | null> {
  const versionToken = entry.hash || `${entry.version}-${entry.updatedAt || '1'}`;
  const rawUrl = buildGitHubRawUrl(repo, branch, entry.path, versionToken);
  if (!rawUrl) return null;

  try {
    const response = await fetchWithTimeout(rawUrl, IMAGE_DOWNLOAD_TIMEOUT_MS);
    if (!response.ok) return null;

    const contentLengthHeader = response.headers.get('Content-Length');
    if (contentLengthHeader) {
      const declaredSize = Number.parseInt(contentLengthHeader, 10);
      if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) {
        return null;
      }
    }

    const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
    // GitHub raw serves image/* or application/octet-stream / text/plain for SVG
    const isAcceptableType =
      contentType === '' ||
      contentType.startsWith('image/') ||
      contentType.startsWith('application/octet-stream') ||
      (entry.path.toLowerCase().endsWith('.svg') && contentType.includes('svg'));
    if (!isAcceptableType) {
      return null;
    }

    const blob = await response.blob();
    if (blob.size <= 0 || blob.size > MAX_IMAGE_BYTES) {
      return null;
    }

    // Preserve exact original uploaded image bytes without re-encoding
    if (entry.mimeType && (!blob.type || blob.type === 'application/octet-stream')) {
      return new Blob([blob], { type: entry.mimeType });
    }
    return blob;
  } catch {
    return null;
  }
}

/**
 * Fetches public/remote-images/manifest.json directly from GitHub Raw,
 * downloads ONLY newly uploaded or replaced images into IndexedDB,
 * skips unchanged images, and cleans up deleted entries without disturbing offline cache on failure.
 */
export async function syncRemoteImagesFromGitHub(): Promise<RemoteImageSyncResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      status: 'offline',
      total: 0,
      downloaded: 0,
      skipped: 0,
      removed: 0,
      syncedAt: null,
    };
  }

  const { repo, branch } = await resolveRemoteImagesConfig();
  if (!repo) {
    return {
      status: 'unconfigured',
      total: 0,
      downloaded: 0,
      skipped: 0,
      removed: 0,
      syncedAt: null,
    };
  }

  const manifestUrl = buildGitHubRawUrl(repo, branch, MANIFEST_REPO_PATH, String(Date.now()));
  if (!manifestUrl) {
    return {
      status: 'unconfigured',
      total: 0,
      downloaded: 0,
      skipped: 0,
      removed: 0,
      syncedAt: null,
    };
  }

  try {
    const response = await fetchWithTimeout(manifestUrl, MANIFEST_TIMEOUT_MS);
    if (response.status === 404) {
      return {
        status: 'not_found',
        total: 0,
        downloaded: 0,
        skipped: 0,
        removed: 0,
        syncedAt: null,
      };
    }
    if (!response.ok) {
      return {
        status: 'error',
        total: 0,
        downloaded: 0,
        skipped: 0,
        removed: 0,
        syncedAt: null,
      };
    }

    const payload = await response.json();
    const manifest = parseManifestPayload(payload);
    if (!manifest) {
      return {
        status: 'error',
        total: 0,
        downloaded: 0,
        skipped: 0,
        removed: 0,
        syncedAt: null,
      };
    }

    const existingRecords = await getAllCachedRemoteImages();
    const existingByPath = new Map<string, CachedRemoteImageRecord>();
    for (const record of existingRecords) {
      existingByPath.set(record.path, record);
    }

    const activePaths = new Set<string>();
    let downloaded = 0;
    let skipped = 0;

    for (const entry of manifest.images) {
      activePaths.add(entry.path);
      const cached = existingByPath.get(entry.path);

      if (isCachedRecordUnchanged(cached, entry)) {
        skipped += 1;
        continue;
      }

      const blob = await downloadOriginalImageBlob(repo, branch, entry);
      if (blob) {
        await putCachedRemoteImage({
          ...entry,
          size: blob.size || entry.size,
          mimeType: entry.mimeType || blob.type,
          blob,
          cachedAt: Date.now(),
        });
        downloaded += 1;
      }
    }

    let removed = 0;
    for (const existing of existingRecords) {
      if (!activePaths.has(existing.path)) {
        await deleteCachedRemoteImage(existing.path);
        removed += 1;
      }
    }

    const syncedAt = Date.now();
    await putCachedRemoteMeta('manifest', manifest);
    await putCachedRemoteMeta('lastSyncedAt', syncedAt);

    return {
      status: 'synced',
      total: manifest.images.length,
      downloaded,
      skipped,
      removed,
      syncedAt,
    };
  } catch {
    return {
      status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error',
      total: 0,
      downloaded: 0,
      skipped: 0,
      removed: 0,
      syncedAt: null,
    };
  }
}

export async function loadBundledLocalManifest(): Promise<RemoteImagesManifest | null> {
  try {
    const response = await fetch('/remote-images/manifest.json', { cache: 'no-cache' });
    if (!response.ok) return null;
    const payload = await response.json();
    return parseManifestPayload(payload);
  } catch {
    return null;
  }
}
