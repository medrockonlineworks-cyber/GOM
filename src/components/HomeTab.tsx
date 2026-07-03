/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  Gift, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Volume2, 
  Headphones, 
  ChevronRight, 
  Clock, 
  Coins, 
  ShieldAlert, 
  ChevronLeft,
  Calendar
} from 'lucide-react';

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
  const { currentUser, announcements, orders } = useApp();
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  if (!currentUser) return null;

  // Calculate order progress
  const completedCount = currentUser.completedOrderIds.length;
  const progressPercent = Math.min(100, (completedCount / 10) * 100);

  // Active Order info
  const activeOrder = orders.find(o => o.status === 'available' || o.status === 'in_cart');

  const handleNextAnnouncement = () => {
    setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrevAnnouncement = () => {
    setAnnouncementIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
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
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Welcome back,</span>
            <span className="block text-xs font-black text-slate-800">{currentUser.phoneNumber}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[9px] font-black border border-slate-200 uppercase tracking-wider">
            UID: GOM-{currentUser.id.slice(0, 6).toUpperCase()}
          </span>
        </div>
      </div>

      {/* PREMIUM FINTECH GRADIENT WALLET CARD */}
      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-deep-forest to-deep-forest-light text-white rounded-3xl p-6 shadow-lg relative overflow-hidden border border-bronze/10"
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">User ID: GOM-{currentUser.id.slice(0, 6).toUpperCase()}</p>
            <p className="text-xs font-semibold mt-0.5">{currentUser.phoneNumber}</p>
          </div>
          <span className="bg-bronze text-white px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest">
            Verified
          </span>
        </div>

        <div className="mt-2 mb-4">
          <p className="text-[10px] opacity-80 uppercase font-bold tracking-wide">Wallet Balance</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl font-black tracking-tight text-white">
              {currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-amber-400">ETB</span>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-white/10">
          <div className="bg-white/15 px-3 py-1 rounded-full text-[10px] font-bold">
            Bonus: {currentUser.welcomeBonus} ETB
          </div>
          <div className="bg-white/15 px-3 py-1 rounded-full text-[10px] font-bold">
            Earnings: {currentUser.totalEarnings} ETB
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
          <span className="text-[11px] font-black uppercase tracking-wide text-deep-forest">Recharge</span>
        </button>
        <button
          onClick={onOpenWithdrawModal}
          className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-100 rounded-2xl transition-all cursor-pointer border border-slate-200/60 shadow-xs"
        >
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full mb-2 flex items-center justify-center text-slate-600 shadow-sm">
            <ArrowDownLeft size={18} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wide text-slate-700">Withdraw</span>
        </button>
      </div>

      {/* TASK PROGRESS CARD */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-bronze animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Order Progress</h3>
          </div>
          <span className="text-[10px] font-black text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full">
            Cycle {completedCount}/10 Complete
          </span>
        </div>
 
        {/* ProgressBar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-bronze"
            />
          </div>
          <div className="flex justify-between text-[8px] text-slate-400 font-black tracking-widest">
            <span>STAGE 1</span>
            <span>STAGE 5</span>
            <span>STAGE 10</span>
          </div>
        </div>
 
        {/* Current order helper description */}
        <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between border border-slate-100">
          {activeOrder ? (
            <>
              <div className="space-y-0.5">
                <span className="block text-[8px] text-amber-900 font-extrabold uppercase tracking-wider">Active Task Goal</span>
                <span className="block text-xs font-bold text-slate-800 leading-snug">{activeOrder.productName}</span>
                <span className="block text-[10px] text-slate-500">Cost: <strong className="text-slate-700">{activeOrder.materialCost} ETB</strong> • Reward: <strong className="text-emerald-600">+{activeOrder.reward} ETB</strong></span>
              </div>
              <button
                onClick={onNavigateToOrders}
                className="bg-bronze hover:bg-bronze-hover text-white font-black text-[10px] uppercase tracking-wide px-3 py-2 rounded-xl flex items-center gap-0.5 shadow-sm shrink-0 cursor-pointer"
              >
                Start <ChevronRight size={12} />
              </button>
            </>
          ) : (
            <div className="w-full text-center py-2">
              <span className="block text-xs font-black text-emerald-600 uppercase tracking-wider">🎉 Daily Cycle Completed!</span>
              <span className="block text-[10px] text-slate-400 mt-1">All 10 progressive products completed. Contact support or reset to run again.</span>
            </div>
          )}
        </div>
      </div>

      {/* COMPANY ANNOUNCEMENTS CAROUSEL IN DESIGN THEME */}
      {announcements.length > 0 && (
        <div className="bg-deep-forest text-white rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              📢 Announcement
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

      {/* QUICK SUPPORT PANEL */}
      <div className="bg-slate-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-bronze shrink-0">
            <Headphones size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold">Customer Support 24/7</span>
            <span className="block text-[10px] text-slate-300">Ethiopian Banks transfer queries resolved instantly</span>
          </div>
        </div>
        <button
          onClick={onOpenSupportModal}
          className="bg-bronze hover:bg-bronze-hover font-black text-[10px] uppercase tracking-wide py-2 px-3.5 rounded-lg text-white shadow-sm cursor-pointer"
        >
          Live
        </button>
      </div>

    </div>
  );
};
