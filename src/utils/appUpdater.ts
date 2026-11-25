/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';

export interface AppAssetConfig {
  appName: string;
  assetName: string;
}

/**
 * Maps each Android applicationId (package name) to its display name and release APK asset filename.
 * Add additional product flavors here if multiple APKs are published in the same release.
 */
export const APP_ASSET_MAP: Record<string, AppAssetConfig> = {
  'com.gom.globalonlinemarket': {
    appName: 'GOM',
    assetName: 'GOM.apk',
  },
};

export const DEFAULT_APP_PACKAGE = 'com.gom.globalonlinemarket';
export const DEFAULT_APP_NAME = 'GOM';
export const DEFAULT_FALLBACK_VERSION = '1.0.0';
export const DEFAULT_UPDATE_NOTES = [
  'Performance and stability improvements',
  'Security enhancements and bug fixes',
];

export const NO_PUBLISHED_UPDATE_MESSAGE = 'No published update now';
export const UP_TO_DATE_MESSAGE = 'You already have the latest version';

export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const UPDATE_SNOOZE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const DEFAULT_BACKOFF_MS = 15 * 60 * 1000; // 15 minutes
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000; // 6 hours
const REQUEST_TIMEOUT_MS = 12_000;

const STORAGE_KEYS = {
  etag: 'gom_update_etag',
  cachedRelease: 'gom_update_cached_release',
  lastCheckedAt: 'gom_update_last_checked_at',
  backoffUntil: 'gom_update_backoff_until',
  snoozedUntil: 'gom_update_snoozed_until',
  snoozedVersion: 'gom_update_snoozed_version',
} as const;

const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA256_HEX_PATTERN = /^[a-fA-F0-9]{64}$/;
const ALLOWED_DOWNLOAD_HOSTS = new Set([
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com',
  'codeload.github.com',
]);

export interface InstalledAppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  updateRepo: string;
  isNativeAndroid: boolean;
}

export interface DownloadProgressEvent {
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
}

interface AppUpdaterNativePlugin {
  getAppInfo(): Promise<{
    packageName: string;
    appName: string;
    versionName: string;
    versionCode: number;
    updateRepo: string;
  }>;
  canRequestPackageInstalls(): Promise<{ granted: boolean }>;
  openUnknownSourcesSettings(): Promise<{ opened: boolean }>;
  downloadAndInstall(options: {
    url: string;
    fileName: string;
    expectedSha256: string;
    expectedVersionCode: number;
  }): Promise<{ status: 'installing' | 'permission_required' | 'cancelled' }>;
  installPendingUpdate(): Promise<{
    status: 'installing' | 'permission_required' | 'none';
  }>;
  cancelDownload(): Promise<{ cancelled: boolean }>;
  addListener(
    eventName: 'updateDownloadProgress',
    listenerFunc: (event: DownloadProgressEvent) => void
  ): Promise<PluginListenerHandle>;
}

const AppUpdaterNative = registerPlugin<AppUpdaterNativePlugin>('AppUpdater');

export interface AvailableUpdate {
  appName: string;
  packageName: string;
  currentVersion: string;
  newVersion: string;
  newVersionCode: number;
  notes: string[];
  downloadUrl: string;
  assetFileName: string;
  expectedSha256: string;
  sizeBytes: number;
}

export type UpdateCheckResult =
  | { status: 'available'; update: AvailableUpdate }
  | { status: 'snoozed'; update: AvailableUpdate }
  | { status: 'up_to_date'; message: string; currentVersion: string }
  | { status: 'no_update'; message: string }
  | { status: 'offline'; message: string }
  | { status: 'rate_limited'; message: string }
  | { status: 'error'; message: string };

interface ReleaseAssetPayload {
  name?: string;
  browser_download_url?: string;
  size?: number;
  digest?: string | null;
}

interface ReleaseApiPayload {
  tag_name?: string;
  name?: string;
  body?: string | null;
  draft?: boolean;
  prerelease?: boolean;
  assets?: ReleaseAssetPayload[];
}

