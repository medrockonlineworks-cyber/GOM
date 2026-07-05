/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useTranslation } from './utils/translations';
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
  Share,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Trash2,
  Image,
  FileText,
  Check,
  AlertCircle,
  Coins
} from 'lucide-react';

const BankLogo = ({ bankName, className = "" }: { bankName: string; className?: string }) => {
  const name = bankName.toLowerCase();
  const [imgError, setImgError] = useState(false);
  const { bankLogos } = useApp();
  
  // Define bank initials and color schemes
  let initials = 'BK';
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-700';
  let ringColor = 'ring-slate-200/40';
  let logoUrl = '';

  if (name.includes('commercial') || name.includes('cbe')) {
    initials = 'CBE';
    bgColor = 'bg-purple-600';
    textColor = 'text-white';
    ringColor = 'ring-purple-100';
    logoUrl = bankLogos?.cbe || 'https://upload.wikimedia.org/wikipedia/commons/2/23/Commercial_Bank_of_Ethiopia_Logo.svg';
  } else if (name.includes('dashen')) {
    initials = 'DB';
    bgColor = 'bg-blue-600';
    textColor = 'text-white';
    ringColor = 'ring-blue-100';
    logoUrl = bankLogos?.dashen || 'https://upload.wikimedia.org/wikipedia/commons/2/22/Dashen_Bank_logo.png';
  } else if (name.includes('abyssinia') || name.includes('boa')) {
    initials = 'BoA';
    bgColor = 'bg-emerald-700';
    textColor = 'text-white';
    ringColor = 'ring-emerald-100';
    logoUrl = bankLogos?.abyssinia || 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Bank_of_Abyssinia_logo.png';
  } else if (name.includes('awash')) {
    initials = 'AWB';
    bgColor = 'bg-orange-500';
    textColor = 'text-white';
    ringColor = 'ring-orange-100';
    logoUrl = bankLogos?.awash || 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Awash_Bank_Logo.png';
  } else if (name.includes('telebirr') || name.includes('tele')) {
    initials = 'TB';
    bgColor = 'bg-cyan-500';
    textColor = 'text-white';
    ringColor = 'ring-cyan-100';
    logoUrl = bankLogos?.telebirr || 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Telebirr_logo.png';
  } else if (name.includes('hibret') || name.includes('united')) {
    initials = 'HB';
    bgColor = 'bg-teal-600';
    textColor = 'text-white';
    ringColor = 'ring-teal-100';
    logoUrl = bankLogos?.hibret || 'https://www.hibretbank.com.et/wp-content/uploads/2020/09/cropped-H-32x32.png';
  } else if (name.includes('wegagen')) {
    initials = 'WB';
    bgColor = 'bg-red-600';
    textColor = 'text-white';
    ringColor = 'ring-red-100';
    logoUrl = bankLogos?.wegagen || 'https://upload.wikimedia.org/wikipedia/commons/3/30/Wegagen_Bank_logo.png';
  } else if (name.includes('oromia') || name.includes('coop')) {
    initials = 'CPB';
    bgColor = 'bg-green-600';
    textColor = 'text-white';
    ringColor = 'ring-green-100';
    logoUrl = bankLogos?.oromia || 'https://upload.wikimedia.org/wikipedia/commons/2/20/Cooperative_Bank_of_Oromia_logo.png';
  } else {
    // Generic fallback based on initials of the words
    const words = bankName.trim().split(/\s+/);
    initials = words.map(w => w[0]).join('').substring(0, 3).toUpperCase() || 'BK';
    bgColor = 'bg-amber-600';
    textColor = 'text-white';
    ringColor = 'ring-amber-100';
  }

  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] tracking-wider shrink-0 shadow-sm border border-white/10 uppercase overflow-hidden ring-4 ${ringColor} ${className}`}>
      {logoUrl && !imgError ? (
        <img 
          src={logoUrl} 
          alt={bankName}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-0.5 bg-white"
        />
      ) : (
        <div className={`w-full h-full ${bgColor} ${textColor} flex items-center justify-center font-black text-[10px] tracking-wider uppercase`}>
          {initials}
        </div>
      )}
    </div>
  );
};

type UserTab = 'home' | 'orders' | 'my';

function AppContent() {
  const { currentUser, deposit, withdraw, addSupportTicket, rechargeAccounts, language, setLanguage } = useApp();
  const { t } = useTranslation(language);
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
  const [rechargeScreenshot, setRechargeScreenshot] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [lastSubmittedRecharge, setLastSubmittedRecharge] = useState<{ amount: number; bank: string; ref: string } | null>(null);

  // Reset success state and details on modal open
  React.useEffect(() => {
    if (rechargeModalOpen) {
      setRechargeSuccess(false);
      setLastSubmittedRecharge(null);
      setRechargeError('');
      setRechargeScreenshot('');
      setShowChannelDropdown(false);
      setIsDragActive(false);
      if (rechargeAccounts && rechargeAccounts.length > 0) {
        setRechargeBank(rechargeAccounts[0].bank);
      }
    }
  }, [rechargeModalOpen, rechargeAccounts]);

  // Auto-close recharge modal when success is triggered
  React.useEffect(() => {
    if (rechargeSuccess) {
      const timer = setTimeout(() => {
        setRechargeModalOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [rechargeSuccess]);

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

    if (!rechargeScreenshot) {
      setRechargeError('Please upload a screenshot of your payment receipt.');
      return;
    }

    deposit(amt, rechargeBank, rechargeRef, rechargeScreenshot);
    setLastSubmittedRecharge({ amount: amt, bank: rechargeBank, ref: rechargeRef });
    setRechargeSuccess(true);
    setRechargeRef('');
    setRechargeAmount('');
    setRechargeScreenshot('');
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
      <header className="h-14 bg-deep-forest flex items-center justify-between px-5 text-white shrink-0 shadow-md">
        <h1 className="text-base font-black tracking-widest uppercase text-white">
          GOM
        </h1>
        <div className="flex items-center">
          <button
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="bg-[#051F10] border border-emerald-800/80 text-[10px] font-black text-white rounded-xl px-3 py-1.5 cursor-pointer hover:bg-emerald-900 transition-colors shadow-inner flex items-center gap-1"
          >
            {language === 'en' ? '🇺🇸 EN' : '🇪🇹 አማ'}
          </button>
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
            <span className="text-[10px] tracking-wide font-extrabold">{t('home')}</span>
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
            <span className="text-[10px] tracking-wide font-extrabold">{t('orders')}</span>
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
            <span className="text-[10px] tracking-wide font-extrabold">{t('my')}</span>
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
              className="bg-white rounded-[28px] p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              {!rechargeSuccess && (
                <button
                  onClick={() => setRechargeModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 bg-slate-100 rounded-full cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              {rechargeSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={36} className="animate-[pulse_1s_infinite]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">{t('rechargeRequestSubmitted')}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal px-4">
                      {t('rechargeRequestSubmittedDesc')}
                    </p>
                  </div>
                  <div className="text-[10px] bg-slate-50 text-slate-400 py-1.5 px-3 rounded-full font-mono font-medium">
                    {t('payoutStatus')} {t('pendingVerification')}
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-bronze flex items-center justify-center shrink-0 border border-amber-500/10">
                      <ArrowUpRight size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 tracking-tight">{t('ethiopianBankDeposit')}</h3>
                      <p className="text-[10px] text-slate-400 font-bold">{t('officialPlatformGateways')}</p>
                    </div>
                  </div>

                  {/* Step instructions */}
                  <div className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-500/10 text-[10px] text-bronze/90 font-medium space-y-2 leading-relaxed shadow-xs">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                      <Info size={12} />
                      <span>{t('manualDepositGuideline')}</span>
                    </span>
                    <ul className="list-decimal list-inside space-y-1 text-slate-700">
                      <li>{t('step1ChooseBank')}</li>
                      <li>{t('step2CopyAccount')}</li>
                      <li>{t('step3PasteId')}</li>
                    </ul>
                  </div>

                  {/* Choose Channel Selector (Combines all bank accounts into one button dropdown) */}
                  <div className="relative">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                      {t('chooseDepositChannel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-800 font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        {rechargeBank ? <BankLogo bankName={rechargeBank} /> : (
                          <div className="w-8 h-8 rounded-xl bg-bronze/10 flex items-center justify-center text-bronze shrink-0">
                            <Coins size={14} />
                          </div>
                        )}
                        <span>{rechargeBank || t('selectBankAccount')}</span>
                      </div>
                      {showChannelDropdown ? (
                        <ChevronUp size={16} className="text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-500 shrink-0" />
                      )}
                    </button>

                    {showChannelDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto p-1.5 divide-y divide-slate-50"
                      >
                        {rechargeAccounts && rechargeAccounts.map((acc, index) => (
                          <button
                            key={acc.id || index}
                            type="button"
                            onClick={() => {
                              setRechargeBank(acc.bank);
                              setShowChannelDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                              rechargeBank === acc.bank ? 'text-bronze bg-amber-50/40' : 'text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <BankLogo bankName={acc.bank} />
                              <span>{acc.bank}</span>
                            </div>
                            {rechargeBank === acc.bank && <Check size={14} className="text-bronze shrink-0" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Active selected account details shown in a simplified layout */}
                  {rechargeAccounts && rechargeAccounts.find(acc => acc.bank === rechargeBank) && (() => {
                    const selectedAccount = rechargeAccounts.find(acc => acc.bank === rechargeBank)!;
                    return (
                      <motion.div
                        key={selectedAccount.bank}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white p-4.5 rounded-2xl border border-emerald-950/20 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <BankLogo bankName={selectedAccount.bank} />
                            <div className="space-y-0.5">
                              <span className="block text-[11px] font-black tracking-tight text-amber-400 uppercase">
                                {selectedAccount.bank}
                              </span>
                              <span className="block text-lg font-mono font-bold tracking-wider text-white select-all">
                                {selectedAccount.accNo}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedAccount.accNo);
                              alert(`${selectedAccount.bank} Account number copied: ${selectedAccount.accNo}`);
                            }}
                            className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-3 py-2 rounded-xl font-extrabold cursor-pointer active:scale-95 transition-all text-[10px] flex items-center gap-1.5 shrink-0 shadow-xs"
                          >
                            <Copy size={11} />
                            <span>Copy</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Recharge Form */}
                  <form onSubmit={handleRechargeSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                    {rechargeError && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100 flex items-center gap-2"
                      >
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{rechargeError}</span>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('amountEtb')}</label>
                        <input
                          type="number"
                          required
                          min="200"
                          placeholder={t('min200')}
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all shadow-xs"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block font-semibold">{t('minimum200Etb')}</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('transferTxidRef')}</label>
                        <input
                          type="text"
                          required
                          placeholder="FTxxxxxxxxx"
                          value={rechargeRef}
                          onChange={(e) => setRechargeRef(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all shadow-xs"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block font-semibold">{t('referenceCodeOrTxid')}</span>
                      </div>
                    </div>

                    {/* Payment Screenshot Upload */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                        {t('uploadPaymentScreenshot')}
                      </label>
                      
                      {!rechargeScreenshot ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragActive(true);
                          }}
                          onDragLeave={() => setIsDragActive(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragActive(false);
                            const files = e.dataTransfer.files;
                            if (files && files[0]) {
                              const file = files[0];
                              if (file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setRechargeScreenshot(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                alert('Please select an image file (PNG, JPG, JPEG).');
                              }
                            }
                          }}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                            isDragActive
                              ? 'border-bronze bg-amber-50/20'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300'
                          }`}
                          onClick={() => {
                            const fileInput = document.getElementById('screenshot-upload-input');
                            fileInput?.click();
                          }}
                        >
                          <input
                            type="file"
                            id="screenshot-upload-input"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                const file = files[0];
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setRechargeScreenshot(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isDragActive ? 'bg-bronze/10 text-bronze' : 'bg-slate-200/50 text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600'
                          }`}>
                            <UploadCloud size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-700">{t('dragDropReceipt')}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t('clickToBrowse')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl border border-slate-200/80 bg-white overflow-hidden shrink-0 flex items-center justify-cover shadow-xs">
                              <img src={rechargeScreenshot} alt="Uploaded Receipt Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="block text-xs font-bold text-slate-700 truncate">payment_receipt.png</span>
                              <span className="block text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                <CheckCircle2 size={10} /> {t('readyToVerify')}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRechargeScreenshot('')}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition-all cursor-pointer"
                            title="Remove screenshot"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-bronze to-bronze-hover hover:from-bronze-hover hover:to-bronze text-white font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_rgba(212,163,89,0.3)] hover:shadow-[0_6px_20px_rgba(212,163,89,0.4)] active:scale-[0.98] transition-all flex items-center justify-center text-sm gap-2 mt-2 cursor-pointer"
                    >
                      {t('submitRechargeRequest')}
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
                  <h3 className="text-sm font-black text-slate-800">{t('withdrawalPayout')}</h3>
                  <p className="text-[10px] text-slate-400">{t('withdrawalToEthiopianAccounts')}</p>
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
                    {t('withdrawalSuccessMsg')}
                  </div>
                )}

                {(() => {
                  const completedCount = currentUser.completedOrderIds ? currentUser.completedOrderIds.length : 0;
                  const isLocked = completedCount < 10;
                  return (
                    <>
                      {isLocked && (
                        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3 text-[10px] text-amber-800 leading-relaxed space-y-1">
                          <span className="font-black text-amber-900 block uppercase tracking-wider text-[9px]">⚠️ {t('withdrawalLocked')}</span>
                          <p>{t('withdrawalLockedDesc', { completedCount })}</p>
                        </div>
                      )}

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{t('availableBalanceLabel')}</span>
                        <span className="text-xs font-black text-slate-800">{currentUser.walletBalance.toLocaleString()} ETB</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('selectPayoutBank')}</label>
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
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('yourAccountNumberLabel')}</label>
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
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('withdrawAmountLabel')}</label>
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
                        {isLocked ? t('complete10TasksToWithdraw', { completedCount }) : t('submitPayoutRequest')}
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
                  <h3 className="text-sm font-black text-slate-800">{t('contactOfficialSupport')}</h3>
                  <p className="text-[10px] text-slate-400">{t('supportResponseTime')}</p>
                </div>
              </div>

              {/* Support Form */}
              <form onSubmit={handleSupportSubmit} className="space-y-3.5 pt-2">
                {supportSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold border border-emerald-100">
                    {t('supportSuccessMsg')}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('ticketSubject')}</label>
                  <select
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                  >
                    <option value="Wallet Recharge Issue">{t('rechargeIssue')}</option>
                    <option value="Withdrawal Delay / Lock">{t('subjectDelay')}</option>
                    <option value="Order Match Error">{t('orderIssue')}</option>
                    <option value="Verify CBE Transfer Receipt">{t('subjectCbe')}</option>
                    <option value="Other Technical Questions">{t('subjectTech')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('ticketMessage')}</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={t('messagePlaceholder')}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3 rounded-xl shadow transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} /> {t('sendMessageToAgent')}
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
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('installGomApp')}</h3>
                  <p className="text-[10px] text-amber-600 font-extrabold tracking-wide uppercase mt-0.5">Global Online Market</p>
                  <p className="text-[10px] text-slate-400">{t('premiumRewardPlatform')}</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] text-slate-600 leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span>{t('pwaBenefit1')}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span>{t('pwaBenefit2')}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span>{t('pwaBenefit3')}</span>
                </div>
              </div>

              {/* Conditional Install CTA or Guide */}
              {isIOS ? (
                // iOS Installation Guide
                <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-4 text-[11px] text-amber-950 space-y-2.5">
                  <div className="font-extrabold uppercase tracking-wider text-[9px] text-amber-800 flex items-center gap-1">
                    <span className="animate-pulse">📱</span> {t('iosSafariGuide')}
                  </div>
                  <div className="leading-relaxed space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">1.</span>
                      <span>{t('iosStep1')}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">2.</span>
                      <span>{t('iosStep2')}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">3.</span>
                      <span>{t('iosStep3')}</span>
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
                    <Download size={14} className="animate-bounce" /> {t('installAppBtn')}
                  </button>
                  
                  {!deferredPrompt && (
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                      {t('pwaManualGuide')}
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
                  {t('continueInBrowser')}
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
