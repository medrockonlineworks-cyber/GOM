/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Globe
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
  const { currentUser, announcements, orders, language, users, marketplaceLogos } = useApp();
  const { t } = useTranslation(language);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  // Local modals state
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'none' | 'code' | 'link'>('none');

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
    const code = currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`;
    navigator.clipboard.writeText(code);
    setCopiedField('code');
    setTimeout(() => setCopiedField('none'), 2000);
  };

  const copyInviteLink = () => {
    const code = currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`;
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
              {currentUser.phoneNumber.slice(-2)}
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
              {currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-bold text-amber-400">ETB</span>
          </div>
        </div>
      </motion.div>

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
          onClick={() => setIsTeamOpen(true)}
          className="flex flex-col items-center justify-center py-3 bg-white hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-slate-200/60 shadow-xs"
        >
          <div className="w-8 h-8 bg-amber-50 rounded-full mb-1 flex items-center justify-center text-amber-600 shadow-xs">
            <Users size={15} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{t('team')}</span>
        </button>
      </div>

      {/* INTEGRATED GLOBAL MARKETPLACES */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200/80">
        {/* Exact 6-Logo Grid Layout with Clean Outlines matching Reference (Logo Only) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm grid grid-cols-3">
          {/* Amazon */}
          <div className="p-2.5 flex items-center justify-center border-r border-b border-slate-200 bg-white hover:bg-slate-50/40 transition-colors group h-16">
            <MarketplaceLogoCell 
              src={marketplaceLogos?.amazon || "https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg"} 
              alt="Amazon" 
              brandKey="amazon"
            />
          </div>
          {/* Walmart */}
          <div className="p-2.5 flex items-center justify-center border-r border-b border-slate-200 bg-white hover:bg-slate-50/40 transition-colors group h-16">
            <MarketplaceLogoCell 
              src={marketplaceLogos?.walmart || "https://www.vectorlogo.zone/logos/walmart/walmart-ar21.svg"} 
              alt="Walmart" 
              brandKey="walmart"
            />
          </div>
          {/* Alibaba.com */}
          <div className="p-2.5 flex items-center justify-center border-b border-slate-200 bg-white hover:bg-slate-50/40 transition-colors group h-16">
            <MarketplaceLogoCell 
              src={marketplaceLogos?.alibaba || "https://www.vectorlogo.zone/logos/alibaba/alibaba-ar21.svg"} 
              alt="Alibaba.com" 
              brandKey="alibaba"
            />
          </div>
          {/* Shopify */}
          <div className="p-2.5 flex items-center justify-center border-r border-slate-200 bg-white hover:bg-slate-50/40 transition-colors group h-16">
            <MarketplaceLogoCell 
              src={marketplaceLogos?.shopify || "https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg"} 
              alt="Shopify" 
              brandKey="shopify"
            />
          </div>
          {/* Airbnb */}
          <div className="p-2.5 flex items-center justify-center border-r border-slate-200 bg-white hover:bg-slate-50/40 transition-colors group h-16">
            <MarketplaceLogoCell 
              src={marketplaceLogos?.airbnb || "https://www.vectorlogo.zone/logos/airbnb/airbnb-ar21.svg"} 
              alt="Airbnb" 
              brandKey="airbnb"
            />
          </div>
          {/* GOM System */}
          <div className="p-2.5 flex flex-col items-center justify-center bg-slate-50/40 h-16 select-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">GOM</span>
            <span className="text-[7px] text-slate-400/80 font-bold uppercase tracking-wider mt-0.5">Global Market</span>
          </div>
        </div>
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
            <h4 className="text-xs font-black text-white">{announcements[announcementIndex].title}</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{announcements[announcementIndex].content}</p>
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
                </div>

                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('howGomWorksInEthiopia')}</h4>
                  
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
        )}        {isTelegramOpen && (
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
                    {t('telegramChannels')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {t('officialAnnSupportHandles')}
                  </p>
                </div>
                <button
                  onClick={() => setIsTelegramOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex gap-3 shadow-xs">
                  <div className="w-9 h-9 bg-sky-500 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Send size={18} className="-rotate-12 translate-x-[-1px]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider">{t('telegramNetwork')}</h4>
                    <p className="text-[11px] text-sky-800 font-medium leading-relaxed mt-0.5">
                      {t('telegramNetworkDesc')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div>
                      <span className="bg-sky-100 text-sky-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block">{t('officialChannel')}</span>
                      <h4 className="text-xs font-black text-slate-800 mt-1">{t('gomEthiopiaAnnChannel')}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{t('getNewsDailyGiftCodes')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open('https://t.me/GOM_Ethiopia_Official', '_blank')}
                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl text-center shadow-xs cursor-pointer"
                      >
                        {t('joinChannel')}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('@GOM_Ethiopia_Official');
                          alert(t('copied') || 'Username @GOM_Ethiopia_Official copied!');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={11} /> {t('copy')}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div>
                      <span className="bg-emerald-100 text-emerald-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block">{t('supportDesk')}</span>
                      <h4 className="text-xs font-black text-slate-800 mt-1">{t('gomOnlineTelegramAssistant')}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{t('talkWithProfessional')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open('https://t.me/gom_support_et', '_blank')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl text-center shadow-xs cursor-pointer"
                      >
                        {t('messageSupport')}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('@gom_support_et');
                          alert(t('copied') || 'Username @gom_support_et copied!');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={11} /> {t('copy')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isTeamOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50 backdrop-blur-sm p-0">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-[32px] w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-100 text-left"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    {t('myTeamNetwork')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {t('dynamicL1Referred')}
                  </p>
                </div>
                <button
                  onClick={() => setIsTeamOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
                
                {/* Team Referral Link Box */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-2xl p-4.5 space-y-3 shadow-xs text-center">
                  <div>
                    <span className="text-[9px] text-amber-900 font-extrabold uppercase tracking-widest bg-amber-200/50 px-2 py-0.5 rounded-full inline-block">{t('gomReferralRewards')}</span>
                    <h4 className="text-xs font-black text-slate-800 mt-1.5 font-sans">{t('earnExtraBonusMatch')}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                      {t('inviteFriendsDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <button
                      onClick={copyInviteCode}
                      className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-black text-[10px] uppercase tracking-wider py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      {copiedField === 'code' ? <Check size={12} className="text-emerald-600" /> : <Copy size={11} />}
                      {copiedField === 'code' ? t('copiedCode') : t('copyCode')}
                    </button>
                    <button
                      onClick={copyInviteLink}
                      className="bg-bronze hover:bg-bronze-hover text-white font-black text-[10px] uppercase tracking-wider py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      {copiedField === 'link' ? <Check size={12} className="text-emerald-100" /> : <Copy size={11} />}
                      {copiedField === 'link' ? t('copiedLink') : t('copyLink')}
                    </button>
                  </div>
                </div>

                {/* Team stats scoreboard */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center shadow-xs">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">{t('totalTeamMembers')}</span>
                    <span className="block text-xl font-black text-slate-800 mt-1">
                      {(users || []).filter(u => u.referredBy === currentUser.id || u.referredBy === currentUser.phoneNumber).length}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center shadow-xs">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">{t('totalTeamRewards')}</span>
                    <span className="block text-xl font-black text-emerald-600 mt-1">{(currentUser.referralEarnings || 0).toLocaleString()} ETB</span>
                  </div>
                </div>

                {/* Referred Users Directory List */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {t('referredPartners', { count: (users || []).filter(u => u.referredBy === currentUser.id || u.referredBy === currentUser.phoneNumber).length })}
                  </h4>
                  
                  {((users || []).filter(u => u.referredBy === currentUser.id || u.referredBy === currentUser.phoneNumber)).length === 0 ? (
                    <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-2xl p-4">
                      <p className="text-xs text-slate-400 font-black">{t('noReferredMembers')}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 font-sans">{t('copyAndShareReferral')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {((users || []).filter(u => u.referredBy === currentUser.id || u.referredBy === currentUser.phoneNumber)).map(member => (
                        <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                          <div>
                            <span className="block text-xs font-black text-slate-800">{formatUserPhoneId(member.phoneNumber)}</span>
                            <span className="block text-[9px] text-slate-400 font-bold mt-0.5">{t('joined')}: {new Date(member.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {t('activeL1')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
