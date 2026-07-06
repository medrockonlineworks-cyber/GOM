/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { motion } from 'motion/react';
import { Phone, Lock, Eye, EyeOff, KeyRound, ShoppingBag, Landmark, ArrowLeft, Coins, Gift } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot';

export const AuthScreens: React.FC = () => {
  const { login, register, resetPassword, language, setLanguage } = useApp();
  const { t } = useTranslation(language);
  const [view, setView] = useState<AuthView>('login');
  
  // Remember Me state
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('gom_remember_me') !== 'false';
  });

  // Inputs
  const [phoneNumber, setPhoneNumber] = useState(() => {
    const remember = localStorage.getItem('gom_remember_me') !== 'false';
    return remember ? (localStorage.getItem('gom_remembered_phone') || '') : '';
  });
  const [password, setPassword] = useState(() => {
    const remember = localStorage.getItem('gom_remember_me') !== 'false';
    return remember ? (localStorage.getItem('gom_remembered_pass') || '') : '';
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    return new URLSearchParams(window.location.search).get('ref') || '';
  });
  
  // Visual indicators
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = (targetView?: AuthView) => {
    const remember = localStorage.getItem('gom_remember_me') !== 'false';
    setPhoneNumber((targetView === 'login' && remember) ? (localStorage.getItem('gom_remembered_phone') || '') : '');
    setPassword((targetView === 'login' && remember) ? (localStorage.getItem('gom_remembered_pass') || '') : '');
    setConfirmPassword('');
    setReferralCode(new URLSearchParams(window.location.search).get('ref') || '');
    setError(null);
    setSuccess(null);
  };

  const handleSwitchView = (newView: AuthView) => {
    resetState(newView);
    setView(newView);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(phoneNumber, password);
      if (!res.success) {
        setError(res.message);
      } else {
        if (rememberMe) {
          localStorage.setItem('gom_remember_me', 'true');
          localStorage.setItem('gom_remembered_phone', phoneNumber);
          localStorage.setItem('gom_remembered_pass', password);
        } else {
          localStorage.setItem('gom_remember_me', 'false');
          localStorage.removeItem('gom_remembered_phone');
          localStorage.removeItem('gom_remembered_pass');
        }
      }
    } catch (err: any) {
      setError('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register(phoneNumber, password, referralCode);
      if (res.success) {
        setSuccess(res.message);
        // Instant success, context automatically redirects current session
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError('An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(phoneNumber, password);
      if (res.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          handleSwitchView('login');
        }, 2000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col sm:items-center sm:justify-center sm:py-12 sm:px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(212,163,89,0.04),transparent_60%)]">
      {/* Background decoration elements */}
      <div className="hidden sm:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none animate-[pulse_8s_infinite_alternate]" />
      <div className="hidden sm:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/3 blur-[120px] pointer-events-none animate-[pulse_10s_infinite_alternate]" />

      {/* Main card container */}
      <div className="w-full sm:max-w-md bg-white sm:rounded-[28px] sm:shadow-[0_25px_60px_rgba(0,0,0,0.25)] sm:border sm:border-slate-100/80 flex flex-col overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[92vh]">
        {/* Top Banner Accent */}
        <div className="bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white px-6 py-10 flex flex-col items-center justify-center shrink-0 shadow-md relative overflow-hidden border-b border-emerald-950/20">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,rgba(212,163,89,0.35),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:250px_250px] animate-[pulse_6s_infinite_alternate]" />
          
          {/* Floating Language Changer for non-authenticated users */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className="bg-[#051F10]/95 backdrop-blur-md border border-emerald-800/40 text-[10px] font-black text-white rounded-xl px-3 py-1.5 cursor-pointer hover:bg-emerald-900 transition-colors shadow-inner flex items-center gap-1.5"
            >
              {language === 'en' ? '🇺🇸 EN' : '🇪🇹 አማ'}
            </button>
          </div>

          <h1 className="text-3.5xl font-black uppercase tracking-[0.25em] text-white">GOM</h1>
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-bronze to-transparent my-2" />
          <p className="text-amber-400/95 text-[9px] uppercase tracking-[0.18em] text-center font-extrabold">
            Authorized Matching Terminal
          </p>
        </div>

        {/* Main Form container with Motion page swaps */}
        <div className="flex-1 px-6 py-8 flex flex-col justify-between bg-white sm:max-h-[600px] overflow-y-auto">
          
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-black tracking-tight text-slate-800">{t('signIn')}</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('phoneLabel')}</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Phone size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 09xxxxxxxx or 07xxxxxxxx"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{t('passwordLabel')}</label>
                      <button 
                        type="button" 
                        onClick={() => handleSwitchView('forgot')}
                        className="text-xs text-bronze hover:text-bronze-hover hover:underline font-bold transition-all"
                      >
                        {t('forgotPassword')}
                      </button>
                    </div>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center select-none py-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 font-semibold group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4.5 h-4.5 text-bronze border-slate-300 rounded-lg focus:ring-bronze bg-slate-50 cursor-pointer accent-bronze transition-all"
                      />
                      <span className="group-hover:text-slate-800 transition-colors">{t('rememberMe')}</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-bronze to-bronze-hover hover:from-bronze-hover hover:to-bronze text-white font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_rgba(212,163,89,0.3)] hover:shadow-[0_6px_20px_rgba(212,163,89,0.4)] active:scale-[0.98] transition-all flex items-center justify-center text-sm gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('signingIn')}</span>
                      </div>
                    ) : (
                      t('signIn')
                    )}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <button 
                    onClick={() => handleSwitchView('register')}
                    className="text-xs text-bronze hover:text-bronze-hover hover:underline font-bold transition-all"
                  >
                    {t('dontHaveAcc')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* REGISTER VIEW */}
          {view === 'register' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-black tracking-tight text-slate-800">{t('createNewAccount')}</h2>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold border border-emerald-100 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('phoneLabel')}</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Phone size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 09xxxxxxxx or 07xxxxxxxx"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('passwordLabel')}</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('confirmPasswordLabel')}</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span>{t('referralCodeLabel')}</span>
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600 group-focus-within:text-emerald-700 transition-colors">
                        <Gift size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. GOM12345"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        className="w-full bg-emerald-50/40 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-emerald-100/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-bronze to-bronze-hover hover:from-bronze-hover hover:to-bronze text-white font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_rgba(212,163,89,0.3)] hover:shadow-[0_6px_20px_rgba(212,163,89,0.4)] active:scale-[0.98] transition-all flex items-center justify-center text-sm gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('registering')}</span>
                      </div>
                    ) : (
                      t('registerBtn')
                    )}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <button 
                    onClick={() => handleSwitchView('login')}
                    className="text-xs text-bronze hover:text-bronze-hover hover:underline font-bold transition-all"
                  >
                    {t('alreadyHaveAcc')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="mb-6 flex items-center gap-2.5">
                  <button 
                    onClick={() => handleSwitchView('login')}
                    className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800">{t('resetPasswordTitle')}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{t('resetPasswordSub')}</p>
                  </div>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold border border-emerald-100 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('registeredPhoneLabel')}</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Phone size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 09xxxxxxxx or 07xxxxxxxx"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('newSecurePasswordLabel')}</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('confirmNewPasswordLabel')}</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bronze transition-colors">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all font-medium placeholder-slate-400/80 shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-bronze to-bronze-hover hover:from-bronze-hover hover:to-bronze text-white font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_rgba(212,163,89,0.3)] hover:shadow-[0_6px_20px_rgba(212,163,89,0.4)] active:scale-[0.98] transition-all flex items-center justify-center text-sm gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('updatingBtn')}</span>
                      </div>
                    ) : (
                      t('saveNewPasswordBtn')
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
