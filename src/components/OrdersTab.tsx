/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  CheckCircle2, 
  ShoppingCart, 
  Coins, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight, 
  CircleDollarSign,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

interface OrdersTabProps {
  onOpenRechargeModal: (prefillAmount?: number) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ onOpenRechargeModal }) => {
  const { currentUser, orders, submitOrder, addToCart, resetOrderCycle, transactions, language } = useStateSelectAll();
  const { t } = useTranslation(language);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successReward, setSuccessReward] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  React.useEffect(() => {
    if (!currentUser?.lastOrderCompletedAt) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const lastCompleted = new Date(currentUser.lastOrderCompletedAt!).getTime();
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;
      const remaining = fiveMinutesInMs - (now - lastCompleted);
      return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    };

    const initialRemaining = calculateTimeLeft();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser?.lastOrderCompletedAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Custom hook destructuring to avoid state issues
  function useStateSelectAll() {
    return useApp();
  }

  if (!currentUser) return null;

  const hasPendingRecharge = transactions.some(
    t => t.userId === currentUser.id && t.type === 'recharge' && t.status === 'pending'
  );

  const handleAddToCart = (orderId: number) => {
    addToCart(orderId);
  };

  const handleCompleteOrder = (orderId: number, reward: number) => {
    setProcessingId(orderId);
    
    // Add a tiny realistic visual processing timeout
    setTimeout(async () => {
      const res = await submitOrder(orderId);
      setProcessingId(null);
      if (res.success) {
        // Successful feedback modal is disabled per user request
      } else {
        alert(res.message);
      }
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-5 bg-alabaster">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 uppercase tracking-tight">
            {t('orderTasks')}
          </h2>
          <p className="text-[11px] text-slate-500 italic">{t('complete15Sequential')}</p>
        </div>
        
        {/* Reset button to clear cycle for continuous testing */}
        <button
          onClick={() => {
            const isCycleCompleted = currentUser && currentUser.completedOrderIds.length >= 15;
            if (!isCycleCompleted) {
              alert(t('completeAllTasksAlert', { completedCount: currentUser?.completedOrderIds.length || 0 }));
              return;
            }
            const res = resetOrderCycle();
            if (res && res.message) {
              alert(t('cycleResetAlert'));
            }
          }}
          className={`font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
            currentUser && currentUser.completedOrderIds.length >= 15
              ? 'bg-bronze hover:bg-bronze-hover text-white border-bronze animate-pulse' 
              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
          }`}
          title={currentUser && currentUser.completedOrderIds.length >= 15 ? "Reset task cycle to start over with brand new materials" : "Complete all 15 tasks to reset cycle"}
        >
          {currentUser && currentUser.completedOrderIds.length >= 15 ? (
            <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
          ) : (
            '🔒'
          )} 
          {t('resetCycle')}
        </button>
      </div>

      {/* COOLDOWN HEADER BANNER */}
      {timeLeft > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">{t('taskCooldownPending')}</p>
            <p className="text-xs font-semibold text-slate-700">{t('nextTaskAvailable')}</p>
          </div>
          <div className="bg-amber-100/80 border border-amber-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs font-black text-amber-700 tabular-nums animate-pulse">{formatTime(timeLeft)}</span>
          </div>
        </div>
      )}

      {/* SEQUENTIAL LIST OF 15 ORDERS */}
      <div className="space-y-4">
        {orders.map((order, idx) => {
          const isLocked = order.status === 'locked';
          const isCompleted = order.status === 'completed';
          const isInCart = order.status === 'in_cart';
          const isAvailable = order.status === 'available';
          const hasInsufficientBalance = currentUser.walletBalance < order.materialCost;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`rounded-2xl p-4 bg-white relative transition-all duration-300 ${
                isLocked 
                  ? 'border border-slate-200 bg-slate-50 opacity-70 grayscale' 
                  : isCompleted 
                  ? 'border border-emerald-200 bg-emerald-50/10 shadow-sm' 
                  : isInCart 
                  ? 'border-2 border-bronze shadow-md' 
                  : 'border border-amber-300/60 shadow-xs'
              }`}
            >
              {/* Badge Overlays matching Design HTML */}
              {isCompleted && (
                <div className="absolute -top-2.5 -right-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm">
                  ✓ {t('completed').toUpperCase()}
                </div>
              )}

              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50/40 rounded-2xl">
                  <div className="bg-white/90 border border-slate-300 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                    🔒 {t('lockedStage')}
                  </div>
                </div>
              )}

              {isInCart && (
                <div className="absolute -top-2.5 -right-1 bg-bronze text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-md animate-pulse">
                  {t('inProgress')}
                </div>
              )}

              {isAvailable && (
                <div className="absolute -top-2.5 -right-1 bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm">
                  {t('stage')} {order.id}
                </div>
              )}

              <div className="flex gap-4">
                {/* Product Icon/Image Panel matching custom layout */}
                <div className="relative w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 select-none flex items-center justify-center">
                  {isLocked ? (
                    <span className="text-3xl text-slate-400">🔒</span>
                  ) : order.productImage ? (
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>

                {/* Info details */}
                <div className="flex-1">
                  <h3 className={`text-xs font-black uppercase ${isLocked ? 'text-slate-400 font-medium' : 'text-slate-900'} line-clamp-1`}>
                    {t('order')} {order.id}: {isLocked ? t('lockedStage') : order.productName}
                  </h3>
                  
                  {/* Costs Details Grid */}
                  <div className="grid grid-cols-2 mt-2 gap-y-1 text-slate-700">
                    <p className="text-[10px] font-bold">{t('materialCost')}:</p>
                    <p className={`text-[10px] font-black text-right ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                      {isLocked 
                        ? `🔒 ${t('locked')}` 
                        : `${order.materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
                      }
                    </p>
                    
                    <p className="text-[10px] font-bold">{t('reward')}:</p>
                    <p className={`text-[10px] font-black text-right ${isLocked ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {isLocked 
                        ? `🔒 ${t('locked')}` 
                        : `+${order.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
                      }
                    </p>

                    <p className="text-[10px] font-bold">{t('currentBalance')}:</p>
                    <p className="text-[10px] font-black text-right text-slate-800">
                      {currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                    </p>

                    <p className="text-[10px] font-bold">{language === 'en' ? 'Status' : 'ሁኔታ'}:</p>
                    <p className="text-[10px] font-extrabold text-right uppercase">
                      {isCompleted ? (
                        <span className="text-emerald-600">{t('completed')}</span>
                      ) : isLocked ? (
                        <span className="text-slate-400">{t('locked')}</span>
                      ) : (
                        <span className="text-amber-600">{t('ready')}</span>
                      )}
                    </p>

                    {/* Minimum Recharge Required (only when needed) */}
                    {!isLocked && !isCompleted && hasInsufficientBalance && (
                      <>
                        <p className="text-[10px] font-bold text-red-600">{t('minRecharge')}:</p>
                        <p className="text-[10px] font-black text-right text-red-600">
                          {(order.materialCost - currentUser.walletBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON SECTION */}
              {!isLocked && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-900">
                      {isCompleted 
                        ? t('earningsSettled') 
                        : hasInsufficientBalance 
                        ? `${t('minRecharge')}: ${(order.materialCost - currentUser.walletBalance).toLocaleString()} ETB` 
                        : t('readyToSubmit')
                      }
                    </span>

                    <div className="flex gap-2">
                      {isCompleted ? (
                        <span className="text-emerald-600 font-extrabold text-[10px] uppercase flex items-center gap-1">
                          {t('completedAndPaid')}
                        </span>
                      ) : isInCart ? (
                        <button
                          onClick={() => handleCompleteOrder(order.id, order.reward)}
                          disabled={processingId !== null}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider px-4 py-2 rounded-lg shadow-md flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {processingId === order.id ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" /> {t('submitting')}
                            </>
                          ) : (
                            <>
                              {t('submitOrder')}
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Add to Cart / Recharge buttons for available status */}
                  {isAvailable && (
                    <div className="flex gap-2 w-full mt-1">
                      {timeLeft > 0 ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl text-[10px] text-amber-800 font-medium mb-1 space-y-1 shadow-2xs">
                            <p className="font-extrabold uppercase tracking-wide flex items-center gap-1 text-amber-900">
                              <RefreshCw size={10} className="animate-spin text-amber-600" style={{ animationDuration: '4s' }} /> 
                              {t('taskCooldownActive')} ({formatTime(timeLeft)})
                            </p>
                            <p>{t('cooldownWarning')}</p>
                          </div>
                          <button
                            disabled={true}
                            className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[9px] uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            {t('lockedTask')} {formatTime(timeLeft)}
                          </button>
                        </div>
                      ) : hasInsufficientBalance ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="bg-red-50 border border-red-200/60 p-2.5 rounded-xl text-[10px] text-red-700 font-medium mb-1 space-y-1">
                            <p className="font-extrabold uppercase tracking-wide">{t('insufficientBalance')}</p>
                            <p>{t('minRecharge')}: <strong className="text-red-900">{(order.materialCost - currentUser.walletBalance).toLocaleString()} ETB</strong></p>
                          </div>
                           <div className="flex gap-2 w-full">
                            <button
                              disabled={true}
                              className="flex-1 bg-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-not-allowed border border-slate-200"
                            >
                              {t('addToCart')}
                            </button>
                            {hasPendingRecharge ? (
                              <button
                                disabled={true}
                                className="flex-1 bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm flex items-center justify-center gap-1 cursor-not-allowed opacity-90"
                              >
                                <RefreshCw size={10} className="animate-spin" /> {t('pendingStatus')}...
                              </button>
                            ) : (
                              <button
                                onClick={() => onOpenRechargeModal(order.materialCost - currentUser.walletBalance)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <ArrowUpRight size={10} /> {t('rechargeNow')}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(order.id)}
                          className="w-full bg-bronze hover:bg-bronze-hover text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          {t('addToCart')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* RECHARGE NEEDED EXAMPLE IF ANY OF ACTIVE HAS LOW BALANCE */}
      {orders.some(o => o.status === 'available' && currentUser.walletBalance < o.materialCost) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
          <p className="text-[11px] font-bold text-red-700 uppercase">{t('rechargeRequired')}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-600 font-medium">{t('insufficientFunds')}</span>
            {hasPendingRecharge ? (
              <button 
                disabled={true}
                className="bg-amber-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase transition-all flex items-center gap-1 cursor-not-allowed opacity-90"
              >
                <RefreshCw size={10} className="animate-spin" /> {t('pending')}
              </button>
            ) : (
              <button 
                onClick={() => {
                  const nextOrder = orders.find(o => o.status === 'available');
                  if (nextOrder) onOpenRechargeModal(nextOrder.minRechargeRequired);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase transition-all cursor-pointer"
              >
                {t('rechargeNow')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TASK COMPLETE CELEBRATION MODAL */}
      <AnimatePresence>
        {showSuccessDialog && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 border border-amber-100 shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-emerald-200">
                <Sparkles size={32} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-800">{t('orderCompleted')}</h3>
                <p className="text-xs text-slate-500">{t('orderCompletedDesc')}</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                <span className="block text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">{t('commissionRewardCredited')}</span>
                <span className="block text-2xl font-black text-emerald-700 mt-1">+{successReward} ETB</span>
              </div>

              <p className="text-[10px] text-slate-400 font-medium">{t('walletCreditedNextUnlocked')}</p>

              <button
                onClick={() => setShowSuccessDialog(false)}
                className="w-full bg-bronze hover:bg-bronze-hover active:bg-bronze/90 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer"
              >
                {t('unlockNextLevel')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