interface EmbeddedUpdateMetadata {
  versionName?: string;
  versionCode?: number | string;
  assets?: Record<
    string,
    {
      packageName?: string;
      sha256?: string;
      versionCode?: number | string;
      versionName?: string;
      size?: number;
    }
  >;
  packages?: Record<
    string,
    {
      assetName?: string;
      sha256?: string;
      versionCode?: number | string;
      versionName?: string;
    }
  >;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

export function isAndroidNativeApp(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function normalizeVersionLabel(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_FALLBACK_VERSION;
  const cleaned = raw.trim().replace(/^v/i, '');
  const semverMatch = cleaned.match(/^(\d+(?:\.\d+){1,3})/);
  return semverMatch ? semverMatch[1] : cleaned || DEFAULT_FALLBACK_VERSION;
}

export function compareSemver(a: string, b: string): number {
  const partsA = normalizeVersionLabel(a)
    .split('.')
    .map((p) => Number.parseInt(p, 10) || 0);
  const partsB = normalizeVersionLabel(b)
    .split('.')
    .map((p) => Number.parseInt(p, 10) || 0);
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i += 1) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

function resolveConfiguredRepo(nativeRepo: string): string {
  const candidates = [nativeRepo, import.meta.env.VITE_GITHUB_REPO ?? ''];
  for (const candidate of candidates) {
    const trimmed = String(candidate || '').trim().replace(/^\/+|\/+$/g, '');
    if (REPO_PATTERN.test(trimmed)) {
      return trimmed;
    }
  }
  return '';
}

function parseEmbeddedMetadata(body: string | null | undefined): EmbeddedUpdateMetadata | null {
  if (!body) return null;
  const match = body.match(/<!--\s*UPDATE_METADATA\s+([\s\S]*?)\s*-->/);
  if (!match || !match[1]) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return parsed && typeof parsed === 'object' ? (parsed as EmbeddedUpdateMetadata) : null;
  } catch {
    return null;
  }
}

function extractSha256(
  asset: ReleaseAssetPayload,
  metadata: EmbeddedUpdateMetadata | null,
  assetName: string,
  packageName: string
): string | null {
  // 1. Prefer GitHub's native immutable asset digest field ("sha256:<64-hex>")
  if (typeof asset.digest === 'string') {
    const digestMatch = asset.digest.trim().match(/^sha256:([a-fA-F0-9]{64})$/i);
    if (digestMatch) {
      return digestMatch[1].toLowerCase();
    }
  }

  // 2. Fallback to embedded UPDATE_METADATA block in release body
  const fromAssetMeta = metadata?.assets?.[assetName]?.sha256?.trim();
  if (fromAssetMeta && SHA256_HEX_PATTERN.test(fromAssetMeta)) {
    return fromAssetMeta.toLowerCase();
  }

  const fromPackageMeta = metadata?.packages?.[packageName]?.sha256?.trim();
  if (fromPackageMeta && SHA256_HEX_PATTERN.test(fromPackageMeta)) {
    return fromPackageMeta.toLowerCase();
  }

  return null;
}

function isAllowedDownloadUrl(rawUrl: string | undefined): rawUrl is string {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_DOWNLOAD_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function sanitizeReleaseNotes(body: string | null | undefined, repoSlug: string): string[] {
  if (!body || !body.trim()) {
    return [...DEFAULT_UPDATE_NOTES];
  }

  const [repoOwner = '', repoName = ''] = repoSlug.toLowerCase().split('/');
  const withoutComments = body.replace(/<!--[\s\S]*?-->/g, '');

  const forbiddenTerms = [
    'github',
    'update_metadata',
    'sha256',
    'sha-256',
    'checksum',
    'digest',
    '.apk',
    'versioncode',
    'version_code',
    'build number',
    'build #',
    'workflow',
    'merge pull request',
    'merge branch',
    'full changelog',
    'compare/',
    'http://',
    'https://',
  ];

  if (repoSlug) forbiddenTerms.push(repoSlug.toLowerCase());
  if (repoOwner.length >= 3) forbiddenTerms.push(repoOwner);
  if (repoName.length >= 3) forbiddenTerms.push(repoName);

  const rawLines = withoutComments.split(/\r?\n/);
  const cleanedLines: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    // Skip raw Markdown headers, horizontal rules, code fences, blockquotes, and HTML tags
    if (/^(#{1,6}\s|---|===|\*\*\*|```|>|<)/.test(trimmed)) continue;

    // Remove list bullet prefixes & basic markdown formatting
    const stripped = trimmed
      .replace(/^[-*•+]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (stripped.length < 4 || stripped.length > 140) continue;

    const lower = stripped.toLowerCase();
    // Skip generic section labels or accidental placeholder values
    if (
      lower === "what's new" ||
      lower === 'whats new' ||
      lower === 'release notes' ||
      lower === 'changes' ||
      lower === 'true' ||
      lower === 'false' ||
      lower === 'null' ||
      lower === 'undefined' ||
      lower === 'none' ||
      lower === 'n/a'
    ) {
      continue;
    }

    // Skip lines containing git commit prefixes, commit SHAs, or technical jargon
    if (/^(feat|fix|chore|ci|docs|refactor|style|test|perf|build)(\([^)]+\))?:\s*/i.test(stripped)) {
      continue;
    }
    if (/\b[0-9a-f]{7,64}\b/i.test(stripped)) {
      continue;
    }
    if (forbiddenTerms.some((term) => term && lower.includes(term))) {
      continue;
    }

    if (!seen.has(lower)) {
      seen.add(lower);
      cleanedLines.push(stripped);
    }

    if (cleanedLines.length >= 5) break;
  }

  return cleanedLines.length > 0 ? cleanedLines : [...DEFAULT_UPDATE_NOTES];
}

export async function getInstalledAppInfo(): Promise<InstalledAppInfo> {
  const nativeAndroid = isAndroidNativeApp();
  if (nativeAndroid) {
    try {
      const info = await AppUpdaterNative.getAppInfo();
      const mapped = APP_ASSET_MAP[info.packageName];
      return {
        packageName: info.packageName || DEFAULT_APP_PACKAGE,
        appName: mapped?.appName || info.appName || DEFAULT_APP_NAME,
        versionName: normalizeVersionLabel(info.versionName),
        versionCode: Number(info.versionCode) || 1,
        updateRepo: info.updateRepo || '',
        isNativeAndroid: true,
      };
    } catch {
      // Fall through to safe defaults
    }
  }

  return {
    packageName: DEFAULT_APP_PACKAGE,
    appName: DEFAULT_APP_NAME,
    versionName: DEFAULT_FALLBACK_VERSION,
    versionCode: 1,
    updateRepo: '',
    isNativeAndroid: false,
  };
}

export function isUpdateCheckStale(): boolean {
  const raw = readStorage(STORAGE_KEYS.lastCheckedAt);
  if (!raw) return true;
  const lastChecked = Number.parseInt(raw, 10);
  if (!Number.isFinite(lastChecked)) return true;
  return Date.now() - lastChecked >= UPDATE_CHECK_INTERVAL_MS;
}

export function snoozeUpdatePrompt(versionName: string): void {
  const until = Date.now() + UPDATE_SNOOZE_DURATION_MS;
  writeStorage(STORAGE_KEYS.snoozedUntil, String(until));
  writeStorage(STORAGE_KEYS.snoozedVersion, normalizeVersionLabel(versionName));
}

export function clearUpdateSnooze(): void {
  removeStorage(STORAGE_KEYS.snoozedUntil);
  removeStorage(STORAGE_KEYS.snoozedVersion);
}

function isVersionSnoozed(versionName: string): boolean {
  const untilRaw = readStorage(STORAGE_KEYS.snoozedUntil);
  const snoozedVersion = readStorage(STORAGE_KEYS.snoozedVersion);
  if (!untilRaw || !snoozedVersion) return false;
  const until = Number.parseInt(untilRaw, 10);
  if (!Number.isFinite(until) || Date.now() >= until) return false;
  return normalizeVersionLabel(snoozedVersion) === normalizeVersionLabel(versionName);
}

function computeBackoffMs(response: Response): number {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(Math.max(seconds * 1000, DEFAULT_BACKOFF_MS), MAX_BACKOFF_MS);
    }
  }
  const resetHeader = response.headers.get('X-RateLimit-Reset');
  if (resetHeader) {
    const resetEpochSec = Number.parseInt(resetHeader, 10);
    if (Number.isFinite(resetEpochSec)) {
      const waitMs = resetEpochSec * 1000 - Date.now();
      if (waitMs > 0) {
        return Math.min(Math.max(waitMs, DEFAULT_BACKOFF_MS), MAX_BACKOFF_MS);
      }
    }
  }
  return DEFAULT_BACKOFF_MS;
}

function evaluateReleasePayload(
  release: ReleaseApiPayload,
  appInfo: InstalledAppInfo,
  repoSlug: string,
  manual: boolean
): UpdateCheckResult {
  if (release.draft || release.prerelease) {
    return { status: 'no_update', message: NO_PUBLISHED_UPDATE_MESSAGE };
  }

  const assetConfig = APP_ASSET_MAP[appInfo.packageName] ?? APP_ASSET_MAP[DEFAULT_APP_PACKAGE];
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const matchingAsset = assets.find((item) => item.name === assetConfig.assetName);

  if (!matchingAsset || !isAllowedDownloadUrl(matchingAsset.browser_download_url)) {
    return { status: 'no_update', message: NO_PUBLISHED_UPDATE_MESSAGE };
  }

  const metadata = parseEmbeddedMetadata(release.body);
  const expectedSha256 = extractSha256(matchingAsset, metadata, assetConfig.assetName, appInfo.packageName);
  if (!expectedSha256) {
    return { status: 'no_update', message: NO_PUBLISHED_UPDATE_MESSAGE };
  }

  const rawVersionCode =
    metadata?.assets?.[assetConfig.assetName]?.versionCode ??
    metadata?.packages?.[appInfo.packageName]?.versionCode ??
    metadata?.versionCode;
  const remoteVersionCode = Number.parseInt(String(rawVersionCode ?? '0'), 10) || 0;

  const remoteVersionName = normalizeVersionLabel(
    metadata?.assets?.[assetConfig.assetName]?.versionName ||
      metadata?.packages?.[appInfo.packageName]?.versionName ||
      metadata?.versionName ||
      release.tag_name ||
      release.name
  );

  let isNewer = false;
  if (remoteVersionCode > 0 && appInfo.versionCode > 0) {
    if (remoteVersionCode > appInfo.versionCode) {
      isNewer = true;
    } else if (remoteVersionCode === appInfo.versionCode) {
      isNewer = compareSemver(remoteVersionName, appInfo.versionName) > 0;
    }
  } else {
    isNewer = compareSemver(remoteVersionName, appInfo.versionName) > 0;
  }

  if (!isNewer) {
    return {
      status: 'up_to_date',
      message: UP_TO_DATE_MESSAGE,
      currentVersion: appInfo.versionName,
    };
  }

  const update: AvailableUpdate = {
    appName: assetConfig.appName || appInfo.appName,
    packageName: appInfo.packageName,
    currentVersion: appInfo.versionName,
    newVersion: remoteVersionName,
    newVersionCode: remoteVersionCode,
    notes: sanitizeReleaseNotes(release.body, repoSlug),
    downloadUrl: matchingAsset.browser_download_url,
    assetFileName: assetConfig.assetName,
    expectedSha256,
    sizeBytes: Number(matchingAsset.size) || Number(metadata?.assets?.[assetConfig.assetName]?.size) || 0,
  };

  if (!manual && isVersionSnoozed(update.newVersion)) {
    return { status: 'snoozed', update };
  }

  return { status: 'available', update };
}

export async function checkForAppUpdate(options: { manual?: boolean } = {}): Promise<UpdateCheckResult> {
  const manual = Boolean(options.manual);

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      status: 'offline',
      message: 'No internet connection. Please connect and try again.',
    };
  }

  const appInfo = await getInstalledAppInfo();
  const repoSlug = resolveConfiguredRepo(appInfo.updateRepo);

  if (!repoSlug) {
    return {
      status: 'no_update',
      message: NO_PUBLISHED_UPDATE_MESSAGE,
    };
  }

  const backoffRaw = readStorage(STORAGE_KEYS.backoffUntil);
  if (backoffRaw) {
    const backoffUntil = Number.parseInt(backoffRaw, 10);
    if (Number.isFinite(backoffUntil) && Date.now() < backoffUntil) {
      return {
        status: 'rate_limited',
        message: 'Update check is temporarily busy. Please try again shortly.',
      };
    }
    removeStorage(STORAGE_KEYS.backoffUntil);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    const cachedEtag = readStorage(STORAGE_KEYS.etag);
    const cachedReleaseRaw = readStorage(STORAGE_KEYS.cachedRelease);
    if (cachedEtag && cachedReleaseRaw) {
      headers['If-None-Match'] = cachedEtag;
    }

    const response = await fetch(`https://api.github.com/repos/${repoSlug}/releases/latest`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    writeStorage(STORAGE_KEYS.lastCheckedAt, String(Date.now()));

    if (response.status === 304 && cachedReleaseRaw) {
      const cachedRelease = JSON.parse(cachedReleaseRaw) as ReleaseApiPayload;
      return evaluateReleasePayload(cachedRelease, appInfo, repoSlug, manual);
    }

    if (response.status === 404) {
      removeStorage(STORAGE_KEYS.etag);
      removeStorage(STORAGE_KEYS.cachedRelease);
      return {
        status: 'no_update',
        message: NO_PUBLISHED_UPDATE_MESSAGE,
      };
    }

    if (response.status === 403 || response.status === 429) {
      const backoffMs = computeBackoffMs(response);
      writeStorage(STORAGE_KEYS.backoffUntil, String(Date.now() + backoffMs));
      return {
        status: 'rate_limited',
        message: 'Update check is temporarily busy. Please try again shortly.',
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Unable to check for updates right now. Please try again later.',
      };
    }

    const release = (await response.json()) as ReleaseApiPayload;
    const etag = response.headers.get('ETag');
    if (etag) {
      writeStorage(STORAGE_KEYS.etag, etag);
      writeStorage(STORAGE_KEYS.cachedRelease, JSON.stringify(release));
    }

    return evaluateReleasePayload(release, appInfo, repoSlug, manual);
  } catch {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return {
        status: 'offline',
        message: 'No internet connection. Please connect and try again.',
      };
    }
    return {
      status: 'error',
      message: 'Unable to check for updates right now. Please try again later.',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function addDownloadProgressListener(
  callback: (event: DownloadProgressEvent) => void
): Promise<PluginListenerHandle | null> {
  if (!isAndroidNativeApp()) return null;
  return AppUpdaterNative.addListener('updateDownloadProgress', callback);
}

export async function startNativeUpdateDownload(
  update: AvailableUpdate
): Promise<'installing' | 'permission_required' | 'cancelled'> {
  if (!isAndroidNativeApp()) {
    throw new Error('In-app updates can only be installed on the Android app.');
  }
  const result = await AppUpdaterNative.downloadAndInstall({
    url: update.downloadUrl,
    fileName: update.assetFileName,
    expectedSha256: update.expectedSha256,
    expectedVersionCode: update.newVersionCode,
  });
  return result.status;
}

export async function resumePendingNativeInstall(): Promise<'installing' | 'permission_required' | 'none'> {
  if (!isAndroidNativeApp()) return 'none';
  const result = await AppUpdaterNative.installPendingUpdate();
  return result.status;
}

export async function cancelNativeUpdateDownload(): Promise<void> {
  if (!isAndroidNativeApp()) return;
  await AppUpdaterNative.cancelDownload();
}

export async function openNativeInstallSettings(): Promise<void> {
  if (!isAndroidNativeApp()) return;
  await AppUpdaterNative.openUnknownSourcesSettings();
}

export function sanitizeUserFacingUpdateError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const cleaned = raw.trim();
  if (!cleaned) {
    return 'Unable to complete the update right now. Please try again.';
  }
  const lower = cleaned.toLowerCase();
  if (
    lower.includes('github') ||
    lower.includes('.apk') ||
    lower.includes('sha-256') ||
    lower.includes('sha256') ||
    lower.includes('http://') ||
    lower.includes('https://') ||
    lower.includes('exception') ||
    lower.includes('capacitor')
  ) {
    return 'Unable to complete the update right now. Please try again.';
  }
  return cleaned;
}

export function formatMegabytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
