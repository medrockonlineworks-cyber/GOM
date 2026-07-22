/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation, formatUserPhoneId } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  Gift, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Volume2, 
  ChevronRight, 
  Clock, 
  Coins, 
  ShieldAlert, 
  ChevronLeft,
  Calendar,
  Info,
  Send,
  Users,
  X,
  Copy,
  Check,
  Globe,
  Sparkles,
  Ticket,
  Award
} from 'lucide-react';

const MarketplaceLogoCell: React.FC<{ src: string; alt: string; brandKey: string }> = ({ src, alt, brandKey }) => {
  const [hasError, setHasError] = useState(false);

  // If the image failed to load or the URL is empty/non-existent, show a highly polished CSS fallback
  if (hasError || !src) {
    switch (brandKey) {
      case 'amazon':
        return (
          <div className="flex flex-col items-center justify-center select-none py-1">
            <span className="font-extrabold text-[13px] text-slate-800 tracking-tight leading-none">
              amazon<span className="text-amber-500 font-black">.</span>
            </span>
            <div className="w-9 h-0.5 bg-amber-500 rounded-full mt-0.5"></div>
          </div>
        );
      case 'walmart':
        return (
          <div className="flex items-center justify-center gap-0.5 select-none font-black text-[13px] text-[#0071dc] tracking-tight py-1">
            <span>Walmart</span>
            <span className="text-amber-400 text-[9px] font-black leading-none">✳</span>
          </div>
        );
      case 'alibaba':
        return (
          <div className="flex items-center justify-center select-none py-1">
            <span className="font-black text-[12px] text-[#ff6a00] tracking-tight">
              Alibaba<span className="text-slate-500 font-bold">.com</span>
            </span>
          </div>
        );
      case 'shopify':
        return (
          <div className="flex items-center justify-center select-none py-1">
            <span className="font-black text-[13px] text-[#96bf48] tracking-tight">
              shopify
            </span>
          </div>
        );
      case 'airbnb':
        return (
          <div className="flex items-center justify-center select-none py-1">
            <span className="font-black text-[13px] text-[#FF5A5F] tracking-tight">
              airbnb
            </span>
          </div>
        );
      default:
        return (
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{alt}</span>
        );
    }
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

const generateRandomWithdrawal = () => {
  const countryFormats = [
    // Ethiopia
    () => {
      const prefixes = ['910', '911', '912', '913', '914', '915', '916', '918', '920', '921', '922', '930', '960', '707', '708', '710', '711', '712', '790'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+251 ${prefix}****${suffix}`;
    },
    // USA/Canada
    () => {
      const prefixes = ['213', '646', '312', '415', '718', '305', '206'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+1 (${prefix}) ****-${suffix}`;
    },
    // UK
    () => {
      const prefix = '79' + Math.floor(10 + Math.random() * 90);
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+44 ${prefix}****${suffix}`;
    },
    // UAE
    () => {
      const prefixes = ['50', '52', '55', '56'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+971 ${prefix}****${suffix}`;
    },
    // Kenya
    () => {
      const prefixes = ['71', '72', '74', '79'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+254 ${prefix}****${suffix}`;
    },
    // Nigeria
    () => {
      const prefixes = ['803', '805', '812', '905'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+234 ${prefix}****${suffix}`;
    },
    // Saudi Arabia
    () => {
      const prefixes = ['50', '53', '55', '59'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+966 ${prefix}****${suffix}`;
    },
    // South Africa
    () => {
      const prefixes = ['72', '82', '73', '83'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+27 ${prefix}****${suffix}`;
    },
    // India
    () => {
      const prefixes = ['98', '99', '88', '77', '91'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(10 + Math.random() * 90);
      return `+91 ${prefix}****${suffix}`;
    }
  ];

  const randomFormat = countryFormats[Math.floor(Math.random() * countryFormats.length)];
  const phone = randomFormat();
  
  const amounts = [
    20000, 22500, 25000, 28400, 32000, 35000, 42000, 48500, 55000, 68000, 75000,
    82000, 95000, 112000, 125000, 138400, 150000, 168000, 185000, 210000, 225000,
    245000, 268000, 285000, 300000
  ];
  const amount = amounts[Math.floor(Math.random() * amounts.length)];
  return { phone, amount };
};

export const TELEGRAM_COUNTRIES = [
  { country: 'China', flag: '🇨🇳', prefix: '+86', code: '86', channel: 'GOM_China', support: 'GOM_China_Support' },
  { country: 'Djibouti', flag: '🇩🇯', prefix: '+253', code: '253', channel: 'GOM_Djibouti', support: 'GOM_Djibouti_Support' },
  { country: 'Ethiopia', flag: '🇪🇹', prefix: '+251', code: '251', channel: 'GOM_Ethiopia_Official', support: 'gom_support_et' },
  { country: 'Kenya', flag: '🇰🇪', prefix: '+254', code: '254', channel: 'GOM_Kenya', support: 'GOM_Kenya_Support' },
  { country: 'Nigeria', flag: '🇳🇬', prefix: '+234', code: '234', channel: 'GOM_Nigeria', support: 'GOM_Nigeria_Support' },
  { country: 'Saudi Arabia', flag: '🇸🇦', prefix: '+966', code: '966', channel: 'GOM_Saudi_Arabia', support: 'GOM_Saudi_Arabia_Support' },
  { country: 'Somalia', flag: '🇸🇴', prefix: '+252', code: '252', channel: 'GOM_Somalia', support: 'GOM_Somalia_Support' },
  { country: 'South Sudan', flag: '🇸🇸', prefix: '+211', code: '211', channel: 'GOM_South_Sudan', support: 'GOM_South_Sudan_Support' },
  { country: 'Sudan', flag: '🇸🇩', prefix: '+249', code: '249', channel: 'GOM_Sudan', support: 'GOM_Sudan_Support' },
  { country: 'UAE', flag: '🇦🇪', prefix: '+971', code: '971', channel: 'GOM_UAE', support: 'GOM_UAE_Support' },
  { country: 'UK', flag: '🇬🇧', prefix: '+44', code: '44', channel: 'GOM_UK', support: 'GOM_UK_Support' },
  { country: 'USA/Canada', flag: '🇺🇸', prefix: '+1', code: '1', channel: 'GOM_US_Canada', support: 'GOM_US_Canada_Support' }
];

interface HomeTabProps {
  onNavigateToOrders: () => void;
  onOpenRechargeModal: () => void;
  onOpenWithdrawModal: () => void;
  onOpenSupportModal: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ 
  onNavigateToOrders, 
  onOpenRechargeModal, 
  onOpenWithdrawModal, 
  onOpenSupportModal 
}) => {
  const { 
    currentUser, 
    announcements, 
    orders, 
    language, 
    users, 
    marketplaceLogos, 
    formatPrice, 
    currency,
    redeemGiftCode,
    transactions
  } = useApp();
  const { t } = useTranslation(language);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [ticker, setTicker] = useState(() => generateRandomWithdrawal());

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(generateRandomWithdrawal());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Local modals state
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [giftStatusMsg, setGiftStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activeGiftTab, setActiveGiftTab] = useState<'redeem' | 'history'>('redeem');

  const [copiedField, setCopiedField] = useState<'none' | 'code' | 'link'>('none');
  const [telegramCountryIndex, setTelegramCountryIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [copiedTelegramName, setCopiedTelegramName] = useState<string | null>(null);

  const handleRedeemCode = async () => {
    if (!giftCodeInput.trim()) return;
    setIsRedeeming(true);
    setGiftStatusMsg(null);
    try {
      const res = await redeemGiftCode(giftCodeInput);
      if (res.success) {
        setGiftStatusMsg({ type: 'success', text: res.message });
        setGiftCodeInput('');
      } else {
        setGiftStatusMsg({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setGiftStatusMsg({ type: 'error', text: e.message || 'Error redeeming gift code.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Sync active country index with user's phone on opening
  useEffect(() => {
    if (isTelegramOpen && currentUser) {
      const phone = String(currentUser.phoneNumber || '');
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      let matchedIndex = 0;
      for (let i = 0; i < TELEGRAM_COUNTRIES.length; i++) {
        const tc = TELEGRAM_COUNTRIES[i];
        if (cleanPhone.startsWith(tc.prefix) || cleanPhone.startsWith(tc.code)) {
          matchedIndex = i;
          break;
        }
      }
      setTelegramCountryIndex(matchedIndex);
    }
  }, [isTelegramOpen, currentUser]);

  if (!currentUser) return null;

  // Calculate order progress
  const completedCount = currentUser.completedOrderIds.length;
  const progressPercent = Math.min(100, (completedCount / 15) * 100);

  // Active Order info
  const activeOrder = orders.find(o => o.status === 'available' || o.status === 'in_cart');

  const handleNextAnnouncement = () => {
    setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrevAnnouncement = () => {
    setAnnouncementIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const copyInviteCode = () => {
    const code = currentUser.inviteCode || `GOM${String(currentUser.phoneNumber || currentUser.id || '').slice(-5)}`;
    navigator.clipboard.writeText(code);
    setCopiedField('code');
    setTimeout(() => setCopiedField('none'), 2000);
  };

  const copyInviteLink = () => {
    const code = currentUser.inviteCode || `GOM${String(currentUser.phoneNumber || currentUser.id || '').slice(-5)}`;
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedField('link');
    setTimeout(() => setCopiedField('none'), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-5 bg-alabaster">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200/50">
            <span className="text-bronze font-black text-xs">
              {String(currentUser.phoneNumber || currentUser.id || '').slice(-2)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('welcome')},</span>
            <span className="block text-xs font-black text-slate-800">{formatUserPhoneId(currentUser.phoneNumber)}</span>
          </div>
        </div>
      </div>

      {/* PREMIUM FINTECH GRADIENT WALLET CARD */}
      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-deep-forest to-deep-forest-light text-white rounded-3xl p-6 shadow-lg relative overflow-hidden border border-bronze/10"
      >
        <div className="py-2">
          <p className="text-[10px] opacity-80 uppercase font-black tracking-widest text-amber-400">{t('walletBalance')}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-black tracking-tight text-white">
              {formatPrice(currentUser.walletBalance, { showUnit: false })}
            </span>
            <span className="text-sm font-bold text-amber-400">{currency}</span>
          </div>
        </div>
      </motion.div>

      {/* LIVE WITHDRAWAL TICKER */}
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3 overflow-hidden shadow-2xs h-16">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Volume2 className="text-emerald-600 animate-pulse" size={16} />
        </div>
        <div className="flex-1 relative h-full flex items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${ticker.phone}-${ticker.amount}`}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute left-0 right-0 flex flex-col justify-center"
            >
              <div className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
                {t('congratulations')}
              </div>
              {(() => {
                const isEthiopian = ticker.phone.trim().startsWith('+251');
                const amountStr = isEthiopian 
                  ? `${ticker.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
                  : `$${(ticker.amount / 196).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

                const rawText = t('userWithdrew', { phone: '__PHONE__', amount: '__AMOUNT__' });
                const parts = rawText.split(/(__PHONE__|__AMOUNT__)/);
                return (
                  <div className="text-[11px] font-extrabold text-slate-700 leading-tight mt-0.5">
                    {parts.map((part, index) => {
                      if (part === '__PHONE__') {
                        return <span key={index} className="text-emerald-700 font-mono font-black">{ticker.phone}</span>;
                      }
                      if (part === '__AMOUNT__') {
                        return <span key={index} className="text-emerald-700 font-mono font-black">{amountStr}</span>;
                      }
                      return <span key={index}>{part}</span>;
                    })}
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ACTION PANEL */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onOpenRechargeModal}
          className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100/60 rounded-2xl transition-all cursor-pointer border border-amber-100 shadow-xs"
        >
          <div className="w-10 h-10 bg-bronze rounded-full mb-2 flex items-center justify-center text-white shadow-sm">
            <ArrowUpRight size={18} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wide text-deep-forest">{t('recharge')}</span>
        </button>
        <button
          onClick={onOpenWithdrawModal}
          className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-100 rounded-2xl transition-all cursor-pointer border border-slate-200/60 shadow-xs"
        >
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full mb-2 flex items-center justify-center text-slate-600 shadow-sm">
            <ArrowDownLeft size={18} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wide text-slate-700">{t('withdraw')}</span>
        </button>
      </div>

      {/* QUICK CHANNELS PANEL */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setIsAboutOpen(true)}
          className="flex flex-col items-center justify-center py-3 bg-white hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-slate-200/60 shadow-xs"
        >
          <div className="w-8 h-8 bg-emerald-50 rounded-full mb-1 flex items-center justify-center text-emerald-600 shadow-xs">
            <Info size={15} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{t('aboutUs')}</span>
        </button>
        
        <button
          onClick={() => setIsTelegramOpen(true)}
          className="flex flex-col items-center justify-center py-3 bg-white hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-slate-200/60 shadow-xs"
        >
          <div className="w-8 h-8 bg-sky-50 rounded-full mb-1 flex items-center justify-center text-sky-500 shadow-xs">
            <Send size={15} className="-rotate-12 translate-x-[-1px]" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{t('telegram')}</span>
        </button>

        <button
          onClick={() => setIsGiftOpen(true)}
          className="flex flex-col items-center justify-center py-3 bg-white hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-slate-200/60 shadow-xs active:scale-98"
        >
          <div className="w-8 h-8 bg-amber-50 rounded-full mb-1 flex items-center justify-center text-amber-600 shadow-xs">
            <Gift size={15} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{t('giftBox') || 'Gift Box'}</span>
        </button>
      </div>



      {/* COMPANY ANNOUNCEMENTS CAROUSEL IN DESIGN THEME */}
      {announcements.length > 0 && (
        <div className="bg-deep-forest text-white rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              {t('announcementHeader')}
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrevAnnouncement} 
                className="p-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-[9px] text-slate-300 font-bold">
                {announcementIndex + 1}/{announcements.length}
              </span>
              <button 
                onClick={handleNextAnnouncement} 
                className="p-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <motion.div 
            key={announcementIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h4 className="text-xs font-black text-white">
              {(() => {
                const ann = announcements[announcementIndex] || announcements[0];
                if (!ann) return '';
                if (ann.id === 'ann-1' || ann.title?.includes('Welcome to GOM')) {
                  return t('welcomeGomTitle');
                }
                if (ann.id === 'ann-2' || ann.title?.includes('Supported Ethiopian Banks') || ann.title?.includes('Supported Payment Methods')) {
                  return t('supportedBanksTitle');
                }
                return ann.title;
              })()}
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium whitespace-pre-line">
              {(() => {
                const ann = announcements[announcementIndex] || announcements[0];
                if (!ann) return '';
                if (ann.id === 'ann-1' || ann.content?.includes('thrilled to launch') || ann.content?.includes('excited to introduce')) {
                  return t('welcomeGomContent', { reward: formatPrice(750) });
                }
                if (ann.id === 'ann-2' || ann.content?.includes('processed within 1-2 hours') || ann.content?.includes('secure deposit and withdrawal')) {
                  return t('supportedBanksContent');
                }
                return ann.content;
              })()}
            </p>
          </motion.div>
        </div>
      )}



      {/* LOCAL DRAWERS / OVERLAYS */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50 backdrop-blur-sm p-0">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-black rounded-t-[32px] w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl border-t border-white/10 text-left"
            >
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0 bg-black">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    {t('aboutGom')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {t('gomProfileDetails')}
                  </p>
                </div>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-black">
                <div className="bg-black border border-white/10 text-white rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-400">{t('ourProfile')}</h4>
                  <p className="text-xs leading-relaxed font-medium text-slate-200">
                    {t('profilePara1')}
                  </p>
                  <p className="text-xs leading-relaxed font-medium text-slate-200">
                    {t('profilePara2')}
                  </p>
                  <p className="text-xs leading-relaxed font-medium text-slate-200">
                    {t('profilePara3')}
                  </p>
                  {t('profilePara4') && (
                    <p className="text-xs leading-relaxed font-medium text-slate-200">
                      {t('profilePara4')}
                    </p>
                  )}
                  {t('profilePara5') && (
                    <p className="text-xs leading-relaxed font-medium text-slate-200">
                      {t('profilePara5')}
                    </p>
                  )}
                </div>

                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('howGomWorks')}</h4>
                  
                  <div className="bg-black border border-white/10 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 font-black text-xs">1</div>
                    <div>
                      <h5 className="text-xs font-black text-white">{t('matchHighValueOrders')}</h5>
                      <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
                        {t('matchHighValueOrdersDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black border border-white/10 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 font-black text-xs">2</div>
                    <div>
                      <h5 className="text-xs font-black text-white">{t('earnGuaranteedCommission')}</h5>
                      <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
                        {t('earnGuaranteedCommissionDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black border border-white/10 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 font-black text-xs">3</div>
                    <div>
                      <h5 className="text-xs font-black text-white">{t('withdrawSecurely')}</h5>
                      <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
                        {t('withdrawSecurelyDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black p-4 rounded-2xl border border-white/10 text-center">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('missionStatement')}</span>
                  <p className="text-[11px] text-slate-200 italic font-medium leading-relaxed mt-1">
                    {t('missionStatementDesc')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}        {isTelegramOpen && (() => {
          const phone = String(currentUser?.phoneNumber || '');
          const cleanPhone = phone.trim().replace(/\s+/g, '');
          let registeredCountry = 'Ethiopia';
          for (const cc of TELEGRAM_COUNTRIES) {
            if (cleanPhone.startsWith(cc.prefix) || cleanPhone.startsWith(cc.code)) {
              registeredCountry = cc.country;
              break;
            }
          }

          const activeCountryObj = TELEGRAM_COUNTRIES[telegramCountryIndex] || TELEGRAM_COUNTRIES[0];
          const isRestricted = activeCountryObj.country !== registeredCountry;

          const slideVariants = {
            enter: (direction: 'left' | 'right') => ({
              x: direction === 'right' ? 100 : -100,
              opacity: 0
            }),
            center: {
              x: 0,
              opacity: 1,
              transition: { type: 'spring', stiffness: 300, damping: 25 }
            },
            exit: (direction: 'left' | 'right') => ({
              x: direction === 'right' ? -100 : 100,
              opacity: 0,
              transition: { duration: 0.15 }
            })
          };

          return (
            <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50 backdrop-blur-sm p-0">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-white rounded-t-[32px] w-full max-w-md h-[70vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-100 text-left"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      {t('telegramChannels')} ({activeCountryObj.country})
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsTelegramOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Country Pills Selector */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                  {TELEGRAM_COUNTRIES.map((tc, index) => {
                    const isSelected = index === telegramCountryIndex;
                    const isUserCountry = tc.country === registeredCountry;
                    return (
                      <button
                        key={tc.country}
                        onClick={() => {
                          setSlideDirection(index > telegramCountryIndex ? 'right' : 'left');
                          setTelegramCountryIndex(index);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        <span>{tc.flag}</span>
                        <span>{tc.country}</span>
                        {isUserCountry && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 relative flex overflow-hidden bg-slate-50/50">
                  {/* Left Chevron Button */}
                  <button
                    onClick={() => {
                      setSlideDirection('left');
                      setTelegramCountryIndex((prev) => (prev - 1 + TELEGRAM_COUNTRIES.length) % TELEGRAM_COUNTRIES.length);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Right Chevron Button */}
                  <button
                    onClick={() => {
                      setSlideDirection('right');
                      setTelegramCountryIndex((prev) => (prev + 1) % TELEGRAM_COUNTRIES.length);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Sliding Cards Area */}
                  <div className="flex-1 px-11 py-5 overflow-y-auto">
                    <AnimatePresence mode="wait" custom={slideDirection}>
                      <motion.div
                        key={telegramCountryIndex}
                        custom={slideDirection}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="space-y-4"
                      >
                        {/* Access Warning if Restricted removed as per user request */}

                        {/* Official Channel Card */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                          <div>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                              isRestricted ? 'bg-slate-100 text-slate-400' : 'bg-sky-100 text-sky-950'
                            }`}>
                              {t('officialChannel')}
                            </span>
                            <h4 className={`text-xs font-black mt-1 ${isRestricted ? 'text-slate-400' : 'text-slate-800'}`}>
                              GOM {activeCountryObj.country} Channel
                            </h4>
                          </div>

                          <div className="flex gap-2">
                            {isRestricted ? (
                              <button
                                disabled
                                className="flex-1 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-wider py-2 rounded-xl text-center shadow-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <X size={11} /> {t('cantJoinChannel')}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => window.open(`https://t.me/${activeCountryObj.channel}`, '_blank')}
                                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl text-center shadow-xs cursor-pointer"
                                >
                                  {t('joinChannel')}
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`@${activeCountryObj.channel}`);
                                    setCopiedTelegramName('channel');
                                    setTimeout(() => setCopiedTelegramName(null), 2000);
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy size={11} /> {copiedTelegramName === 'channel' ? (t('copied') || 'Copied!') : t('copy')}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Support Desk Card */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                          <div>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                              isRestricted ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-950'
                            }`}>
                              {t('supportDesk')}
                            </span>
                            <h4 className={`text-xs font-black mt-1 ${isRestricted ? 'text-slate-400' : 'text-slate-800'}`}>
                              GOM {activeCountryObj.country} Support
                            </h4>
                          </div>

                          <div className="flex gap-2">
                            {isRestricted ? (
                              <button
                                disabled
                                className="flex-1 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-wider py-2 rounded-xl text-center shadow-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <X size={11} /> {t('cantContactSupport')}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => window.open(`https://t.me/${activeCountryObj.support}`, '_blank')}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl text-center shadow-xs cursor-pointer"
                                >
                                  {t('messageSupport')}
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`@${activeCountryObj.support}`);
                                    setCopiedTelegramName('support');
                                    setTimeout(() => setCopiedTelegramName(null), 2000);
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy size={11} /> {copiedTelegramName === 'support' ? (t('copied') || 'Copied!') : t('copy')}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {isGiftOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50 backdrop-blur-sm p-0">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-[32px] w-full max-w-md h-[85vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-100 text-left"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-gradient-to-r from-amber-50 to-amber-100/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      {t('giftCenter') || 'Gift Center'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsGiftOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all shadow-xs cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sub-Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1 shrink-0">
                <button
                  onClick={() => { setActiveGiftTab('redeem'); setGiftStatusMsg(null); }}
                  className={`flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeGiftTab === 'redeem'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <Ticket size={12} />
                  <span>{t('redeemCode') || 'Redeem Code'}</span>
                </button>
                <button
                  onClick={() => { setActiveGiftTab('history'); setGiftStatusMsg(null); }}
                  className={`flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeGiftTab === 'history'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <Clock size={12} />
                  <span>{t('giftHistory') || 'History'}</span>
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
                
                {/* Status Alert Banner */}
                {giftStatusMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2.5 shadow-xs ${
                      giftStatusMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : giftStatusMsg.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {giftStatusMsg.type === 'success' ? (
                      <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info size={16} className="text-red-500 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{giftStatusMsg.text}</span>
                  </motion.div>
                )}

                {/* TAB 1: REDEEM CODE */}
                {activeGiftTab === 'redeem' && (
                  <div className="space-y-4">
                    {/* Hero Gift Card Banner */}
                    <div className="bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white p-5 rounded-2xl shadow-md relative overflow-hidden space-y-3">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          🎁 Official Gift Rewards
                        </span>
                      </div>
                      <h4 className="text-base font-black text-amber-300 tracking-tight">
                        Enter Your Official Gift Code
                      </h4>

                      <div className="pt-2">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={giftCodeInput}
                            onChange={(e) => setGiftCodeInput(e.target.value)}
                            placeholder="Enter Gift Code"
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 font-mono font-bold text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-amber-400 focus:bg-white/15 uppercase tracking-wider"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isRedeeming || !giftCodeInput.trim()}
                          onClick={handleRedeemCode}
                          className="w-full mt-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          {isRedeeming ? (
                            <span>Processing...</span>
                          ) : (
                            <>
                              <Gift size={15} />
                              <span>Redeem Gift Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: GIFT HISTORY */}
                {activeGiftTab === 'history' && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Claimed Gift History
                    </h4>

                    {(() => {
                      const giftTxs = (transactions || []).filter(
                        t => t.type === 'gift_reward' || t.type === 'gift_created' || (t.description && t.description.toLowerCase().includes('gift'))
                      );

                      if (giftTxs.length === 0) {
                        return (
                          <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-2xl p-4">
                            <Gift size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-xs text-slate-400 font-black">No gift rewards claimed yet.</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 font-sans">
                              Redeem a gift code or open today's Mystery Gift Box above!
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {giftTxs.map((tx) => (
                            <div key={tx.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-xs">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                                  <Gift size={15} />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="block text-xs font-black text-slate-800">
                                    {tx.description}
                                  </span>
                                  <span className="block text-[9px] text-slate-400 font-bold">
                                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                                +{formatPrice(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
