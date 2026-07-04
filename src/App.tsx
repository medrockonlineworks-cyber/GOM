/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileFrame } from './components/MobileFrame';
import { AuthScreens } from './components/AuthScreens';
import { HomeTab } from './components/HomeTab';
import { OrdersTab } from './components/OrdersTab';
import { MyTab } from './components/MyTab';
import { AdminConsole } from './components/AdminConsole';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  ShoppingBag, 
  User as UserIcon, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Info,
  Layers,
  Store,
  X,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Headphones,
  Copy,
  CheckCircle2,
  Download,
  Share
} from 'lucide-react';

type UserTab = 'home' | 'orders' | 'my';

function AppContent() {
  const { currentUser, deposit, withdraw, addSupportTicket, rechargeAccounts } = useApp();
  const [activeTab, setActiveTab] = useState<UserTab>('home');
  const [isAdminView, setIsAdminView] = useState(false);

  // PWA & Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  React.useEffect(() => {
    // 1. Check if already running in standalone mode (installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setIsAlreadyInstalled(isStandalone);
    
    if (isStandalone) {
      return;
    }

    // 2. Detect iOS device
    const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOSDevice);

    // 3. Listen for browser install prompt trigger (Chrome/Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Show the custom install helper after 3.5 seconds on mobile if not already installed
    const timer = setTimeout(() => {
      setShowInstallBanner(true);
    }, 3500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation decision: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      // General alert if native prompt is not available
      alert("To install GOM:\n\n1. Tap the browser options/menu button (three dots or share button).\n2. Select 'Add to Home screen' or 'Install'.");
    }
  };

  // Common modal triggers
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [prefillRechargeAmount, setPrefillRechargeAmount] = useState(0);

  const handleOpenRecharge = (amount: number = 0) => {
    setPrefillRechargeAmount(amount);
    setRechargeModalOpen(true);
  };

  // Form states for global modals
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeBank, setRechargeBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [rechargeRef, setRechargeRef] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [lastSubmittedRecharge, setLastSubmittedRecharge] = useState<{ amount: number; bank: string; ref: string } | null>(null);

  // Reset success state and details on modal open
  React.useEffect(() => {
    if (rechargeModalOpen) {
      setRechargeSuccess(false);
      setLastSubmittedRecharge(null);
      setRechargeError('');
      if (rechargeAccounts && rechargeAccounts.length > 0) {
        setRechargeBank(rechargeAccounts[0].bank);
      }
    }
  }, [rechargeModalOpen, rechargeAccounts]);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [withdrawAccNo, setWithdrawAccNo] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const [supportSubject, setSupportSubject] = useState('Wallet Recharge Issue');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Sync prefill amount when changes occur
  React.useEffect(() => {
    if (prefillRechargeAmount > 0) {
      setRechargeAmount(prefillRechargeAmount.toString());
    } else {
      setRechargeAmount('');
    }
  }, [prefillRechargeAmount]);

  // Ethiopian banks list
  const ETH_BANKS = [
    'Commercial Bank of Ethiopia (CBE)',
    'Dashen Bank',
    'Bank of Abyssinia (BoA)',
    'Awash Bank',
    'United Bank (Hibret Bank)',
    'Nib International Bank',
    'Wegagen Bank'
  ];

  // Official admin bank details for manual deposit transfers
  const OFFICIAL_ACCOUNTS = rechargeAccounts;

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError('');
    setRechargeSuccess(false);

    const amt = Number(rechargeAmount);
    if (isNaN(amt) || amt < 200) {
      setRechargeError('The minimum recharge amount is 200 ETB.');
      return;
    }

    if (!rechargeRef.trim()) {
      setRechargeError('Please provide the transaction reference number (TXID) or transfer ID.');
      return;
    }

    deposit(amt, rechargeBank, rechargeRef);
    setLastSubmittedRecharge({ amount: amt, bank: rechargeBank, ref: rechargeRef });
    setRechargeSuccess(true);
    setRechargeRef('');
    setRechargeAmount('');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess(false);

    const amt = Number(withdrawAmount);
    if (isNaN(amt) || amt < 200) {
      setWithdrawError('The minimum withdrawal amount is 200 ETB.');
      return;
    }

    if (amt > 75000) {
      setWithdrawError('The maximum withdrawal amount is 75,000 ETB.');
      return;
    }

    if (amt > currentUser.walletBalance) {
      setWithdrawError(`Insufficient balance. Maximum withdrawable is ${currentUser.walletBalance} ETB.`);
      return;
    }

    if (!withdrawAccNo.trim()) {
      setWithdrawError('Please enter your secure bank account number.');
      return;
    }

    const res = withdraw(amt, withdrawBank, withdrawAccNo);
    if (res.success) {
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setWithdrawAccNo('');
      setTimeout(() => {
        setWithdrawSuccess(false);
        setWithdrawModalOpen(false);
      }, 500);
    } else {
      setWithdrawError(res.message);
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSuccess(false);

    if (!supportMessage.trim()) return;

    addSupportTicket(supportSubject, supportMessage);
    setSupportSuccess(true);
    setSupportMessage('');
    setTimeout(() => {
      setSupportSuccess(false);
      setSupportModalOpen(false);
    }, 2500);
  };

  if (!currentUser) {
    return <AuthScreens />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      
      {/* APP TOP HERO UTILITY RAIL */}
      <header className="h-16 bg-deep-forest flex items-center justify-between px-5 text-white shrink-0 shadow-md">
        <div className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <div className="w-3.5 h-3.5 border-2 border-deep-forest rotate-45"></div>
          </div>
          <h1 className="text-sm font-black tracking-tight uppercase">
            GOM
          </h1>
        </div>

        <div className="flex gap-2.5 items-center">
          {!isAlreadyInstalled && (
            <button
              onClick={() => setShowInstallBanner(true)}
              className="bg-bronze hover:bg-bronze-hover active:opacity-90 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Install GOM"
            >
              <img src="/gom-logo.svg" alt="GOM Logo" className="w-3.5 h-3.5 rounded-xs object-contain" />
              <span>Install GOM</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-deep-forest-light px-2 py-1 rounded-lg border border-deep-forest-light">
            <span className="text-[9px] uppercase tracking-wider text-bronze">Secure</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>

          {/* ADMIN MODE TESTING SWITCH (ROLE-BASED ACTIONS) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsAdminView(!isAdminView)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all shadow-sm ${
                isAdminView 
                  ? 'bg-amber-500 text-slate-900 ring-1 ring-amber-300' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {isAdminView ? <UserCheck size={10} /> : <ShieldCheck size={10} />}
              {isAdminView ? 'User' : 'Admin'}
            </button>
          )}
        </div>
      </header>

      {/* DYNAMIC SCENE CONTAINER */}
      <div className="flex-1 overflow-y-auto flex flex-col relative">
        <AnimatePresence mode="wait">
          {isAdminView && currentUser.role === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full"
            >
              <AdminConsole onExit={() => setIsAdminView(false)} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col h-full"
            >
              {activeTab === 'home' && (
                <HomeTab 
                  onNavigateToOrders={() => setActiveTab('orders')}
                  onOpenRechargeModal={() => handleOpenRecharge(0)}
                  onOpenWithdrawModal={() => setWithdrawModalOpen(true)}
                  onOpenSupportModal={() => setSupportModalOpen(true)}
                />
              )}
              {activeTab === 'orders' && (
                <OrdersTab onOpenRechargeModal={(amount) => handleOpenRecharge(amount)} />
              )}
              {activeTab === 'my' && (
                <MyTab 
                  rechargeModalOpen={rechargeModalOpen}
                  setRechargeModalOpen={setRechargeModalOpen}
                  withdrawModalOpen={withdrawModalOpen}
                  setWithdrawModalOpen={setWithdrawModalOpen}
                  supportModalOpen={supportModalOpen}
                  setSupportModalOpen={setSupportModalOpen}
                  prefillRechargeAmount={prefillRechargeAmount}
                  onToggleAdminView={setIsAdminView}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MOBILE PERSISTENT BOTTOM TAB NAVIGATION */}
      {!isAdminView && (
        <div id="mobile_bottom_navigation_bar" className="bg-white border-t border-slate-200/80 px-6 py-2.5 flex items-center justify-around shrink-0 z-40 shadow-lg">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'home' ? 'text-bronze scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HomeIcon size={18} />
            <span className="text-[10px] tracking-wide font-extrabold">Home</span>
            {activeTab === 'home' && (
              <motion.div layoutId="nav_indicator" className="absolute -bottom-1 w-8 h-1 bg-bronze rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'orders' ? 'text-bronze scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShoppingBag size={18} />
            <span className="text-[10px] tracking-wide font-extrabold">Orders</span>
            {activeTab === 'orders' && (
              <motion.div layoutId="nav_indicator" className="absolute -bottom-1 w-8 h-1 bg-bronze rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('my')}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'my' ? 'text-bronze scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon size={18} />
            <span className="text-[10px] tracking-wide font-extrabold">My</span>
            {activeTab === 'my' && (
              <motion.div layoutId="nav_indicator" className="absolute -bottom-1 w-8 h-1 bg-bronze rounded-full" />
            )}
          </button>
        </div>
      )}

      {/* --- RECHARGE POPUP MODAL --- */}
      <AnimatePresence>
        {rechargeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setRechargeModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>

              {rechargeSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4 space-y-4"
                >
                  <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={36} className="text-emerald-500" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800">Deposit Request Submitted!</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                      Your transfer reference code has been recorded successfully for manual verification.
                    </p>
                  </div>

                  {lastSubmittedRecharge && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left text-[11px] space-y-2">
                      <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                        <span className="text-slate-400 font-semibold">Deposit Amount:</span>
                        <span className="font-black text-bronze">{lastSubmittedRecharge.amount.toLocaleString()} ETB</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                        <span className="text-slate-400 font-semibold">Selected Bank:</span>
                        <span className="font-bold text-slate-700 truncate max-w-[150px]">{lastSubmittedRecharge.bank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Reference (TXID):</span>
                        <span className="font-mono font-black text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px]">
                          {lastSubmittedRecharge.ref}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3 text-[10px] text-amber-800 text-left leading-relaxed">
                    <span className="font-black text-amber-900 block mb-0.5 uppercase tracking-wider text-[9px]">⏳ Manual Admin Verification:</span>
                    Manual validation is performed by our system administrators. Recharges are normally verified and credited to your wallet in <span className="font-extrabold">1 to 2 hours</span>.
                  </div>

                  <button
                    onClick={() => setRechargeModalOpen(false)}
                    className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg shadow-bronze/10 transition-all text-xs cursor-pointer"
                  >
                    Done & Return
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-bronze flex items-center justify-center">
                      <ArrowUpRight size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Ethiopian Bank Deposit</h3>
                      <p className="text-[10px] text-slate-400">Official platform deposit gateways (ETB Only)</p>
                    </div>
                  </div>

                  {/* Step instructions */}
                  <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 text-[10px] text-bronze font-medium space-y-2 leading-relaxed">
                    <span className="font-extrabold block">📌 Manual Transfer Steps:</span>
                    <span>1. Copy one of our official Bank Accounts below.</span><br />
                    <span>2. Open your banking application (CBE Birr, Dashen Amole, Awash, BoA, CBE Mobile) and make a transfer of your desired amount.</span><br />
                    <span>3. Paste the transaction reference code (TXID) in the field below to verify.</span>
                  </div>

                  {/* List of official platform accounts */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Official Receiving Bank Accounts:</span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {OFFICIAL_ACCOUNTS.map((acc, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-[10px] flex justify-between items-center">
                          <div>
                            <span className="block font-extrabold text-slate-700">{acc.bank}</span>
                            <span className="block text-slate-400 mt-0.5">{acc.accName}</span>
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(acc.accNo);
                              alert(`${acc.bank} account number copied!`);
                            }}
                            className="bg-white hover:bg-amber-50 text-bronze border border-slate-200 px-2.5 py-1 rounded font-extrabold cursor-pointer active:scale-95 transition-all text-[9px]"
                          >
                            Copy Acc No
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recharge Form */}
                  <form onSubmit={handleRechargeSubmit} className="space-y-3.5 pt-2 border-t border-slate-100">
                    {rechargeError && (
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                        {rechargeError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Receiving Bank</label>
                      <select
                        value={rechargeBank}
                        onChange={(e) => setRechargeBank(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                      >
                        {rechargeAccounts.map((acc, index) => (
                          <option key={acc.id || index} value={acc.bank}>{acc.bank}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Amount (ETB)</label>
                        <input
                          type="number"
                          required
                          min="200"
                          placeholder="Min 200"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block">Minimum: 200 ETB</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Transfer TXID / Ref</label>
                        <input
                          type="text"
                          required
                          placeholder="FTxxxxxxxx"
                          value={rechargeRef}
                          onChange={(e) => setRechargeRef(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3 rounded-xl shadow transition-all text-xs cursor-pointer"
                    >
                      Submit Recharge Request
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- WITHDRAW POPUP MODAL --- */}
      <AnimatePresence>
        {withdrawModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-bronze flex items-center justify-center">
                  <ArrowDownLeft size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Withdrawal Payout</h3>
                  <p className="text-[10px] text-slate-400">Withdrawal to Ethiopian bank accounts (ETB)</p>
                </div>
              </div>

              {/* Withdraw Form */}
              <form onSubmit={handleWithdrawSubmit} className="space-y-3.5 pt-2">
                {withdrawError && (
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                    {withdrawError}
                  </div>
                )}
                {withdrawSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold border border-emerald-100">
                    Withdrawal request registered! Pending manual Admin confirmation and payout.
                  </div>
                )}

                {(() => {
                  const completedCount = currentUser.completedOrderIds ? currentUser.completedOrderIds.length : 0;
                  const isLocked = completedCount < 10;
                  return (
                    <>
                      {isLocked && (
                        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3 text-[10px] text-amber-800 leading-relaxed space-y-1">
                          <span className="font-black text-amber-900 block uppercase tracking-wider text-[9px]">⚠️ Withdrawal Locked</span>
                          <p>To secure our ecosystem and prevent rapid churn, you must complete all <span className="font-extrabold text-amber-900">10 daily tasks</span> before requesting a withdrawal. Your current progress: <span className="font-black text-amber-900">{completedCount}/10 tasks completed</span>.</p>
                        </div>
                      )}

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Available Balance:</span>
                        <span className="text-xs font-black text-slate-800">{currentUser.walletBalance.toLocaleString()} ETB</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Payout Bank</label>
                        <select
                          value={withdrawBank}
                          disabled={isLocked}
                          onChange={(e) => setWithdrawBank(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                        >
                          {ETH_BANKS.map((bank, index) => (
                            <option key={index} value={bank}>{bank}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Your Account Number</label>
                          <input
                            type="text"
                            required
                            disabled={isLocked}
                            placeholder="e.g. 1000xxxxxxxxx"
                            value={withdrawAccNo}
                            onChange={(e) => setWithdrawAccNo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Withdraw Amount (ETB)</label>
                          <input
                            type="number"
                            required
                            min="200"
                            max="75000"
                            disabled={isLocked}
                            placeholder="Min 200 - Max 75k"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                          />
                          <span className="text-[9px] text-slate-400 mt-1 block">Min: 200 | Max: 75,000 ETB</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLocked}
                        className={`w-full font-bold py-3 rounded-xl shadow transition-all text-xs cursor-pointer ${
                          isLocked 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/50' 
                            : 'bg-bronze hover:bg-bronze-hover active:opacity-90 text-white'
                        }`}
                      >
                        {isLocked ? `Complete 10 tasks to withdraw (${completedCount}/10)` : 'Submit Payout Request'}
                      </button>
                    </>
                  );
                })()}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LIVE SUPPORT SUBMIT POPUP MODAL --- */}
      <AnimatePresence>
        {supportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setSupportModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-bronze flex items-center justify-center">
                  <Headphones size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Contact Official Support</h3>
                  <p className="text-[10px] text-slate-400">Response time: 5-15 minutes (CBE, Dashen Bank, task locks)</p>
                </div>
              </div>

              {/* Support Form */}
              <form onSubmit={handleSupportSubmit} className="space-y-3.5 pt-2">
                {supportSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold border border-emerald-100">
                    Support message submitted successfully! Official agent will review this in the Admin Center.
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Subject Topic</label>
                  <select
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                  >
                    <option value="Wallet Recharge Issue">Wallet Recharge Issue</option>
                    <option value="Withdrawal Delay / Lock">Withdrawal Delay / Lock</option>
                    <option value="Order Match Error">Order Match Error</option>
                    <option value="Verify CBE Transfer Receipt">Verify CBE Transfer Receipt</option>
                    <option value="Other Technical Questions">Other Technical Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Your Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter your transfer reference, bank details, or order task number..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3 rounded-xl shadow transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} /> Send Message to Agent
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PWA INSTALLATION PROMPT / POPUP MODAL --- */}
      <AnimatePresence>
        {showInstallBanner && !isAlreadyInstalled && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full space-y-5 border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setShowInstallBanner(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>

              {/* App Identity Row */}
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 p-0.5 shadow-md flex items-center justify-center shrink-0">
                  <img src="/gom-logo.svg" alt="GOM" className="w-full h-full object-contain rounded-[14px]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Install GOM App</h3>
                  <p className="text-[10px] text-amber-600 font-extrabold tracking-wide uppercase mt-0.5">Global Online Market</p>
                  <p className="text-[10px] text-slate-400">Ethiopia's Premium Reward Platform</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] text-slate-600 leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span>⚡ Instant full-screen dedicated window</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span>📱 Low data consumption &amp; offline ready</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span>🔒 Secure real-time cloud database syncing</span>
                </div>
              </div>

              {/* Conditional Install CTA or Guide */}
              {isIOS ? (
                // iOS Installation Guide
                <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-4 text-[11px] text-amber-950 space-y-2.5">
                  <div className="font-extrabold uppercase tracking-wider text-[9px] text-amber-800 flex items-center gap-1">
                    <span className="animate-pulse">📱</span> iOS Safari Installation Guide
                  </div>
                  <div className="leading-relaxed space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">1.</span>
                      <span>Tap the <span className="font-extrabold inline-flex items-center gap-0.5 bg-white border border-amber-300 px-1.5 py-0.5 rounded text-slate-700 text-[10px]"><Share size={10} /> Share</span> button at the bottom of Safari.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">2.</span>
                      <span>Scroll down and tap <span className="font-extrabold text-amber-950">"Add to Home Screen"</span>.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">3.</span>
                      <span>Tap <span className="font-extrabold text-amber-900">"Add"</span> in the top-right corner to finish.</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Android / Desktop / Chrome installation CTA
                <div className="space-y-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-blue-900 to-slate-900 hover:from-blue-850 hover:to-slate-850 text-white font-extrabold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} className="animate-bounce" /> Install App to Device
                  </button>
                  
                  {!deferredPrompt && (
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                      If the automatic button is inactive, tap your browser's menu (three dots <span className="font-black">⋮</span>) and select <span className="font-bold text-slate-500">"Add to Home Screen"</span>.
                    </p>
                  )}
                </div>
              )}

              {/* Close / Dismiss */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg text-[10px] cursor-pointer transition-colors text-center"
                >
                  Continue in Browser
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MobileFrame>
        <AppContent />
      </MobileFrame>
    </AppProvider>
  );
}
