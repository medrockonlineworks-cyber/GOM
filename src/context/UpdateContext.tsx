/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import {
  AvailableUpdate,
  DEFAULT_FALLBACK_VERSION,
  DownloadProgressEvent,
  UPDATE_CHECK_INTERVAL_MS,
  addDownloadProgressListener,
  cancelNativeUpdateDownload,
  checkForAppUpdate,
  clearUpdateSnooze,
  getInstalledAppInfo,
  isAndroidNativeApp,
  isUpdateCheckStale,
  openNativeInstallSettings,
  resumePendingNativeInstall,
  sanitizeUserFacingUpdateError,
  snoozeUpdatePrompt,
  startNativeUpdateDownload,
} from '../utils/appUpdater';
import { UpdateModal, UpdateModalPhase } from '../components/UpdateModal';

export interface ManualCheckFeedback {
  tone: 'neutral' | 'success' | 'error';
  message: string;
}

interface UpdateContextValue {
  currentVersion: string;
  isChecking: boolean;
  manualFeedback: ManualCheckFeedback | null;
  checkManually: () => Promise<void>;
  clearManualFeedback: () => void;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentVersion, setCurrentVersion] = useState<string>(DEFAULT_FALLBACK_VERSION);
  const [isChecking, setIsChecking] = useState(false);
  const [manualFeedback, setManualFeedback] = useState<ManualCheckFeedback | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AvailableUpdate | null>(null);
  const [phase, setPhase] = useState<UpdateModalPhase>('prompt');
  const [progress, setProgress] = useState<DownloadProgressEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phaseRef = useRef<UpdateModalPhase>(phase);
  phaseRef.current = phase;

  const isCheckingRef = useRef(false);
  const progressListenerRef = useRef<PluginListenerHandle | null>(null);

  const runCheck = useCallback(async (manual: boolean) => {
    if (isCheckingRef.current) return;
    if (phaseRef.current === 'downloading') return;

    isCheckingRef.current = true;
    setIsChecking(true);
    if (manual) {
      setManualFeedback(null);
    }

    try {
      const result = await checkForAppUpdate({ manual });

      if (result.status === 'available') {
        setAvailableUpdate(result.update);
        setPhase('prompt');
        setProgress(null);
        setErrorMessage(null);
        setIsModalOpen(true);
        if (manual) {
          clearUpdateSnooze();
          setManualFeedback(null);
        }
        return;
      }

      if (manual) {
        if (result.status === 'up_to_date') {
          setManualFeedback({ tone: 'success', message: result.message });
        } else if (result.status === 'no_update') {
          setManualFeedback({ tone: 'neutral', message: result.message });
        } else if (result.status !== 'snoozed') {
          setManualFeedback({ tone: 'error', message: result.message });
        }
      }
    } catch (err) {
      if (manual) {
        setManualFeedback({
          tone: 'error',
          message: sanitizeUserFacingUpdateError(err),
        });
      }
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, []);

  const checkManually = useCallback(async () => {
    await runCheck(true);
  }, [runCheck]);

  const clearManualFeedback = useCallback(() => {
    setManualFeedback(null);
  }, []);

  const detachProgressListener = useCallback(async () => {
    if (progressListenerRef.current) {
      try {
        await progressListenerRef.current.remove();
      } catch {
        // Ignore cleanup errors
      }
      progressListenerRef.current = null;
    }
  }, []);

  const handleUpdateNow = useCallback(async () => {
    if (!availableUpdate) return;
    if (!isAndroidNativeApp()) {
      setPhase('error');
      setErrorMessage('In-app installation is available on the Android app.');
      return;
    }

    setErrorMessage(null);
    setProgress({ bytesDownloaded: 0, totalBytes: availableUpdate.sizeBytes, percent: 0 });
    setPhase('downloading');

    await detachProgressListener();
    progressListenerRef.current = await addDownloadProgressListener((evt) => {
      setProgress(evt);
    });

    try {
      const status = await startNativeUpdateDownload(availableUpdate);
      if (status === 'cancelled') {
        setPhase('prompt');
        setProgress(null);
      } else if (status === 'permission_required') {
        setPhase('permission_required');
      } else if (status === 'installing') {
        setPhase('installing');
      }
    } catch (err) {
      setPhase('error');
      setErrorMessage(sanitizeUserFacingUpdateError(err));
    } finally {
      await detachProgressListener();
    }
  }, [availableUpdate, detachProgressListener]);

  const handleLater = useCallback(() => {
    if (availableUpdate && (phase === 'prompt' || phase === 'permission_required' || phase === 'error')) {
      snoozeUpdatePrompt(availableUpdate.newVersion);
    }
    setIsModalOpen(false);
    setErrorMessage(null);
  }, [availableUpdate, phase]);

  const handleCancelDownload = useCallback(async () => {
    try {
      await cancelNativeUpdateDownload();
    } catch {
      // Ignore cancel errors
    } finally {
      await detachProgressListener();
      setPhase('prompt');
      setProgress(null);
    }
  }, [detachProgressListener]);

  const handleOpenInstallSettings = useCallback(async () => {
    try {
      await openNativeInstallSettings();
    } catch (err) {
      setPhase('error');
      setErrorMessage(sanitizeUserFacingUpdateError(err));
    }
  }, []);

  // Load installed app version & schedule automatic startup + 6-hour periodic checks
  useEffect(() => {
    let active = true;
    getInstalledAppInfo().then((info) => {
      if (active) {
        setCurrentVersion(info.versionName);
      }
    });

    if (!isAndroidNativeApp()) {
      return () => {
        active = false;
      };
    }

    const startupTimer = window.setTimeout(() => {
      if (active) {
        void runCheck(false);
      }
    }, 3500);

    const periodicTimer = window.setInterval(() => {
      if (active) {
        void runCheck(false);
      }
    }, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      active = false;
      window.clearTimeout(startupTimer);
      window.clearInterval(periodicTimer);
      void detachProgressListener();
    };
  }, [runCheck, detachProgressListener]);

  // Foreground resume: auto-resume pending install after Unknown Sources permission, or re-check if stale
  useEffect(() => {
    const handleForegroundResume = async () => {
      if (phaseRef.current === 'permission_required') {
        try {
          const status = await resumePendingNativeInstall();
          if (status === 'installing') {
            setPhase('installing');
          } else if (status === 'none') {
            setPhase('prompt');
          }
        } catch (err) {
          setPhase('error');
          setErrorMessage(sanitizeUserFacingUpdateError(err));
        }
        return;
      }

      if (isAndroidNativeApp() && isUpdateCheckStale()) {
        void runCheck(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void handleForegroundResume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    let appStateHandle: PluginListenerHandle | null = null;
    if (isAndroidNativeApp()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          void handleForegroundResume();
        }
      })
        .then((handle) => {
          appStateHandle = handle;
        })
        .catch(() => {
          // Ignore listener registration errors
        });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (appStateHandle) {
        void appStateHandle.remove();
      }
    };
  }, [runCheck]);

  return (
    <UpdateContext.Provider
      value={{
        currentVersion,
        isChecking,
        manualFeedback,
        checkManually,
        clearManualFeedback,
      }}
    >
      {children}
      <UpdateModal
        isOpen={isModalOpen}
        update={availableUpdate}
        phase={phase}
        progress={progress}
        errorMessage={errorMessage}
        onUpdateNow={() => void handleUpdateNow()}
        onLater={handleLater}
        onCancelDownload={() => void handleCancelDownload()}
        onOpenInstallSettings={() => void handleOpenInstallSettings()}
      />
    </UpdateContext.Provider>
  );
};

export function useAppUpdater(): UpdateContextValue {
  const ctx = useContext(UpdateContext);
  if (!ctx) {
    throw new Error('useAppUpdater must be used inside UpdateProvider');
  }
  return ctx;
}
