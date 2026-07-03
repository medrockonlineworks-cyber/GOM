/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Phone, Lock, Eye, EyeOff, KeyRound, ShoppingBag, Landmark, ArrowLeft, Coins, Gift } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot';

export const AuthScreens: React.FC = () => {
  const { login, register, resetPassword } = useApp();
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
    <div className="flex-1 flex flex-col bg-white">
      {/* Top Banner Accent */}
      <div className="bg-deep-forest text-white px-6 py-12 flex flex-col items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.4),transparent_60%)]" />
        
        {/* Market Launcher Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 shrink-0"
        >
          <div className="w-8 h-8 border-4 border-deep-forest rotate-45"></div>
        </motion.div>

        <h1 className="text-2xl font-black uppercase tracking-tight">Global <span className="text-bronze font-light italic text-xl">Online Market</span></h1>
        <p className="text-alabaster/80 text-[10px] uppercase tracking-widest mt-1 text-center font-bold">
          Ethiopia's Premium Digital Task Platform
        </p>
      </div>

      {/* Main Form container with Motion page swaps */}
      <div className="flex-1 px-6 py-8 flex flex-col justify-between">
        
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
                <h2 className="text-xl font-bold text-slate-800">Secure Sign In</h2>
                <p className="text-xs text-slate-500 mt-1">Enter your phone number and password to access your secure wallet.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ethiopian Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09xxxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Secure Password</label>
                    <button 
                      type="button" 
                      onClick={() => handleSwitchView('forgot')}
                      className="text-xs text-bronze hover:underline font-bold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center select-none py-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-bronze border-slate-300 rounded focus:ring-bronze bg-slate-50 cursor-pointer accent-bronze"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center text-sm gap-2 mt-2 disabled:opacity-50"
                >
                  {isLoading ? 'Processing Access...' : 'Sign In Securely'}
                </button>
              </form>

              <div className="text-center mt-6">
                <span className="text-xs text-slate-500">Don't have an account? </span>
                <button 
                  onClick={() => handleSwitchView('register')}
                  className="text-xs text-bronze hover:underline font-bold"
                >
                  Register Now
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
                <h2 className="text-xl font-bold text-slate-800">Create Account</h2>
                <p className="text-xs text-slate-500 mt-1">Register using only your Ethiopian phone number & password.</p>
              </div>

              {/* Welcome Bonus Highlight */}
              <div className="mb-5 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <Coins size={18} className="text-emerald-600" />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-emerald-800">500 ETB Welcome Bonus!</span>
                  <span className="block text-[10px] text-emerald-600 font-medium">Credited to your wallet instantly upon registration.</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold border border-emerald-100">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ethiopian Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09xxxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password (Min 6 Characters)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span>Referral Code / Invite Code</span>
                    <span className="text-[9px] text-slate-400 lowercase font-medium font-sans normal-case">(optional - get +100 ETB)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                      <Gift size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. GOM12345"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full bg-emerald-50/50 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center text-sm gap-2 mt-2 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Register & Claim 500 Bonus'}
                </button>
              </form>

              <div className="text-center mt-6">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button 
                  onClick={() => handleSwitchView('login')}
                  className="text-xs text-bronze hover:underline font-bold"
                >
                  Sign In
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
              <div className="mb-6 flex items-center gap-2">
                <button 
                  onClick={() => handleSwitchView('login')}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Reset Password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Secure password recovery via phone verification.</p>
                </div>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold border border-emerald-100">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Registered Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09xxxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">New Secure Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bronze focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center text-sm gap-2 mt-2 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Save New Password'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
