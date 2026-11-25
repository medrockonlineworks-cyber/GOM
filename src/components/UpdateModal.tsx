/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  ShieldCheck,
  Sparkles,
  Settings,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import { AvailableUpdate, DownloadProgressEvent, formatMegabytes } from '../utils/appUpdater';

export type UpdateModalPhase =
  | 'prompt'
  | 'downloading'
  | 'permission_required'
  | 'installing'
  | 'error';

interface UpdateModalProps {
  isOpen: boolean;
  update: AvailableUpdate | null;
  phase: UpdateModalPhase;
  progress: DownloadProgressEvent | null;
  errorMessage: string | null;
  onUpdateNow: () => void;
  onLater: () => void;
  onCancelDownload: () => void;
  onOpenInstallSettings: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  update,
  phase,
  progress,
  errorMessage,
  onUpdateNow,
  onLater,
  onCancelDownload,
  onOpenInstallSettings,
}) => {
  if (!update) return null;

  const percent = progress?.percent ?? 0;
  const downloadedBytes = progress?.bytesDownloaded ?? 0;
  const totalBytes = progress?.totalBytes && progress.totalBytes > 0
    ? progress.totalBytes
    : update.sizeBytes;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="update-modal-title"
          className="fixed inset-0 z-[1000] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center safe-modal-viewport"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-[360px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80"
          >
            {/* Branded Deep Forest Header */}
            <div className="bg-[#1C2B2D] px-6 pt-6 pb-5 text-white relative">
              {phase !== 'downloading' && (
                <button
                  type="button"
                  onClick={onLater}
                  aria-label="Close update dialog"
                  className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#CD7F32]/20 border border-[#CD7F32]/40 flex items-center justify-center shrink-0">
                  {phase === 'permission_required' ? (
                    <Settings size={20} className="text-[#E5A35D]" />
                  ) : phase === 'installing' ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <Sparkles size={20} className="text-[#E5A35D]" />
                  )}
                </div>
                <div className="min-w-0 pr-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E5A35D]">
                    {update.appName} Update
                  </p>
                  <h2 id="update-modal-title" className="text-base font-extrabold text-white tracking-tight mt-0.5">
                    {phase === 'downloading'
                      ? 'Downloading Update'
                      : phase === 'permission_required'
                        ? 'Permission Needed'
                        : phase === 'installing'
                          ? 'Ready to Install'
                          : 'New Version Available'}
                  </h2>
                </div>
              </div>

              {/* Clean Version Transition (No build codes) */}
              <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold tabular-nums">
                <span className="text-white/75">v{update.currentVersion}</span>
                <ArrowRight size={13} className="text-[#E5A35D]" />
                <span className="text-white">v{update.newVersion}</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* What's New */}
              {(phase === 'prompt' || phase === 'error') && (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    What&apos;s New
                  </p>
                  <ul className="space-y-2">
                    {update.notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CD7F32] mt-1.5 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <ShieldCheck size={14} className="text-[#1C2B2D] shrink-0" />
                    <span>Installs smoothly in place. Your account and saved data stay intact.</span>
                  </div>
                </div>
              )}

              {/* Live Download Progress */}
              {phase === 'downloading' && (
                <div className="space-y-3 py-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 tabular-nums">
                    <span className="text-slate-500 font-semibold">
                      {totalBytes > 0
                        ? `${formatMegabytes(downloadedBytes)} / ${formatMegabytes(totalBytes)}`
                        : `${formatMegabytes(downloadedBytes)} downloaded`}
                    </span>
                    <span className="text-[#1C2B2D] font-extrabold">{percent}%</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                    <div
                      className="h-full bg-[#CD7F32] rounded-full transition-all duration-150"
                      style={{ width: `${Math.min(100, Math.max(percent, 2))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Downloading and verifying the update securely. Please keep the app open.
                  </p>
                </div>
              )}

              {/* Allow from this source guidance */}
              {phase === 'permission_required' && (
                <div className="space-y-3">
                  <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950 leading-relaxed">
                    <p className="font-extrabold text-amber-900 mb-1">
                      Allow from this source
                    </p>
                    <p>
                      To finish installing {update.appName} v{update.newVersion}, enable{' '}
                      <span className="font-bold">Allow from this source</span> in Android Settings, then return to this screen. Installation will resume automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Installing state */}
              {phase === 'installing' && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-900 leading-relaxed">
                  <p className="font-extrabold mb-1">Confirm installation</p>
                  <p>
                    Tap <span className="font-bold">Update</span> in the Android system prompt to finish upgrading {update.appName}.
                  </p>
                </div>
              )}

              {/* Error banner */}
              {phase === 'error' && errorMessage && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200/80 rounded-2xl p-3 text-xs text-red-700 leading-relaxed">
                  <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                {(phase === 'prompt' || phase === 'error') && (
                  <>
                    <button
                      type="button"
                      onClick={onUpdateNow}
                      className="w-full min-h-[46px] bg-[#CD7F32] hover:bg-[#b56c24] active:scale-[0.99] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={15} />
                      <span>{phase === 'error' ? 'TRY AGAIN' : 'UPDATE NOW'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLater}
                      className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200/80 active:scale-[0.99] text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-colors cursor-pointer"
                    >
                      LATER
                    </button>
                  </>
                )}

                {phase === 'downloading' && (
                  <button
                    type="button"
                    onClick={onCancelDownload}
                    className="w-full min-h-[46px] bg-slate-100 hover:bg-red-50 hover:text-red-700 active:scale-[0.99] text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                )}

                {phase === 'permission_required' && (
                  <>
                    <button
                      type="button"
                      onClick={onOpenInstallSettings}
                      className="w-full min-h-[46px] bg-[#1C2B2D] hover:bg-[#283e40] active:scale-[0.99] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Settings size={15} />
                      <span>OPEN SETTINGS</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLater}
                      className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200/80 active:scale-[0.99] text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-colors cursor-pointer"
                    >
                      LATER
                    </button>
                  </>
                )}

                {phase === 'installing' && (
                  <button
                    type="button"
                    onClick={onLater}
                    className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200/80 active:scale-[0.99] text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-colors cursor-pointer"
                  >
                    CLOSE
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
