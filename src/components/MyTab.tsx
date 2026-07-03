/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Copy
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
    factoryReset 
  } = useApp();

  const [activeHistoryPanel, setActiveHistoryPanel] = useState<'none' | 'recharges' | 'withdrawals' | 'transactions' | 'orders' | 'referrals'>('none');

  if (!currentUser) return null;

  // Filter lists for current user
  const userTransactions = transactions.filter(t => t.userId === currentUser.id);
  const userRecharges = userTransactions.filter(t => t.type === 'recharge');
  const userWithdrawals = userTransactions.filter(t => t.type === 'withdraw');
  const userOrderRewards = userTransactions.filter(t => t.type === 'reward');
  const userTickets = supportMessages.filter(t => t.userId === currentUser.id);

  return (
    <div className="flex-1 flex flex-col p-5 space-y-6 bg-alabaster">
      
      {/* PROFILE COVER PROFILE CARD */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-bronze rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
          <UserIcon size={20} />
        </div>
        <div>
          <span className="bg-amber-50 text-amber-950 border border-amber-200/50 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">
            Verified User Account
          </span>
          <h3 className="text-sm font-black text-slate-900 mt-1">{currentUser.phoneNumber}</h3>
          <span className="text-[10px] text-slate-400 font-bold block">ID: {currentUser.id} • Registered: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      {/* WALLET METRICS BOARD - SLEEK DEEP BLUE CARD */}
      <div className="bg-gradient-to-br from-deep-forest to-deep-forest-light text-white rounded-3xl p-6 shadow-xl space-y-4 border border-bronze/10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase">Unified Wallet Balance</span>
          <Wallet size={16} className="text-amber-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight">{currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs text-amber-400 font-extrabold">ETB</span>
          </div>
          <span className="text-[9px] text-slate-300 mt-1 block">Includes Welcome Bonus. Standard bank transaction rates apply.</span>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <button 
            onClick={() => setRechargeModalOpen(true)}
            className="bg-bronze hover:bg-bronze-hover text-white font-black text-[10px] uppercase tracking-wider py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <ArrowUpRight size={13} /> Recharge
          </button>
          <button 
            onClick={() => setWithdrawModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-[10px] uppercase tracking-wider py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowDownLeft size={13} /> Withdraw
          </button>
        </div>
      </div>

      {/* TRANSACTION & HISTORY LOGS SECTIONS - AS A UNIFIED SLEEK BLOCK */}
      <div className="bg-gradient-to-br from-deep-forest to-deep-forest-light rounded-3xl shadow-xl p-6 text-white border border-bronze/10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Account Settings</h2>
        <div className="space-y-4">
          
          <div 
            onClick={() => setActiveHistoryPanel('recharges')}
            className="flex items-center justify-between border-b border-white/10 pb-2.5 cursor-pointer hover:text-amber-300 transition-colors"
          >
            <span className="text-xs opacity-80">Recharge History ({userRecharges.length})</span>
            <span className="text-xs">→</span>
          </div>

          <div 
            onClick={() => setActiveHistoryPanel('withdrawals')}
            className="flex items-center justify-between border-b border-white/10 pb-2.5 cursor-pointer hover:text-amber-300 transition-colors"
          >
            <span className="text-xs opacity-80">Withdrawal History ({userWithdrawals.length})</span>
            <span className="text-xs">→</span>
          </div>

          <div 
            onClick={() => setActiveHistoryPanel('transactions')}
            className="flex items-center justify-between border-b border-white/10 pb-2.5 cursor-pointer hover:text-amber-300 transition-colors"
          >
            <span className="text-xs opacity-80">All Ledger Transactions ({userTransactions.length})</span>
            <span className="text-xs">→</span>
          </div>

          <div 
            onClick={() => setActiveHistoryPanel('orders')}
            className="flex items-center justify-between border-b border-white/10 pb-2.5 cursor-pointer hover:text-amber-300 transition-colors"
          >
            <span className="text-xs opacity-80">Completed Digital Tasks ({userOrderRewards.length})</span>
            <span className="text-xs">→</span>
          </div>

          <div 
            onClick={() => setActiveHistoryPanel('referrals')}
            className="flex items-center justify-between border-b border-white/10 pb-2.5 cursor-pointer hover:text-amber-300 transition-colors"
          >
            <span className="text-xs opacity-80 font-black text-emerald-300">🎁 Refer & Earn System</span>
            <span className="text-xs">→</span>
          </div>

          {currentUser.role === 'admin' && onToggleAdminView && (
            <div className="pt-2">
              <button
                onClick={() => onToggleAdminView(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-2"
              >
                🛡️ Open Admin Council Panel
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => {
                const inviteUrl = `${window.location.origin}?ref=${currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`}`;
                navigator.clipboard.writeText(inviteUrl);
                alert(`Invite link copied to clipboard!\nShare this with your friends:\n${inviteUrl}`);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-1.5"
            >
              <Copy size={11} /> Copy Invite Link & Code
            </button>
          </div>

        </div>
      </div>

      {/* LIVE CUSTOMER SUPPORT CHAT TICKETS PORTAL */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones size={15} className="text-bronze" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Support Ticket Center</h3>
          </div>
          <button
            onClick={() => setSupportModalOpen(true)}
            className="text-[10px] text-bronze hover:underline font-extrabold flex items-center gap-0.5 uppercase cursor-pointer"
          >
            <MessageSquare size={11} /> Open Ticket
          </button>
        </div>

        {userTickets.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            No active support tickets. Need help? Open a ticket now!
          </div>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {userTickets.map((ticket) => (
              <div key={ticket.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800">{ticket.subject}</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                    ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{ticket.message}</p>
                {ticket.reply && (
                  <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/40 mt-2">
                    <span className="block text-[8px] font-extrabold text-amber-900 uppercase">Official Response:</span>
                    <p className="text-[10px] text-deep-forest font-medium leading-relaxed mt-0.5">{ticket.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SYSTEM AND CORE SETTINGS PANEL */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Management</h3>
        
        <div className="space-y-2.5">
          {/* Developer Factory reset */}
          <button
            onClick={factoryReset}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-100/30 transition-all p-3.5 rounded-2xl flex items-center justify-between text-left shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <RefreshCw size={15} />
              </div>
              <div>
                <span className="text-xs font-black block">Factory Reset Database</span>
                <span className="text-[9px] text-red-500">Deletes all mock data, transactions and re-seeds</span>
              </div>
            </div>
            <ChevronRight size={14} />
          </button>

          {/* Secure Sign Out */}
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white transition-all p-3.5 rounded-2xl flex items-center justify-between text-left shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/25 text-white flex items-center justify-center">
                <LogOut size={15} />
              </div>
              <div>
                <span className="text-xs font-black block uppercase tracking-wider">Secure Logout</span>
                <span className="text-[9px] text-red-100">Closes your matching session and returns to login</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-white/80" />
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
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    {activeHistoryPanel === 'recharges' && 'Recharge Transactions'}
                    {activeHistoryPanel === 'withdrawals' && 'Withdrawal Transactions'}
                    {activeHistoryPanel === 'transactions' && 'Complete Ledger Log'}
                    {activeHistoryPanel === 'orders' && 'Finished Matching Tasks'}
                    {activeHistoryPanel === 'referrals' && 'Referral Rewards Program'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {activeHistoryPanel === 'referrals' ? 'Invite friends and get extra cash bonus' : 'Ethiopian Birr (ETB) Assets ledger records'}
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
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">No bank recharges found.</div>
                  ) : (
                    userRecharges.map(tx => (
                      <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="block text-xs font-black text-slate-800">{tx.bankName}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">Ref Code: {tx.accountNumberOrRef}</span>
                          <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-black text-amber-800">+{tx.amount} ETB</span>
                          <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 ${
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* WITHDRAWALS LIST */}
                {activeHistoryPanel === 'withdrawals' && (
                  userWithdrawals.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">No withdrawals found.</div>
                  ) : (
                    userWithdrawals.map(tx => (
                      <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="block text-xs font-black text-slate-800">{tx.bankName}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">Account: {tx.accountNumberOrRef}</span>
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
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* ALL LEDGER LIST */}
                {activeHistoryPanel === 'transactions' && (
                  userTransactions.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">No ledger activities found.</div>
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
                              {tx.status}
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
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">No matched orders submitted yet.</div>
                  ) : (
                    userOrderRewards.map(tx => (
                      <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="block text-xs font-black text-emerald-800">Task Completed Reward</span>
                          <p className="text-[10px] text-slate-500 font-medium leading-normal max-w-[220px]">{tx.description}</p>
                          <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-xs font-black text-emerald-600">+{tx.amount} ETB</span>
                          <span className="inline-block text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mt-1.5">
                            Unlocked
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
                          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-100">Refer & Earn Bonus</h3>
                          <p className="text-[9px] text-emerald-300">Invite friends and get rewards instantly!</p>
                        </div>
                      </div>

                      <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-emerald-200">
                          <span>Your Invite Code:</span>
                          <span className="font-mono font-black text-xs bg-emerald-400 text-slate-950 px-3 py-1 rounded-full select-all tracking-wider">
                            {currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`}
                          </span>
                        </div>

                        <div className="text-[10px] text-emerald-300 leading-relaxed font-medium space-y-1 pt-1">
                          <p>• <strong className="text-emerald-200">You get 200.00 ETB</strong> for each friend who registers with your code.</p>
                          <p>• <strong className="text-emerald-200">Your friend gets 100.00 ETB</strong> extra welcome bonus (total 600.00 ETB!).</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-800/30">
                          <span className="block text-[8px] uppercase tracking-wider text-emerald-300">Total Referrals</span>
                          <span className="block text-sm font-black text-emerald-400 mt-0.5">{currentUser.referralCount || 0}</span>
                        </div>
                        <div className="bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-800/30">
                          <span className="block text-[8px] uppercase tracking-wider text-emerald-300">Referral Earnings</span>
                          <span className="block text-sm font-black text-emerald-400 mt-0.5">{(currentUser.referralEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const inviteUrl = `${window.location.origin}?ref=${currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`}`;
                          navigator.clipboard.writeText(inviteUrl);
                          alert(`Invite link copied to clipboard!\nShare this with your friends:\n${inviteUrl}`);
                        }}
                        className="w-full bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Copy size={11} /> Copy Invite Link & Code
                      </button>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">How it works:</h4>
                      <ol className="text-[10px] text-slate-500 space-y-1.5 list-decimal list-inside font-medium leading-relaxed">
                        <li>Share your unique invitation link or invitation code with potential friends or colleagues.</li>
                        <li>When they complete their registration, your system profile automatically registers them under your sub-affiliate network.</li>
                        <li>An instant cash bonus of <span className="font-extrabold text-slate-800">200.00 ETB</span> is added directly to your standard withdrawable ledger.</li>
                      </ol>
                    </div>
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
