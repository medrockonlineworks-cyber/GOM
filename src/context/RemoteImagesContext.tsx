/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  CachedRemoteImageRecord,
  REMOTE_IMAGES_REFRESH_INTERVAL_MS,
  REMOTE_IMAGES_RESUME_STALE_MS,
  RemoteImageEntry,
  RemoteImagesManifest,
  getAllCachedRemoteImages,
  getBundledFallbackUrl,
  getCachedRemoteMeta,
  loadBundledLocalManifest,
  syncRemoteImagesFromGitHub,
} from '../utils/remoteImages';

export interface ResolvedRemoteImage extends RemoteImageEntry {
  url: string;
  source: 'cache' | 'bundled';
}

interface RemoteImagesContextValue {
  images: ResolvedRemoteImage[];
  isSyncing: boolean;
  lastSyncedAt: number | null;
  getImageUrl: (nameOrPath: string, fallbackUrl?: string) => string;
  getImageEntry: (nameOrPath: string) => ResolvedRemoteImage | undefined;
  refreshRemoteImages: () => Promise<void>;
}

const RemoteImagesContext = createContext<RemoteImagesContextValue | null>(null);

function lookupImage(
  list: ResolvedRemoteImage[],
  nameOrPath: string
): ResolvedRemoteImage | undefined {
  const key = nameOrPath.trim();
  if (!key) return undefined;
  const normalized = key.replace(/^\/+/, '');
  const lower = normalized.toLowerCase();

  const matches = list.filter(
    (img) =>
      img.name.toLowerCase() === lower ||
      img.fileName.toLowerCase() === lower ||
      img.path.toLowerCase() === lower ||
      `remote-images/${img.fileName}`.toLowerCase() === lower
  );

  if (matches.length <= 1) return matches[0];

  return [...matches].sort((a, b) => {
    if (a.source !== b.source) return a.source === 'cache' ? -1 : 1;
    const timeA = Date.parse(a.updatedAt || '') || 0;
    const timeB = Date.parse(b.updatedAt || '') || 0;
    if (timeA !== timeB) return timeB - timeA;
    return (b.version || 0) - (a.version || 0);
  })[0];
}

