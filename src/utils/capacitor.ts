/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';

let fetchBridgeInstalled = false;
let nativeRuntimeInitialized = false;

/**
 * Returns true when running inside a native Capacitor container (Android/iOS).
 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Resolves the configured remote API base URL for native Android builds.
 * In web deployments, relative `/api/...` paths work directly against the same origin.
 * In Capacitor Android APKs, set `VITE_API_BASE_URL` (e.g. https://your-backend.run.app)
 * so API requests reach the live backend while automatically falling back to offline storage when disconnected.
 */
export function getApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  return configured.trim().replace(/\/+$/, '');
}

/**
 * Bridges relative `/api/...` fetch requests to `VITE_API_BASE_URL` when running
 * inside a native Capacitor Android WebView without altering any application logic.
 */
export function installNativeFetchBridge(): void {
  if (fetchBridgeInstalled || typeof window === 'undefined' || !isNativePlatform()) {
    return;
  }
  fetchBridgeInstalled = true;

  const baseUrl = getApiBaseUrl();
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        if (!baseUrl) {
          return Promise.reject(new Error('Offline native mode: no remote API base URL configured'));
        }
        return originalFetch(`${baseUrl}${input}`, init);
      }

      if (input instanceof URL && input.origin === window.location.origin && input.pathname.startsWith('/api/')) {
        if (!baseUrl) {
          return Promise.reject(new Error('Offline native mode: no remote API base URL configured'));
        }
        return originalFetch(`${baseUrl}${input.pathname}${input.search}`, init);
      }

      if (typeof Request !== 'undefined' && input instanceof Request) {
        const parsed = new URL(input.url);
        if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')) {
          if (!baseUrl) {
            return Promise.reject(new Error('Offline native mode: no remote API base URL configured'));
          }
          const redirected = new Request(`${baseUrl}${parsed.pathname}${parsed.search}`, input);
          return originalFetch(redirected, init);
        }
      }
    } catch {
      // Fall through to default fetch on URL parse errors
    }

    return originalFetch(input, init);
  };
}

/**
 * Initializes native Android UX integrations (StatusBar, SplashScreen, Back Button).
 * Safe no-op on standard web browsers.
 */
export function initCapacitorRuntime(): void {
  if (nativeRuntimeInitialized || typeof window === 'undefined') {
    return;
  }
  nativeRuntimeInitialized = true;

  installNativeFetchBridge();

  if (!isNativePlatform()) {
    return;
  }

  // Configure Android status bar (white icons on dark #1C2B2D header)
  // and navigation bar (dark icons on white bottom navigation bar)
  SystemBars.show().catch(() => {});
  SystemBars.setStyle({ bar: SystemBarType.StatusBar, style: SystemBarsStyle.Dark }).catch(() => {});
  SystemBars.setStyle({ bar: SystemBarType.NavigationBar, style: SystemBarsStyle.Light }).catch(() => {});

  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#1C2B2D' }).catch(() => {});
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

  // Ensure splash screen hides smoothly once the React root mounts
  window.setTimeout(() => {
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
  }, 400);

  // Handle Android hardware Back button gracefully
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    // If an overlay/modal close button is visible, let history/app handle or minimize safely
    if (canGoBack && window.history.length > 1) {
      window.history.back();
    } else {
      CapacitorApp.minimizeApp().catch(() => {
        CapacitorApp.exitApp().catch(() => {});
      });
    }
  }).catch(() => {});
}

/**
 * React hook tracking online/offline connectivity on both Android (Capacitor Network)
 * and standard web browsers.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let removeCapListener: (() => void) | undefined;

    if (isNativePlatform()) {
      Network.getStatus()
        .then((status) => setIsOnline(status.connected))
        .catch(() => {});

      Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
      })
        .then((handle) => {
          removeCapListener = () => {
            handle.remove().catch(() => {});
          };
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (removeCapListener) {
        removeCapListener();
      }
    };
  }, []);

  return isOnline;
}
