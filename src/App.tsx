/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp, EXCHANGE_RATES } from './context/AppContext';
import { useTranslation } from './utils/translations';
import LanguageSelector from './components/LanguageSelector';
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

const COUNTRIES = [
  { code: '+251', name: 'Ethiopia (+251)', flag: '🇪🇹' },
  { code: '+254', name: 'Kenya (+254)', flag: '🇰🇪' },
  { code: '+253', name: 'Djibouti (+253)', flag: '🇩🇯' },
  { code: '+252', name: 'Somalia (+252)', flag: '🇸🇴' },
  { code: '+291', name: 'Eritrea (+291)', flag: '🇪🇷' },
  { code: '+211', name: 'South Sudan (+211)', flag: '🇸🇸' },
  { code: '+249', name: 'Sudan (+249)', flag: '🇸🇩' },
  { code: '+971', name: 'UAE (+971)', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia (+966)', flag: '🇸🇦' },
  { code: '+1', name: 'USA/Canada (+1)', flag: '🇺🇸' },
  { code: '+44', name: 'UK (+44)', flag: '🇬🇧' },
  { code: '+86', name: 'China (+86)', flag: '🇨🇳' },
  { code: '', name: 'Local / Admin', flag: '📱' },
];

interface CountryLocalMethod {
  countryCode: string;
  countryName: string;
  flag: string;
  bank: string;
  accNo: string;
  accName: string;
}

const COUNTRY_LOCAL_METHODS: CountryLocalMethod[] = [
  { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'M-Pesa (Safaricom)', accNo: 'Paybill: 254254', accName: 'GOM Kenya Agent' },
  { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'Airtel Money (Kenya)', accNo: 'Till: 112233', accName: 'GOM Kenya Agent' },
  { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'Equity Bank (Kenya)', accNo: 'Equity Till: 987654', accName: 'GOM Kenya Agent' },
  { countryCode: '+253', countryName: 'Djibouti', flag: '🇩🇯', bank: 'Waafi Cash (Djibouti)', accNo: 'Merchant: 253253', accName: 'GOM Djibouti Agent' },
  { countryCode: '+253', countryName: 'Djibouti', flag: '🇩🇯', bank: 'CAC Bank Pay', accNo: 'CAC-556677', accName: 'GOM Djibouti Agent' },
  { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'EVC Plus (Somalia)', accNo: 'Merchant: 252252', accName: 'GOM Somalia Agent' },
  { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'Zaad (Somalia)', accNo: 'Merchant: 998877', accName: 'GOM Somalia Agent' },
  { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'Premier Bank (Somalia)', accNo: 'Premier-112233', accName: 'GOM Somalia Agent' },
  { countryCode: '+291', countryName: 'Eritrea', flag: '🇪🇷', bank: 'Nakfa Mobile Money', accNo: 'N-887766', accName: 'GOM Eritrea Agent' },
  { countryCode: '+291', countryName: 'Eritrea', flag: '🇪🇷', bank: 'Himbol Financial Services', accNo: 'H-554433', accName: 'GOM Eritrea Agent' },
  { countryCode: '+211', countryName: 'South Sudan', flag: '🇸🇸', bank: 'm-Gurush (South Sudan)', accNo: 'Merchant: 211211', accName: 'GOM South Sudan Agent' },
  { countryCode: '+211', countryName: 'South Sudan', flag: '🇸🇸', bank: 'NilePay Mobile Money', accNo: 'Merchant: 445566', accName: 'GOM South Sudan Agent' },
  { countryCode: '+249', countryName: 'Sudan', flag: '🇸🇩', bank: 'Bank of Khartoum (BOK)', accNo: 'BOK-Sudan-223344', accName: 'GOM Sudan Agent' },
  { countryCode: '+249', countryName: 'Sudan', flag: '🇸🇩', bank: 'Sygpay Mobile Wallet', accNo: 'Syg-667788', accName: 'GOM Sudan Agent' },
  { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'e& money (UAE)', accNo: 'Wallet: 971971', accName: 'GOM UAE Agent' },
  { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'STC Pay UAE', accNo: 'Wallet: 556677', accName: 'GOM UAE Agent' },
  { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'Careem Pay (UAE)', accNo: 'Careem-334455', accName: 'GOM UAE Agent' },
  { countryCode: '+966', countryName: 'Saudi Arabia', flag: '🇸🇦', bank: 'STC Pay (KSA)', accNo: 'Wallet: 966966', accName: 'GOM KSA Agent' },
  { countryCode: '+966', countryName: 'Saudi Arabia', flag: '🇸🇦', bank: 'Urpay (KSA)', accNo: 'Ur-778899', accName: 'GOM KSA Agent' },
  { countryCode: '+966', countryName: 'Saudi Arabia', flag: '🇸🇦', bank: 'Al Rajhi Bank (KSA)', accNo: 'Rajhi-334422', accName: 'GOM KSA Agent' },
  { countryCode: '+1', countryName: 'USA/Canada', flag: '🇺🇸', bank: 'Zelle Transfer', accNo: 'zelle@gom-agent.com', accName: 'GOM North America LLC' },
  { countryCode: '+1', countryName: 'USA/Canada', flag: '🇺🇸', bank: 'Venmo Payment', accNo: '@gom-agent-pay', accName: 'GOM North America LLC' },
  { countryCode: '+1', countryName: 'USA/Canada', flag: '🇺🇸', bank: 'Cash App', accNo: '$gomagentpay', accName: 'GOM North America LLC' },
  { countryCode: '+44', countryName: 'UK', flag: '🇬🇧', bank: 'Revolut Pay', accNo: 'revolut@gom-agent.co.uk', accName: 'GOM UK Ltd' },
  { countryCode: '+44', countryName: 'UK', flag: '🇬🇧', bank: 'Faster Payments (UK)', accNo: 'Sort: 04-00-04, Acc: 98765432', accName: 'GOM UK Ltd' },
  { countryCode: '+44', countryName: 'UK', flag: '🇬🇧', bank: 'Monzo Bank Pay', accNo: 'Sort: 04-00-04, Acc: 11223344', accName: 'GOM UK Ltd' },
  { countryCode: '+86', countryName: 'China', flag: '🇨🇳', bank: 'Alipay (支付宝)', accNo: 'alipay@gom-agent.cn', accName: 'GOM China Agent' },
  { countryCode: '+86', countryName: 'China', flag: '🇨🇳', bank: 'WeChat Pay (微信支付)', accNo: 'wechat@gom-agent.cn', accName: 'GOM China Agent' },
];

const getUserCountry = (phone?: string) => {
  if (!phone) return null;
  const trimmed = phone.trim();
  for (const c of COUNTRIES) {
    if (c.code && (trimmed.startsWith(c.code) || trimmed.startsWith(c.code.replace('+', '')))) {
      return c;
    }
  }
  if (trimmed.startsWith('09') || trimmed.startsWith('07') || trimmed.startsWith('9') || trimmed.startsWith('7')) {
    return { code: '+251', name: 'Ethiopia (+251)', flag: '🇪🇹' };
  }
  return null;
};

type UserTab = 'home' | 'orders' | 'my';

function AppContent() {
  const { currentUser, deposit, withdraw, addSupportTicket, rechargeAccounts, language, setLanguage, currency, setCurrency, formatPrice } = useApp();
  const { t } = useTranslation(language);

  const isEthiopianUser = currentUser && (
    currentUser.phoneNumber?.trim().startsWith('+251') || 
    currentUser.phoneNumber?.trim().startsWith('251') || 
    (!currentUser.phoneNumber?.trim().startsWith('+') && (
      currentUser.phoneNumber?.trim().startsWith('09') || 
      currentUser.phoneNumber?.trim().startsWith('07') || 
      currentUser.phoneNumber?.trim().startsWith('9') || 
      currentUser.phoneNumber?.trim().startsWith('7')
    ))
  );

  const isEth = isEthiopianUser || currency === 'ETB';

  const INT_WITHDRAW_METHODS = [
    'Mastercard',
    'PayPal',
    'Binance (USDT)',
    'Visa Card'
  ];

  const INT_RECHARGE_METHODS = [
    { bank: 'Mastercard', accNo: 'N/A', accName: 'International Card' },
    { bank: 'PayPal', accNo: 'N/A', accName: 'International Wallet' },
    { bank: 'Binance Pay (USDT)', accNo: 'N/A', accName: 'Binance Smart Chain' },
    { bank: 'Visa Card', accNo: 'N/A', accName: 'International Card' }
  ];

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
      if (isEth) {
        if (rechargeAccounts && rechargeAccounts.length > 0) {
          setRechargeBank(rechargeAccounts[0].bank);
        } else {
          setRechargeBank('Commercial Bank of Ethiopia (CBE)');
        }
      } else {
        setRechargeBank('Mastercard');
      }
    }
  }, [rechargeModalOpen, rechargeAccounts, isEth]);

  // Reset withdrawal success state and set default bank on modal open
  React.useEffect(() => {
    if (withdrawModalOpen) {
      setWithdrawError('');
      setWithdrawSuccess(false);
      setLastWithdrawInfo(null);
      if (isEth) {
        setWithdrawBank('Commercial Bank of Ethiopia (CBE)');
      } else {
        setWithdrawBank('Mastercard');
      }
    }
  }, [withdrawModalOpen, isEth]);

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
  const [lastWithdrawInfo, setLastWithdrawInfo] = useState<{ amount: number; bank: string; accNo: string } | null>(null);

  const [supportSubject, setSupportSubject] = useState('Wallet Recharge Issue');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Sync prefill amount when changes occur
  React.useEffect(() => {
    if (prefillRechargeAmount > 0) {
      const rate = EXCHANGE_RATES[currency] || 1;
      const val = (prefillRechargeAmount / rate).toFixed(2);
      setRechargeAmount(val);
    } else {
      setRechargeAmount('');
    }
  }, [prefillRechargeAmount, currency]);

  // Ethiopian banks list
  const ETH_BANKS = [
    'Commercial Bank of Ethiopia (CBE)',
    'Telebirr',
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

    // Validate if selected method is a local method of another country and user is from Ethiopia
    const matchedOtherCountryMethod = COUNTRY_LOCAL_METHODS.find(m => m.bank === rechargeBank);
    if (matchedOtherCountryMethod) {
      if (isEth) {
        setRechargeError('This local payment method is unavailable for users in Ethiopia. Ethiopia has its own local methods (CBE/Telebirr).');
        return;
      }
      const userCountry = getUserCountry(currentUser?.phoneNumber);
      if (userCountry?.code !== matchedOtherCountryMethod.countryCode) {
        setRechargeError(`This payment method is restricted to users in ${matchedOtherCountryMethod.countryName}.`);
        return;
      }
    }

    // Validate if non-Ethiopian is selecting Ethiopian local accounts
    const isEthBank = rechargeAccounts && rechargeAccounts.some(acc => acc.bank === rechargeBank);
    if (isEthBank && !isEth) {
      setRechargeError('Ethiopian local bank options are only available to users in Ethiopia.');
      return;
    }

    const isIntMethod = ['Mastercard', 'PayPal', 'Binance Pay (USDT)', 'Visa Card'].includes(rechargeBank);
    if (isEth && isIntMethod) {
      setRechargeError('This payment method is unavailable for users in Ethiopia.');
      return;
    }

    const inputAmt = Number(rechargeAmount);
    if (isNaN(inputAmt) || inputAmt <= 0) {
      setRechargeError('Please enter a valid amount.');
      return;
    }

    const baseAmt = currency === 'USD' ? inputAmt * 196 : inputAmt;
    if (baseAmt < 200) {
      setRechargeError(currency === 'USD'
        ? 'The minimum recharge amount is $1.02 (200 ETB).'
        : 'The minimum recharge amount is 200 ETB.'
      );
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

    deposit(baseAmt, rechargeBank, rechargeRef, rechargeScreenshot);
    setLastSubmittedRecharge({ amount: baseAmt, bank: rechargeBank, ref: rechargeRef });
    setRechargeSuccess(true);
    setRechargeRef('');
    setRechargeAmount('');
    setRechargeScreenshot('');
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess(false);

    // Validate if selected method is a local method of another country and user is from Ethiopia
    const matchedOtherCountryMethod = COUNTRY_LOCAL_METHODS.find(m => m.bank === withdrawBank);
    if (matchedOtherCountryMethod) {
      if (isEth) {
        setWithdrawError('This local payout method is unavailable for users in Ethiopia. Ethiopia has its own local methods (CBE/Telebirr).');
        return;
      }
      const userCountry = getUserCountry(currentUser?.phoneNumber);
      if (userCountry?.code !== matchedOtherCountryMethod.countryCode) {
        setWithdrawError(`This payout method is restricted to users in ${matchedOtherCountryMethod.countryName}.`);
        return;
      }
    }

    // Validate if non-Ethiopian is selecting Ethiopian banks
    if (ETH_BANKS.includes(withdrawBank) && !isEth) {
      setWithdrawError('Ethiopian bank payouts are only available for users registered in Ethiopia.');
      return;
    }

    const isIntMethod = INT_WITHDRAW_METHODS.includes(withdrawBank);
    if (isEth && isIntMethod) {
      setWithdrawError('This withdrawal method is unavailable for users in Ethiopia.');
      return;
    }

    const inputAmt = Number(withdrawAmount);
    if (isNaN(inputAmt) || inputAmt <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }

    const baseAmt = currency === 'USD' ? inputAmt * 196 : inputAmt;
    if (baseAmt < 200) {
      setWithdrawError(currency === 'USD'
        ? 'The minimum withdrawal amount is $1.02 (200 ETB).'
        : 'The minimum withdrawal amount is 200 ETB.'
      );
      return;
    }

    const isTelebirr = withdrawBank.toLowerCase().includes('telebirr');
    const maxWithdraw = isTelebirr ? 75000 : 300000;
    if (baseAmt > maxWithdraw) {
      setWithdrawError(`The maximum withdrawal amount for ${withdrawBank} is ${formatPrice(maxWithdraw)}.`);
      return;
    }

    if (baseAmt > currentUser.walletBalance) {
      setWithdrawError(`Insufficient balance. Maximum withdrawable is ${formatPrice(currentUser.walletBalance)}.`);
      return;
    }

    if (!withdrawAccNo.trim()) {
      setWithdrawError('Please enter your secure bank account number.');
      return;
    }

    const res = await withdraw(baseAmt, withdrawBank, withdrawAccNo);
    if (res.success) {
      setLastWithdrawInfo({ amount: baseAmt, bank: withdrawBank, accNo: withdrawAccNo });
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setWithdrawAccNo('');
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrency(currency === 'ETB' ? 'USD' : 'ETB')}
            className="bg-[#051F10] border border-emerald-800/80 text-[10px] font-black text-white rounded-xl px-3 py-1.5 cursor-pointer hover:bg-emerald-900 transition-colors shadow-inner flex items-center gap-1"
          >
            🪙 {currency}
          </button>
          <LanguageSelector />
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
                        className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-1.5 space-y-2.5"
                      >
                        {/* LOCAL METHODS GROUP */}
                        <div className="space-y-1">
                          <div className="px-2.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg">
                            📍 Local Payment Methods
                          </div>
                          
                          {/* Ethiopia Local Accounts */}
                          {rechargeAccounts && rechargeAccounts.map((acc, index) => {
                            const isAvailable = isEth;
                            return (
                              <button
                                key={`eth-local-${acc.id || index}`}
                                type="button"
                                onClick={() => {
                                  if (!isAvailable) {
                                    alert('Ethiopian local accounts are only available to users in Ethiopia.');
                                    return;
                                  }
                                  setRechargeBank(acc.bank);
                                  setShowChannelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                  rechargeBank === acc.bank ? 'text-bronze bg-amber-50/40 font-black' : 'text-slate-600'
                                } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>🇪🇹 {acc.bank}</span>
                                  {!isAvailable && (
                                    <span className="text-[7px] font-extrabold bg-red-50 text-red-600 border border-red-200/50 px-1 py-0.5 rounded">
                                      Restricted
                                    </span>
                                  )}
                                </div>
                                {rechargeBank === acc.bank && <Check size={13} className="text-bronze shrink-0" />}
                              </button>
                            );
                          })}

                          {/* Other Country Local Accounts */}
                          {COUNTRY_LOCAL_METHODS.map((method, index) => {
                            const userCountry = getUserCountry(currentUser?.phoneNumber);
                            const isAvailable = userCountry?.code === method.countryCode;
                            const isUnavailableForEth = isEth;

                            return (
                              <button
                                key={`other-local-${index}`}
                                type="button"
                                onClick={() => {
                                  if (isEth) {
                                    alert('Unavailable for Ethiopia. Ethiopia has its own local payment methods (CBE/Telebirr).');
                                    return;
                                  }
                                  if (!isAvailable) {
                                    alert(`This method is restricted to users in ${method.countryName}.`);
                                    return;
                                  }
                                  setRechargeBank(method.bank);
                                  setShowChannelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                  rechargeBank === method.bank ? 'text-bronze bg-amber-50/40 font-black' : 'text-slate-600'
                                } ${isUnavailableForEth || !isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{method.flag} {method.bank}</span>
                                  {isUnavailableForEth ? (
                                    <span className="text-[7px] font-extrabold bg-red-50 text-red-600 border border-red-200/50 px-1 py-0.5 rounded">
                                      Unavailable for Ethiopia
                                    </span>
                                  ) : !isAvailable ? (
                                    <span className="text-[7px] font-extrabold bg-slate-50 text-slate-500 border border-slate-200/50 px-1 py-0.5 rounded">
                                      Restricted
                                    </span>
                                  ) : (
                                    <span className="text-[7px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200/50 px-1 py-0.5 rounded">
                                      Local
                                    </span>
                                  )}
                                </div>
                                {rechargeBank === method.bank && <Check size={13} className="text-bronze shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* INTERNATIONAL METHODS GROUP */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                          <div className="px-2.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg">
                            🌐 International Payment Methods
                          </div>
                          {INT_RECHARGE_METHODS.map((method, index) => {
                            const isAvailable = !isEth;
                            return (
                              <button
                                key={`int-${index}`}
                                type="button"
                                onClick={() => {
                                  if (!isAvailable) {
                                    alert('International payment methods are unavailable for users in Ethiopia. Ethiopia has its own local payment options (CBE/Telebirr).');
                                    return;
                                  }
                                  setRechargeBank(method.bank);
                                  setShowChannelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                  rechargeBank === method.bank ? 'text-bronze bg-amber-50/40 font-black' : 'text-slate-600'
                                } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>💳 {method.bank}</span>
                                  {!isAvailable && (
                                    <span className="text-[7px] font-extrabold bg-red-50 text-red-600 border border-red-200/50 px-1 py-0.5 rounded">
                                      Unavailable for Ethiopia
                                    </span>
                                  )}
                                </div>
                                {rechargeBank === method.bank && <Check size={13} className="text-bronze shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
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

                  {/* Active selected international method details */}
                  {INT_RECHARGE_METHODS.some(method => method.bank === rechargeBank) && (() => {
                    const selectedMethod = INT_RECHARGE_METHODS.find(method => method.bank === rechargeBank)!;
                    return (
                      <motion.div
                        key={selectedMethod.bank}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border ${
                          isEth 
                            ? 'bg-red-50/75 border-red-200/80 text-red-950' 
                            : 'bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white border-emerald-950/20'
                        } shadow-sm relative overflow-hidden`}
                      >
                        {isEth ? (
                          <div className="space-y-1">
                            <span className="block text-[11px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
                              ⚠️ {selectedMethod.bank} Unavailable
                            </span>
                            <p className="text-[10px] text-red-800 leading-relaxed font-semibold">
                              This payment method is unavailable for users in Ethiopia. Please select local payment options like Commercial Bank of Ethiopia (CBE) or Telebirr.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="block text-[11px] font-black tracking-tight text-amber-400 uppercase">
                              🌐 {selectedMethod.bank} Gateway
                            </span>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-bold">
                              {selectedMethod.bank === 'Binance Pay (USDT)' 
                                ? 'Transfer USDT directly to USDT-TRC20 Wallet Address. Verification is automated.' 
                                : `Process via international merchant invoice. Enter your desired deposit amount below.`}
                            </p>
                            
                            {selectedMethod.bank === 'Binance Pay (USDT)' && (
                              <div className="flex justify-between items-center gap-4 mt-2.5 pt-2 border-t border-white/5">
                                <div className="space-y-0.5">
                                  <span className="block text-[8px] uppercase font-bold text-slate-400">USDT Address</span>
                                  <span className="block text-xs font-mono font-bold text-amber-300 select-all">TQ7xM8yJ2r9zPqN1vK5eW4sT3dG6hB8vX2a</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('TQ7xM8yJ2r9zPqN1vK5eW4sT3dG6hB8vX2a');
                                    alert('USDT-TRC20 address copied!');
                                  }}
                                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded-lg font-bold cursor-pointer transition-all text-[9px] flex items-center gap-1 shrink-0"
                                >
                                  <Copy size={10} />
                                  <span>Copy</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}

                  {/* Active selected other country local method details */}
                  {COUNTRY_LOCAL_METHODS.some(method => method.bank === rechargeBank) && (() => {
                    const selectedMethod = COUNTRY_LOCAL_METHODS.find(method => method.bank === rechargeBank)!;
                    const userCountry = getUserCountry(currentUser?.phoneNumber);
                    const isAvailable = userCountry?.code === selectedMethod.countryCode;
                    const isUnavailableForEth = isEth;

                    return (
                      <motion.div
                        key={selectedMethod.bank}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border ${
                          isUnavailableForEth
                            ? 'bg-red-50/75 border-red-200/80 text-red-950'
                            : !isAvailable
                            ? 'bg-slate-50 border-slate-200 text-slate-800'
                            : 'bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white border-emerald-950/20 shadow-lg'
                        } relative overflow-hidden`}
                      >
                        {isUnavailableForEth ? (
                          <div className="space-y-1">
                            <span className="block text-[11px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
                              ⚠️ {selectedMethod.bank} Unavailable
                            </span>
                            <p className="text-[10px] text-red-800 leading-relaxed font-semibold font-mono">
                              Unavailable for Ethiopia. Ethiopia has its own local method.
                            </p>
                          </div>
                        ) : !isAvailable ? (
                          <div className="space-y-1">
                            <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                              ⚠️ {selectedMethod.bank} Restricted
                            </span>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                              This local method is restricted to users in {selectedMethod.countryName}. Please select your own country's local method or an international payment option.
                            </p>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center gap-4">
                            <div className="space-y-1 flex-1">
                              <span className="block text-[11px] font-black tracking-tight text-amber-400 uppercase">
                                {selectedMethod.flag} {selectedMethod.bank} (Local Agent)
                              </span>
                              <div className="space-y-0.5">
                                <span className="block text-[8px] uppercase text-slate-400 font-bold">Transfer Account / Details</span>
                                <span className="block text-sm font-mono font-bold text-white select-all">
                                  {selectedMethod.accNo}
                                </span>
                              </div>
                              <span className="block text-[9px] text-slate-300 font-medium mt-1">
                                Beneficiary: {selectedMethod.accName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedMethod.accNo);
                                alert(`${selectedMethod.bank} transfer details copied: ${selectedMethod.accNo}`);
                              }}
                              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-3 py-2 rounded-xl font-bold cursor-pointer transition-all text-[10px] flex items-center gap-1 shrink-0"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                          </div>
                        )}
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
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                          {currency === 'USD' ? 'Amount (USD)' : t('amountEtb')}
                        </label>
                        <input
                          type="number"
                          required
                          step="any"
                          min={currency === 'USD' ? "1.02" : "200"}
                          placeholder={currency === 'USD' ? "Min $1.02" : t('min200')}
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all shadow-xs"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block font-semibold">
                          {currency === 'USD' ? 'Min: $1.02 USD (200 ETB)' : t('minimum200Etb')}
                        </span>
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

              {withdrawSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                    className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"
                  >
                    <CheckCircle2 size={36} className="text-emerald-600 animate-pulse" />
                  </motion.div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-800">
                      {t('withdrawalSuccessTitle')}
                    </h3>
                    <p className="text-[11px] text-slate-500 px-4">
                      {t('withdrawalSuccessMsg')}
                    </p>
                  </div>

                  {lastWithdrawInfo && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 max-w-xs mx-auto">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{t('amountLabel')}</span>
                        <span className="text-sm font-black text-emerald-600">
                          {lastWithdrawInfo.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">{t('bankLabel')}</span>
                        <span className="text-slate-700 font-extrabold text-right max-w-[150px] truncate">{lastWithdrawInfo.bank}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">{t('accountNoLabelShort')}</span>
                        <span className="text-slate-700 font-mono font-bold">{lastWithdrawInfo.accNo}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">{t('statusLabel')}</span>
                        <span className="bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                          {t('pendingApproval')}
                        </span>
                      </div>
                      <div className="pt-1 text-[9px] text-slate-400 text-center italic">
                        {t('payout24hNotice')}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setWithdrawSuccess(false);
                      setWithdrawModalOpen(false);
                      setLastWithdrawInfo(null);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow cursor-pointer mt-2"
                  >
                    {t('done')}
                  </button>
                </div>
              ) : (
                <>
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

                    {(() => {
                      const completedCount = currentUser.completedOrderIds ? currentUser.completedOrderIds.length : 0;
                      const isLocked = completedCount < 15;
                      return (
                        <>
                          {isLocked && (
                            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3 text-[10px] text-amber-800 leading-relaxed space-y-1">
                              <span className="font-black text-amber-900 block uppercase tracking-wider text-[9px]">⚠️ {t('withdrawalLocked')}</span>
                              <p>{t('withdrawalLockedDesc', { completedCount })}</p>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('selectPayoutBank')}</label>
                            <select
                              value={withdrawBank}
                              disabled={isLocked}
                              onChange={(e) => setWithdrawBank(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                            >
                              <optgroup label="📍 Local Payment Methods">
                                {/* First show Ethiopian banks if user is Eth, or tag them as restricted otherwise */}
                                {ETH_BANKS.map((bank, index) => (
                                  <option key={`eth-${index}`} value={bank}>
                                    🇪🇹 {bank} {!isEth ? '(Unavailable for your region)' : ''}
                                  </option>
                                ))}
                                {/* Next show other countries' local methods */}
                                {COUNTRY_LOCAL_METHODS.map((method, index) => {
                                  const userCountry = getUserCountry(currentUser?.phoneNumber);
                                  const isAvailable = userCountry?.code === method.countryCode;
                                  return (
                                    <option key={`other-local-${index}`} value={method.bank}>
                                      {method.flag} {method.bank} {isEth ? '(Unavailable for Ethiopia)' : !isAvailable ? '(Unavailable for your region)' : '(Local)'}
                                    </option>
                                  );
                                })}
                              </optgroup>
                              <optgroup label="🌐 International / Crypto Methods">
                                {INT_WITHDRAW_METHODS.map((bank, index) => (
                                  <option key={`int-${index}`} value={bank}>
                                    💳 {bank} {isEth ? '(Unavailable for Ethiopia)' : ''}
                                  </option>
                                ))}
                              </optgroup>
                            </select>

                            {INT_WITHDRAW_METHODS.includes(withdrawBank) && isEth && (
                              <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                ⚠️ This withdrawal method is unavailable for users in Ethiopia. Please select local options like Commercial Bank of Ethiopia (CBE) or Telebirr.
                              </div>
                            )}

                            {INT_WITHDRAW_METHODS.includes(withdrawBank) && !isEth && (
                              <div className="mt-1.5 p-2 bg-emerald-50 text-emerald-800 text-[9px] font-bold rounded-xl border border-emerald-100 leading-normal">
                                🌐 Processing international payout via {withdrawBank}. Processing timeframe is 24 hours.
                              </div>
                            )}

                            {/* If selected is a local bank for another country and user is from Ethiopia */}
                            {COUNTRY_LOCAL_METHODS.some(m => m.bank === withdrawBank) && isEth && (
                              <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                ⚠️ This local payout method is unavailable for users in Ethiopia. Ethiopia has its own local methods (CBE/Telebirr). Please select an Ethiopian Bank option.
                              </div>
                            )}

                            {/* If selected is a local bank for another country and user is from a different non-matching country */}
                            {(() => {
                              const method = COUNTRY_LOCAL_METHODS.find(m => m.bank === withdrawBank);
                              if (method && !isEth) {
                                const userCountry = getUserCountry(currentUser?.phoneNumber);
                                const isAvailable = userCountry?.code === method.countryCode;
                                if (!isAvailable) {
                                  return (
                                    <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                      ⚠️ This method is restricted to users in {method.countryName}. Please select local methods for your region or international options.
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="mt-1.5 p-2 bg-emerald-50 text-emerald-800 text-[9px] font-bold rounded-xl border border-emerald-100 leading-normal">
                                      📍 Processing local payout to your {method.bank} account. Processing timeframe is 24 hours.
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}

                            {/* If selected is an Ethiopian bank but user is from outside Ethiopia */}
                            {ETH_BANKS.includes(withdrawBank) && !isEth && (
                              <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                ⚠️ Ethiopian Bank payouts are only available for users registered in Ethiopia. Please select your own country's local method or international options.
                              </div>
                            )}
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
                                min={currency === 'USD' ? "1.02" : "200"}
                                max={currency === 'USD' 
                                  ? (withdrawBank.toLowerCase().includes('telebirr') ? (75000 / 196).toFixed(2) : (300000 / 196).toFixed(2)) 
                                  : (withdrawBank.toLowerCase().includes('telebirr') ? "75000" : "300000")
                                }
                                disabled={isLocked}
                                placeholder={currency === 'USD' 
                                  ? `Min 1.02 - Max ${(withdrawBank.toLowerCase().includes('telebirr') ? 75000 / 196 : 300000 / 196).toFixed(1)}` 
                                  : (withdrawBank.toLowerCase().includes('telebirr') ? "Min 200 - Max 75k" : "Min 200 - Max 300k")
                                }
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                              />
                              <span className="text-[9px] text-slate-400 mt-1 block leading-normal">
                                {currency === 'USD' 
                                  ? `Min: $1.02 | Max: $${(withdrawBank.toLowerCase().includes('telebirr') ? 75000 / 196 : 300000 / 196).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`
                                  : `Min: 200 | Max: ${withdrawBank.toLowerCase().includes('telebirr') ? "75,000" : "300,000"} ETB`
                                }
                              </span>
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
                </>
              )}
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
                  <p className="text-[10px] text-amber-600 font-extrabold tracking-wide uppercase mt-0.5">GOM</p>
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