export const RemoteImagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<ResolvedRemoteImage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const isSyncingRef = useRef(false);
  const lastSyncedAtRef = useRef<number | null>(null);
  const objectUrlsRef = useRef<Map<string, { url: string; signature: string }>>(new Map());

  const rebuildResolvedImages = useCallback(
    async (bundledFallbackManifest?: RemoteImagesManifest | null) => {
      const [cachedRecords, cachedManifest, storedSyncTime] = await Promise.all([
        getAllCachedRemoteImages(),
        getCachedRemoteMeta<RemoteImagesManifest>('manifest'),
        getCachedRemoteMeta<number>('lastSyncedAt'),
      ]);

      if (typeof storedSyncTime === 'number' && Number.isFinite(storedSyncTime)) {
        lastSyncedAtRef.current = storedSyncTime;
        setLastSyncedAt(storedSyncTime);
      }

      const nextUrlMap = new Map<string, { url: string; signature: string }>();
      const prevUrlMap = objectUrlsRef.current;
      const resolvedByPath = new Map<string, ResolvedRemoteImage>();

      // 1. Prefer locally cached GitHub Blobs (instant offline & live-updated assets)
      for (const record of cachedRecords) {
        const signature = `${record.version}:${record.hash}:${record.updatedAt}:${record.cachedAt}`;
        const existing = prevUrlMap.get(record.path);
        let objectUrl: string;

        if (existing && existing.signature === signature) {
          objectUrl = existing.url;
        } else {
          objectUrl = URL.createObjectURL(record.blob);
        }

        nextUrlMap.set(record.path, { url: objectUrl, signature });
        resolvedByPath.set(record.path, {
          name: record.name,
          fileName: record.fileName,
          path: record.path,
          version: record.version,
          hash: record.hash,
          size: record.size,
          mimeType: record.mimeType,
          updatedAt: record.updatedAt,
          url: objectUrl,
          source: 'cache',
        });
      }

      // Revoke stale object URLs that were replaced or removed to avoid memory leaks
      for (const [pathKey, prevEntry] of prevUrlMap.entries()) {
        const current = nextUrlMap.get(pathKey);
        if (!current || current.url !== prevEntry.url) {
          URL.revokeObjectURL(prevEntry.url);
        }
      }
      objectUrlsRef.current = nextUrlMap;

      // 2. Include any bundled local manifest entries not yet cached from GitHub (first-run offline support)
      const fallbackManifest = bundledFallbackManifest ?? cachedManifest;
      if (fallbackManifest?.images) {
        for (const entry of fallbackManifest.images) {
          if (!resolvedByPath.has(entry.path)) {
            const bundledUrl = getBundledFallbackUrl(entry.fileName || entry.path);
            if (bundledUrl) {
              resolvedByPath.set(entry.path, {
                ...entry,
                url: bundledUrl,
                source: 'bundled',
              });
            }
          }
        }
      }

      setImages(Array.from(resolvedByPath.values()));
    },
    []
  );

  const refreshRemoteImages = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const result = await syncRemoteImagesFromGitHub();
      if (result.status === 'synced') {
        if (result.syncedAt) {
          lastSyncedAtRef.current = result.syncedAt;
          setLastSyncedAt(result.syncedAt);
        }
        if (result.downloaded > 0 || result.removed > 0) {
          await rebuildResolvedImages();
        }
      }
    } catch {
      // Preserve existing cached images safely on any unexpected error
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [rebuildResolvedImages]);

  // Initial offline cache hydrate + automatic startup & periodic refresh
  useEffect(() => {
    let active = true;

    (async () => {
      const localManifest = await loadBundledLocalManifest();
      if (active) {
        await rebuildResolvedImages(localManifest);
      }
    })();

    const startupTimer = window.setTimeout(() => {
      if (active) {
        void refreshRemoteImages();
      }
    }, 2000);

    const periodicTimer = window.setInterval(() => {
      if (active) {
        void refreshRemoteImages();
      }
    }, REMOTE_IMAGES_REFRESH_INTERVAL_MS);

    const handleOnline = () => {
      if (active) {
        void refreshRemoteImages();
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      active = false;
      window.clearTimeout(startupTimer);
      window.clearInterval(periodicTimer);
      window.removeEventListener('online', handleOnline);
    };
  }, [rebuildResolvedImages, refreshRemoteImages]);

  // Revoke all managed Blob object URLs on unmount
  useEffect(() => {
    return () => {
      for (const entry of objectUrlsRef.current.values()) {
        URL.revokeObjectURL(entry.url);
      }
      objectUrlsRef.current.clear();
    };
  }, []);

  // Auto-refresh when app returns to foreground if stale
  useEffect(() => {
    const checkOnResume = () => {
      const last = lastSyncedAtRef.current;
      if (!last || Date.now() - last >= REMOTE_IMAGES_RESUME_STALE_MS) {
        void refreshRemoteImages();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkOnResume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let appStateHandle: PluginListenerHandle | null = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkOnResume();
        }
      })
        .then((handle) => {
          appStateHandle = handle;
        })
        .catch(() => {
          // Ignore listener registration failure
        });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (appStateHandle) {
        void appStateHandle.remove();
      }
    };
  }, [refreshRemoteImages]);

  const getImageEntry = useCallback(
    (nameOrPath: string): ResolvedRemoteImage | undefined => lookupImage(images, nameOrPath),
    [images]
  );

  const getImageUrl = useCallback(
    (nameOrPath: string, fallbackUrl = ''): string => {
      const match = lookupImage(images, nameOrPath);
      if (match?.url) return match.url;
      if (fallbackUrl) return fallbackUrl;
      return getBundledFallbackUrl(nameOrPath);
    },
    [images]
  );

  return (
    <RemoteImagesContext.Provider
      value={{
        images,
        isSyncing,
        lastSyncedAt,
        getImageUrl,
        getImageEntry,
        refreshRemoteImages,
      }}
    >
      {children}
    </RemoteImagesContext.Provider>
  );
};

export function useRemoteImages(): RemoteImagesContextValue {
  const ctx = useContext(RemoteImagesContext);
  if (!ctx) {
    throw new Error('useRemoteImages must be used inside RemoteImagesProvider');
  }
  return ctx;
}

export function useRemoteImage(nameOrPath: string, fallbackUrl = ''): {
  src: string;
  entry: ResolvedRemoteImage | undefined;
  isSyncing: boolean;
} {
  const { getImageUrl, getImageEntry, isSyncing } = useRemoteImages();
  return {
    src: getImageUrl(nameOrPath, fallbackUrl),
    entry: getImageEntry(nameOrPath),
    isSyncing,
  };
}
