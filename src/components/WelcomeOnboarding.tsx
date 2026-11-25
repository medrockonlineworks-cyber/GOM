/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Layers,
  Shuffle,
  ShieldCheck,
  Wallet,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MaterialMode } from '../types';
import CurrencySelector from './CurrencySelector';
import LanguageSelector from './LanguageSelector';

interface WelcomeOnboardingProps {
  onComplete: (mode: MaterialMode) => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onComplete }) => {
  const { currentUser, selectMaterialMethod, formatPrice, logout } = useApp();
  const [selectedMode, setSelectedMode] = useState<MaterialMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    if (!selectedMode || isSubmitting) return;

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await selectMaterialMethod(selectedMode);
      if (!res.success) {
        setErrorMsg(res.message || 'Unable to save your selection. Please try again.');
        setIsSubmitting(false);
        return;
      }
      onComplete(selectedMode);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to save your selection. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-alabaster text-slate-900">
      {/* TOP SAFE-AREA HEADER */}
      <header className="safe-top-header bg-deep-forest text-white shrink-0 shadow-md">
        <div className="h-14 flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-widest uppercase text-white">GOM</h1>
            <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-wider">
              Setup
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySelector />
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* WELCOME HERO */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-deep-forest to-deep-forest-light text-white rounded-3xl p-5 shadow-lg border border-bronze/15"
        >
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
            Account Created
          </p>
          <h2 className="text-2xl font-black tracking-tight mt-1 leading-tight">
            Welcome to GOM
          </h2>
          <p className="text-xs text-slate-200/90 leading-relaxed mt-2">
            {currentUser?.username ? `${currentUser.username}, your` : 'Your'} starter bonus of{' '}
            <span className="font-black text-amber-300 tabular-nums">
              {formatPrice(currentUser?.walletBalance || 1500)}
            </span>{' '}
            is ready. Review how GOM works and choose your working method below to enter the
            platform.
          </p>
        </motion.section>

        {/* HOW GOM WORKS */}
        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            How It Works
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-2xs">
            <div className="p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-bronze flex items-center justify-center shrink-0">
                <ClipboardList size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900">
                  1. Choose Your Working Method
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Start with Randomly Assigned Material or choose Fixed Material and select your
                  level inside the Orders page.
                </p>
              </div>
            </div>

            <div className="p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Wallet size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900">
                  2. Complete Your Assigned Orders
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Each submitted order returns your material cost plus commission straight into
                  your GOM wallet balance.
                </p>
              </div>
            </div>

            <div className="p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-deep-forest flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900">
                  3. Withdraw After Completing Your Cycle
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Once all required orders in your chosen method are completed, full withdrawal
                  unlocks directly to your bank or mobile wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REQUIRED METHOD SELECTION (2 METHODS ONLY — LEVELS CHOSEN INSIDE ORDERS TAB) */}
        <section className="space-y-3 pb-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Choose Your Method
            </h3>
            <span className="text-[11px] font-bold text-bronze">Required to continue</span>
          </div>

          {/* OPTION 1: RANDOMLY ASSIGNED MATERIAL */}
          <button
            type="button"
            onClick={() => {
              setSelectedMode('random');
              setErrorMsg('');
            }}
            className={`w-full text-left rounded-2xl p-4 transition-all cursor-pointer border-2 min-h-[44px] ${
              selectedMode === 'random'
                ? 'bg-white border-deep-forest shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMode === 'random'
                      ? 'bg-deep-forest text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Shuffle size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">
                    Randomly Assigned Material
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    Continues the standard 15-order progressive system with automatically assigned
                    materials at each step.
                  </p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedMode === 'random'
                    ? 'bg-deep-forest border-deep-forest text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedMode === 'random' && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Cycle Orders
                </span>
                <span className="font-black text-slate-800 tabular-nums">15 Orders</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  System Type
                </span>
                <span className="font-black text-slate-800">Standard Progressive</span>
              </div>
            </div>
          </button>

          {/* OPTION 2: FIXED MATERIAL */}
          <button
            type="button"
            onClick={() => {
              setSelectedMode('fixed');
              setErrorMsg('');
            }}
            className={`w-full text-left rounded-2xl p-4 transition-all cursor-pointer border-2 min-h-[44px] ${
              selectedMode === 'fixed'
                ? 'bg-white border-bronze shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMode === 'fixed'
                      ? 'bg-bronze text-white'
                      : 'bg-amber-50 text-bronze'
                  }`}
                >
                  <Layers size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">
                    Fixed Material
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    Enter the platform and open Orders to pick from 5 Fixed Material levels,
                    recharge your chosen level amount, complete its orders, and withdraw.
                  </p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedMode === 'fixed'
                    ? 'bg-bronze border-bronze text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedMode === 'fixed' && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Available Plans
                </span>
                <span className="font-black text-slate-800">5 Fixed Levels</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Next Step
                </span>
                <span className="font-black text-bronze">Choose Level in Orders</span>
              </div>
            </div>
          </button>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Subtle sign-out link in case user wants to switch account */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 py-2 px-3 cursor-pointer"
            >
              <LogOut size={13} />
              Sign out and switch account
            </button>
          </div>
        </section>
      </div>

      {/* STICKY SAFE-AREA BOTTOM ACTION BAR */}
      <footer className="safe-bottom-nav bg-white border-t border-slate-200/90 px-5 pt-3 shrink-0 shadow-[0_-6px_20px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          disabled={!selectedMode || isSubmitting}
          onClick={handleConfirm}
          className={`w-full min-h-[48px] py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            selectedMode && !isSubmitting
              ? selectedMode === 'fixed'
                ? 'bg-bronze hover:bg-bronze-hover active:scale-[0.99] text-white shadow-md cursor-pointer'
                : 'bg-deep-forest hover:bg-deep-forest-light active:scale-[0.99] text-white shadow-md cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span>Setting up your account...</span>
          ) : selectedMode === 'random' ? (
            <>
              <span>Continue with Randomly Assigned</span>
              <ArrowRight size={15} />
            </>
          ) : selectedMode === 'fixed' ? (
            <>
              <span>Enter Platform with Fixed Material</span>
              <ArrowRight size={15} />
            </>
          ) : (
            <span>Select a Method Above to Continue</span>
          )}
        </button>
      </footer>
    </div>
  );
};
