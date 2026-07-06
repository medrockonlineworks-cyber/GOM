/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation, formatUserPhoneId } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Wallet, 
  History, 
  Headphones, 
  Settings, 
  LogOut, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight, 
  ShieldAlert, 
  X, 
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageSquare,
  RefreshCw,
  Landmark,
  FileSpreadsheet,
  Gift,
  Copy,
  Users,
  ShieldCheck,
  Check
} from 'lucide-react';

interface MyTabProps {
  rechargeModalOpen: boolean;
  setRechargeModalOpen: (open: boolean) => void;
  withdrawModalOpen: boolean;
  setWithdrawModalOpen: (open: boolean) => void;
  supportModalOpen: boolean;
  setSupportModalOpen: (open: boolean) => void;
  prefillRechargeAmount: number;
  onToggleAdminView?: (open: boolean) => void;
}

export const MyTab: React.FC<MyTabProps> = ({ 
  rechargeModalOpen, 
  setRechargeModalOpen, 
  withdrawModalOpen, 
  setWithdrawModalOpen, 
  supportModalOpen, 
  setSupportModalOpen,
  prefillRechargeAmount,
  onToggleAdminView
}) => {
  const { 
    currentUser, 
    transactions, 
    supportMessages, 
    logout, 
    factoryReset,
    language
  } = useApp();

  const { t } = useTranslation(language);

  const [activeHistoryPanel, setActiveHistoryPanel] = useState<'none' | 'recharges' | 'withdrawals' | 'transactions' | 'orders' | 'referrals'>('none');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');

  if (!currentUser) return null;

  // Filter lists for current user
  const userTransactions = transactions.filter(t => t.userId === currentUser.id);
  const userRecharges = userTransactions.filter(t => t.type === 'recharge');
  const userWithdrawals = userTransactions.filter(t => t.type === 'withdraw');
  const userOrderRewards = userTransactions.filter(t => t.type === 'reward');
  const userTickets = supportMessages.filter(t => t.userId === currentUser.id);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?ref=${currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-6 bg-slate-50">
      
      {/* 1. PROFESSIONAL HEADER PROFILE CARD */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-deep-forest to-deep-forest-light text-white rounded-2xl flex items-center justify-center shadow-md shrink-0 border border-slate-700/10">
            <UserIcon size={20} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck size={10} /> {t('verifiedId')}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-800 mt-1">{formatUserPhoneId(currentUser.phoneNumber)}</h3>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{t('joined')}: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <Settings size={16} className="text-slate-400" />
        </div>
      </div>

      {/* 2. WALLET ASSETS BOARD - PREMIUM STYLING */}
      <div className="bg-gradient-to-br from-deep-forest to-[#1A3133] text-white rounded-3xl p-6 shadow-lg space-y-5 border border-slate-800 relative overflow-hidden">
        {/* Abstract design elements to look professional and branded */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-bronze/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-deep-forest-light/50 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-1.5">
            <Wallet size={14} className="text-amber-400" />
            <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">{t('walletBalance')}</span>
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-white">
              {currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-amber-400 font-black">ETB</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/40 relative z-10">
          <button 
            onClick={() => setRechargeModalOpen(true)}
            className="bg-bronze hover:bg-bronze-hover text-white font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 border border-bronze/20"
          >
            <ArrowUpRight size={13} className="text-amber-200" /> {t('recharge')}
          </button>
          <button 
            onClick={() => setWithdrawModalOpen(true)}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-white font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ArrowDownLeft size={13} className="text-slate-400" /> {t('withdraw')}
          </button>
        </div>
      </div>

      {/* 3. CORE SERVICE MENU HUB */}
      <div className="bg-white rounded-3xl shadow-xs p-5 border border-slate-200/50 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
          {t('accountLedgerServices')}
        </h2>
        
        <div className="divide-y divide-slate-100">
          {/* Recharge History */}
          <button 
            onClick={() => setActiveHistoryPanel('recharges')}
            className="w-full py-3 flex items-center justify-between group text-left cursor-pointer transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-bronze flex items-center justify-center shrink-0 border border-amber-100/50">
                <ArrowUpRight size={15} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">{t('rechargeHistory')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {userRecharges.length}
              </span>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </button>

          {/* Withdrawal History */}
          <button 
            onClick={() => setActiveHistoryPanel('withdrawals')}
            className="w-full py-3 flex items-center justify-between group text-left cursor-pointer transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/50">
                <ArrowDownLeft size={15} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">{t('withdrawalLogs')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {userWithdrawals.length}
              </span>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </button>

          {/* Complete Ledger Log */}
          <button 
            onClick={() => setActiveHistoryPanel('transactions')}
            className="w-full py-3 flex items-center justify-between group text-left cursor-pointer transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                <History size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">{t('fullStatementLedger')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {userTransactions.length}
              </span>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </button>

          {/* Completed Digital Tasks */}
          <button 
            onClick={() => setActiveHistoryPanel('orders')}
            className="w-full py-3 flex items-center justify-between group text-left cursor-pointer transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                <FileSpreadsheet size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">{t('taskMatchesList')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {userOrderRewards.length}
              </span>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </button>

        </div>

        {currentUser.role === 'admin' && onToggleAdminView && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onToggleAdminView(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-2"
            >
              🛡️ {t('openAdminPanel')}
            </button>
          </div>
        )}
      </div>


      {/* 6. PROFESSIONAL SYSTEM AND CORE SETTINGS PANEL */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('systemSecurity')}</h3>
        
        <div className="space-y-2">
          {/* Developer Factory reset */}
          <button
            onClick={() => {
              setResetConfirmationInput('');
              setShowResetConfirm(true);
            }}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/60 transition-all p-3.5 rounded-2xl flex items-center justify-between text-left shadow-2xs cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200/30 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <span className="text-xs font-black block text-slate-700 group-hover:text-red-700 transition-colors">{t('resetDatabaseEnv')}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>

          {/* Secure Sign Out */}
          <button
            onClick={logout}
            className="w-full bg-white hover:bg-red-50 text-slate-700 border border-slate-200/60 transition-all p-3.5 rounded-2xl flex items-center justify-between text-left shadow-2xs cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200/30 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <LogOut size={14} />
              </div>
              <div>
                <span className="text-xs font-black block text-slate-700 group-hover:text-red-700 transition-colors">{t('logout')}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>
        </div>
      </div>

      {/* --- ALL DYNAMIC OVERLAY DRAWERS / MODALS FOR HISTORIES --- */}
      <AnimatePresence>
        {activeHistoryPanel !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-end justify-center z-50 backdrop-blur-sm p-0">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-[32px] w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-100"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {activeHistoryPanel === 'recharges' && t('rechargeTransactions')}
                    {activeHistoryPanel === 'withdrawals' && t('withdrawalTransactions')}
                    {activeHistoryPanel === 'transactions' && t('completeLedgerLog')}
                    {activeHistoryPanel === 'orders' && t('finishedMatchingTasks')}
                    {activeHistoryPanel === 'referrals' && t('referralRewardsProgram')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {activeHistoryPanel === 'referrals' ? t('inviteFriendsGetRewards') : t('etbAssetsLedger')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveHistoryPanel('none')}
                  className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                
                {/* RECHARGES LIST */}
                {activeHistoryPanel === 'recharges' && (
                  userRecharges.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">{t('noRechargesFound')}</div>
                  ) : (
                    userRecharges.map(tx => (
                      <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="block text-xs font-black text-slate-800">{tx.bankName}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">{t('refCode')}: {tx.accountNumberOrRef}</span>
                          <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-black text-amber-800 text-right">+{tx.amount} ETB</span>
                          <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 ${
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tx.status === 'pending' ? t('pendingStatus') : tx.status === 'approved' ? t('approvedStatus') : t('rejectedStatus')}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* WITHDRAWALS LIST */}
                {activeHistoryPanel === 'withdrawals' && (
                  userWithdrawals.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">{t('noWithdrawalsFound')}</div>
                  ) : (
                    userWithdrawals.map(tx => (
                      <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="block text-xs font-black text-slate-800">{tx.bankName}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">{t('accountNumber')}: {tx.accountNumberOrRef}</span>
                          <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-black text-red-500">-{tx.amount} ETB</span>
                          <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 ${
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tx.status === 'pending' ? t('pendingStatus') : tx.status === 'approved' ? t('approvedStatus') : t('rejectedStatus')}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* ALL LEDGER LIST */}
                {activeHistoryPanel === 'transactions' && (
                  userTransactions.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">{t('noLedgerActivities')}</div>
                  ) : (
                    userTransactions.map(tx => {
                      const isAddition = tx.type === 'recharge' || tx.type === 'reward' || tx.type === 'welcome_bonus';
                      return (
                        <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                          <div className="space-y-1">
                            <span className="block text-xs font-black text-slate-800 capitalize">{tx.type.replace('_', ' ')}</span>
                            <span className="block text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px]">{tx.description}</span>
                            <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`block text-xs font-black ${isAddition ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {isAddition ? '+' : '-'}{tx.amount} ETB
                            </span>
                            <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 ${
                              tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              tx.status === 'approved' || tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {tx.status === 'pending' ? t('pendingStatus') : (tx.status === 'approved' || tx.status === 'completed') ? t('approvedStatus') : t('rejectedStatus')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                )}

                {/* COMPLETED ORDERS COMMISSION */}
                {activeHistoryPanel === 'orders' && (
                  userOrderRewards.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">{t('noMatchedOrders')}</div>
                  ) : (
                    userOrderRewards.map(tx => (
                      <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="block text-xs font-black text-emerald-800">{t('taskCompletedReward')}</span>
                          <p className="text-[10px] text-slate-500 font-medium leading-normal max-w-[220px]">{tx.description}</p>
                          <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-xs font-black text-emerald-600">+{tx.amount} ETB</span>
                          <span className="inline-block text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mt-1.5">
                            {t('unlocked')}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* REFERRALS SYSTEM DETAILS */}
                {activeHistoryPanel === 'referrals' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-900 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 shrink-0 shadow-sm font-bold select-none">
                          <Gift size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-100">{t('referAndEarnBonus')}</h3>
                          <p className="text-[9px] text-emerald-300">{t('inviteFriendsGetRewards')}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-emerald-200">
                          <span>{t('yourInviteCode')}</span>
                          <span className="font-mono font-black text-xs bg-emerald-400 text-slate-950 px-3 py-1 rounded-full select-all tracking-wider">
                            {currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`}
                          </span>
                        </div>

                        <div className="text-[10px] text-emerald-300 leading-relaxed font-medium space-y-1 pt-1">
                          <p>• {t('youGet100Etb')}</p>
                          <p>• {t('yourFriendGets100Etb')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-800/30">
                          <span className="block text-[8px] uppercase tracking-wider text-emerald-300">{t('totalReferrals')}</span>
                          <span className="block text-sm font-black text-emerald-400 mt-0.5">{currentUser.referralCount || 0}</span>
                        </div>
                        <div className="bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-800/30">
                          <span className="block text-[8px] uppercase tracking-wider text-emerald-300">{t('referralEarnings')}</span>
                          <span className="block text-sm font-black text-emerald-400 mt-0.5">{(currentUser.referralEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                        </div>
                      </div>

                      <button
                        onClick={handleCopyLink}
                        className="w-full bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Copy size={11} /> {t('copyInviteLinkCode')}
                      </button>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">{t('howItWorks')}</h4>
                      <ol className="text-[10px] text-slate-500 space-y-1.5 list-decimal list-inside font-medium leading-relaxed font-sans">
                        <li>{t('shareUniqueInvitation')}</li>
                        <li>{t('whenTheyComplete')}</li>
                        <li>{t('instantCashBonus')}</li>
                      </ol>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-red-50 border-b border-red-100/50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {t('confirmResetTitle')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-7 h-7 rounded-full bg-red-100/50 hover:bg-red-100 flex items-center justify-center text-red-600 hover:text-red-800 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {t('confirmResetWarning')}
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {t('confirmResetInputLabel')}
                  </label>
                  <input
                    type="text"
                    value={resetConfirmationInput}
                    onChange={(e) => setResetConfirmationInput(e.target.value)}
                    placeholder="RESET"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 rounded-xl px-3.5 py-2 text-xs font-mono uppercase tracking-widest text-slate-800 focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    disabled={resetConfirmationInput.trim().toUpperCase() !== 'RESET'}
                    onClick={async () => {
                      setShowResetConfirm(false);
                      await factoryReset();
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={11} /> {t('confirmResetButton')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
