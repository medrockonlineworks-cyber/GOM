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
  ShoppingBag,
  X,
  Info,
  Zap,
  Clock,
  Check,
  ShieldCheck,
  TrendingUp,
  Wallet,
  KeyRound
} from 'lucide-react';

interface OrdersTabProps {
  onOpenRechargeModal: (prefillAmount?: number) => void;
}

// Selling count per order (unique for each order, higher than 100k and less than 1M)
const ORDER_SELL_COUNTS: Record<number, number> = {
  1: 145,
  2: 284,
  3: 319,
  4: 562,
  5: 198,
  6: 437,
  7: 685,
  8: 241,
  9: 752,
  10: 826,
  11: 368,
  12: 593,
  13: 412,
  14: 679,
  15: 914,
};

const getOrderSellsCount = (orderId: number): string => {
  if (ORDER_SELL_COUNTS[orderId]) {
    return `${ORDER_SELL_COUNTS[orderId]}k`;
  }
  const deterministicVal = 101 + ((orderId * 137 + 49) % 890);
  return `${deterministicVal}k`;
};

const ORDER_MARKETPLACES: Record<number, string> = {
  1: 'Amazon',
  2: 'Amazon',
  3: 'Walmart',
  4: 'Alibaba',
  5: 'Shopify',
  6: 'eBay',
  7: 'AliExpress',
  8: 'Temu',
  9: 'Amazon',
  10: 'Walmart',
  11: 'Alibaba',
  12: 'Shopify',
  13: 'eBay',
  14: 'Amazon',
  15: 'Alibaba',
};

export const OrdersTab: React.FC<OrdersTabProps> = ({ onOpenRechargeModal }) => {
  const { 
    currentUser, 
    orders, 
    submitOrder, 
    addToCart, 
    resetOrderCycle, 
    transactions, 
    language, 
    formatPrice,
    redeemOrderCode 
  } = useStateSelectAll();
  const { t } = useTranslation(language);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedOrderForGuide, setSelectedOrderForGuide] = useState<any | null>(null);
  const [successReward, setSuccessReward] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Admin Order Code Modal States
  const [showOrderCodeModal, setShowOrderCodeModal] = useState(false);
  const [orderCodeInput, setOrderCodeInput] = useState('');
  const [orderCodeError, setOrderCodeError] = useState('');
  const [orderCodeSuccess, setOrderCodeSuccess] = useState('');
  const [orderCodeLoading, setOrderCodeLoading] = useState(false);
  const lastTapRef = React.useRef<number>(0);

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

  // Handler for Reset Cycle button: Double-tap / double-click activates the admin order code system
  const openCodeActivationModal = () => {
    setShowOrderCodeModal(true);
    setOrderCodeError('');
    setOrderCodeSuccess('');
  };

  const handleResetCycleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    // Check if double tap / double click occurred within 500ms
    if (timeSinceLastTap > 0 && timeSinceLastTap < 500) {
      lastTapRef.current = 0;
      openCodeActivationModal();
      return;
    }
    
    lastTapRef.current = now;

    // Give a brief window for second tap, else handle single click
    setTimeout(async () => {
      // If a second tap occurred, lastTapRef was reset to 0
      if (lastTapRef.current !== now) return;

      const isCycleCompleted = currentUser && (currentUser.completedOrderIds || []).length >= 15;
      if (!isCycleCompleted) {
        const completedCount = currentUser?.completedOrderIds?.length || 0;
        const wantCode = window.confirm(
          `Order Cycle Incomplete: You have completed ${completedCount}/15 orders.\n\nTo reset cycle normally, complete all 15 orders.\n\n👉 Do you have an Admin Order Completion Code to activate? Click OK to enter code.`
        );
        if (wantCode) {
          openCodeActivationModal();
        }
        return;
      }

      const res = await resetOrderCycle();
      if (res && res.message) {
        alert(t('cycleResetAlert'));
      }
    }, 320);
  };

  const handleActivateOrderCode = async () => {
    if (!orderCodeInput.trim()) return;
    setOrderCodeLoading(true);
    setOrderCodeError('');
    setOrderCodeSuccess('');

    try {
      const res = await redeemOrderCode(orderCodeInput.trim());
      if (res.success) {
        setOrderCodeSuccess(res.message);
        setTimeout(() => {
          setShowOrderCodeModal(false);
          setOrderCodeInput('');
          setOrderCodeSuccess('');
        }, 1800);
      } else {
        setOrderCodeError(res.message || 'Failed to activate order completion code.');
      }
    } catch (e: any) {
      setOrderCodeError(e.message || 'Error validating code.');
    } finally {
      setOrderCodeLoading(false);
    }
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
        
        {/* Reset button to clear cycle for continuous testing & Admin Code Activation via double-tap */}
        <button
          onClick={handleResetCycleClick}
          onDoubleClick={(e) => {
            e.preventDefault();
            openCodeActivationModal();
          }}
          className={`font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
            currentUser && (currentUser.completedOrderIds || []).length >= 15
              ? 'bg-bronze hover:bg-bronze-hover text-white border-bronze animate-pulse' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
          title={
            currentUser && (currentUser.completedOrderIds || []).length >= 15 
              ? "Reset task cycle to start over with brand new materials (or double-tap to enter code)" 
              : "Complete all 15 tasks to reset cycle. Double-tap to activate Admin Order Code."
          }
        >
          {currentUser && (currentUser.completedOrderIds || []).length >= 15 ? (
            <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
          ) : (
            <KeyRound size={11} className="text-blue-600" />
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
                <div className="absolute -top-2.5 -right-1 flex items-center gap-1.5 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderForGuide(order);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm cursor-pointer transition-all border border-amber-400/60"
                  >
                    DETAILS
                  </button>
                  <div className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    ✓ {(t('completed') || 'Completed').toUpperCase()}
                  </div>
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
                <div className="absolute -top-2.5 -right-1 flex items-center gap-1.5 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderForGuide(order);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm cursor-pointer transition-all border border-amber-400/60"
                  >
                    DETAILS
                  </button>
                  <div className="bg-bronze text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md animate-pulse">
                    {t('inProgress')}
                  </div>
                </div>
              )}

              {isAvailable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderForGuide(order);
                  }}
                  className="absolute -top-2.5 -right-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full z-20 shadow-md flex items-center gap-1 cursor-pointer transition-all border border-amber-400/60"
                >
                  <span>DETAILS</span>
                </button>
              )}

              <div className="flex gap-4 items-start">
                {/* Product Icon/Image Panel matching custom layout */}
                <div className="flex flex-col items-center shrink-0 w-16">
                  <div className="relative w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 select-none flex items-center justify-center">
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

                  {/* Sells count below material image when order is complete and paid */}
                  {isCompleted && (
                    <div className="mt-2 text-center flex flex-col items-center w-full py-0.5">
                      <span className="text-[11px] font-black text-slate-900 leading-tight">
                        Thank You
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 leading-tight whitespace-nowrap mt-0.5">
                        {getOrderSellsCount(order.id)} sells.
                      </span>
                    </div>
                  )}
                </div>

                {/* Info details */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xs font-black uppercase ${isLocked ? 'text-slate-400 font-medium' : 'text-slate-900'} line-clamp-1`}>
                    {t('order')} {order.id}: {isLocked ? t('lockedStage') : order.productName}
                  </h3>
                  
                  {/* Costs Details Grid */}
                  <div className="grid grid-cols-2 mt-2 gap-y-1 text-slate-700">
                    <p className="text-[10px] font-bold">{t('materialCost')}:</p>
                    <p className={`text-[10px] font-black text-right ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                      {isLocked 
                        ? `🔒 ${t('locked')}` 
                        : formatPrice(order.materialCost)
                      }
                    </p>
                    
                    <p className="text-[10px] font-bold">{t('reward')}:</p>
                    <p className={`text-[10px] font-black text-right ${isLocked ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {isLocked 
                        ? `🔒 ${t('locked')}` 
                        : `+${formatPrice(order.reward)}`
                      }
                    </p>

                    <p className="text-[10px] font-bold">{t('currentBalance')}:</p>
                    <p className="text-[10px] font-black text-right text-slate-800">
                      {formatPrice(currentUser.walletBalance)}
                    </p>

                    <p className="text-[10px] font-bold">{t('statusLabel')}:</p>
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
                          {formatPrice(order.materialCost - currentUser.walletBalance)}
                        </p>
                        {hasPendingRecharge && (
                          <>
                            <p className="text-[10px] font-bold text-amber-600">{t('rechargeStatus')}:</p>
                            <p className="text-[10px] font-black text-right text-amber-600 uppercase animate-pulse">
                              {t('pendingApproval')}
                            </p>
                          </>
                        )}
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
                        : hasPendingRecharge
                        ? t('rechargeVerificationInProgress')
                        : hasInsufficientBalance 
                        ? `${t('minRecharge')}: ${formatPrice(order.materialCost - currentUser.walletBalance)}` 
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
                          {hasPendingRecharge ? (
                            <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl text-[10px] text-amber-700 font-medium mb-1 space-y-1">
                              <p className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-amber-800">
                                <RefreshCw size={11} className="animate-spin text-amber-600" style={{ animationDuration: '4s' }} /> 
                                {t('rechargePending')}
                              </p>
                              <p>{t('rechargePendingDesc')}</p>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200/60 p-2.5 rounded-xl text-[10px] text-red-700 font-medium mb-1 space-y-1">
                              <p className="font-extrabold uppercase tracking-wide">{t('insufficientBalance')}</p>
                              <p>{t('minRecharge')}: <strong className="text-red-900">{formatPrice(order.materialCost - currentUser.walletBalance)}</strong></p>
                            </div>
                          )}
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
        hasPendingRecharge ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2 shadow-xs animate-pulse">
            <p className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1.5">
              <RefreshCw size={11} className="animate-spin text-amber-600" style={{ animationDuration: '4s' }} />
              {t('rechargePending')}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-amber-600 font-medium">{t('rechargeVerificationInProgress')}</span>
              <button 
                disabled={true}
                className="bg-amber-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase transition-all flex items-center gap-1 cursor-not-allowed opacity-90"
              >
                <RefreshCw size={10} className="animate-spin" /> {t('pending')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
            <p className="text-[11px] font-bold text-red-700 uppercase">{t('rechargeRequired')}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-600 font-medium">{t('insufficientFunds')}</span>
              <button 
                onClick={() => {
                  const nextOrder = orders.find(o => o.status === 'available');
                  if (nextOrder) onOpenRechargeModal(nextOrder.minRechargeRequired);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase transition-all cursor-pointer"
              >
                {t('rechargeNow')}
              </button>
            </div>
          </div>
        )
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
                <span className="block text-2xl font-black text-emerald-700 mt-1">+{formatPrice(successReward)}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl">
                <span className="block text-xs font-black text-slate-900">Thank You</span>
                <span className="block text-[11px] font-bold text-slate-600 mt-0.5">
                  {getOrderSellsCount(processingId || 1)} sells.
                </span>
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

      {/* ORDER DETAILS GUIDE MODAL */}
      <AnimatePresence>
        {selectedOrderForGuide && (
          <div 
            className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-sm"
            onClick={() => setSelectedOrderForGuide(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200/90 relative max-h-[92vh] overflow-y-auto"
            >
              {(() => {
                // Determine current open order (in_cart or next available)
                const currentOpenOrder = orders.find(o => o.status === 'in_cart') || orders.find(o => o.status === 'available') || null;
                const isViewingOpenOrder = Boolean(currentOpenOrder && selectedOrderForGuide.id === currentOpenOrder.id);
                const isViewedOrderCompleted = selectedOrderForGuide.status === 'completed';

                // Recharge status specifically reads the current open order
                const activeOrderToEvaluate = currentOpenOrder;

                let openOrderShortfall = 0;
                let isNonRechargeable = true;
                let rechargeStatusType: 'recharge_free' | 'complete' | 'pending' | 'ready' = 'recharge_free';
                let minRechargeDisplay = 'Recharge Free';

                if (activeOrderToEvaluate) {
                  const activeOrderCost = Number(activeOrderToEvaluate.materialCost);
                  const userBalance = Number(currentUser.walletBalance);
                  openOrderShortfall = Math.max(0, activeOrderCost - userBalance);
                  isNonRechargeable = openOrderShortfall <= 0;

                  // Check pending recharges specifically for this user right now
                  const activePendingRecharge = transactions.find(
                    t => t.userId === currentUser.id && t.type === 'recharge' && t.status === 'pending'
                  );

                  // Recent approved recharge since the last completed order
                  const lastCompletedTime = currentUser.lastOrderCompletedAt ? new Date(currentUser.lastOrderCompletedAt).getTime() : 0;
                  const recentApprovedRecharge = transactions.find(
                    t => t.userId === currentUser.id &&
                         t.type === 'recharge' &&
                         (t.status === 'approved' || t.status === 'completed') &&
                         new Date(t.createdAt).getTime() > lastCompletedTime
                  );

                  if (recentApprovedRecharge) {
                    rechargeStatusType = 'complete';
                    minRechargeDisplay = 'Recharge Free';
                  } else if (activePendingRecharge) {
                    rechargeStatusType = 'pending';
                    minRechargeDisplay = formatPrice(openOrderShortfall > 0 ? openOrderShortfall : activePendingRecharge.amount);
                  } else if (isNonRechargeable) {
                    rechargeStatusType = 'recharge_free';
                    minRechargeDisplay = 'Recharge Free';
                  } else {
                    rechargeStatusType = 'ready';
                    minRechargeDisplay = formatPrice(openOrderShortfall);
                  }
                } else {
                  // All orders completed
                  rechargeStatusType = 'complete';
                  minRechargeDisplay = 'Recharge Free';
                }

                const marketplace = ORDER_MARKETPLACES[selectedOrderForGuide.id] || 'Amazon';
                const totalReturn = Number(selectedOrderForGuide.materialCost) + Number(selectedOrderForGuide.reward);

                return (
                  <div className="space-y-4">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                          ORDER #{selectedOrderForGuide.id}
                        </span>
                        <span className="bg-amber-100/90 text-amber-950 border border-amber-300/80 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg">
                          {marketplace}
                        </span>
                        {isViewingOpenOrder ? (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Current Open Order
                          </span>
                        ) : isViewedOrderCompleted ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Completed Stage
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForGuide(null)}
                        className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors cursor-pointer shrink-0"
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Product & Material Overview Card */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200/90 shrink-0 flex items-center justify-center shadow-xs">
                          {selectedOrderForGuide.productImage ? (
                            <img
                              src={selectedOrderForGuide.productImage}
                              alt={selectedOrderForGuide.productName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-3xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Task Material</p>
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {selectedOrderForGuide.productName || 'Premium Leather Bag'}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-medium">Platform:</span>
                            <span className="text-[11px] font-extrabold text-slate-800">{marketplace}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500">{getOrderSellsCount(selectedOrderForGuide.id)} sells</span>
                          </div>
                        </div>
                      </div>

                      {/* 3-Column Financial Metrics */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-center">
                        <div className="bg-white rounded-xl p-2.5 border border-slate-200/70 shadow-2xs">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Material Cost</span>
                          <span className="block text-xs font-black text-slate-900 mt-0.5">
                            {formatPrice(selectedOrderForGuide.materialCost)}
                          </span>
                        </div>
                        <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-200/70 shadow-2xs">
                          <span className="block text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Task Reward</span>
                          <span className="block text-xs font-black text-emerald-600 mt-0.5">
                            +{formatPrice(selectedOrderForGuide.reward)}
                          </span>
                        </div>
                        <div className="bg-white rounded-xl p-2.5 border border-slate-200/70 shadow-2xs">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Your Balance</span>
                          <span className="block text-xs font-black text-slate-900 mt-0.5">
                            {formatPrice(currentUser.walletBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Return Settlement Breakdown */}
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-900 font-extrabold">
                          <TrendingUp size={13} className="text-amber-700" /> Total Credited Return
                        </span>
                        <span className="font-mono text-sm font-black text-amber-950">
                          {formatPrice(totalReturn)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        The material cost of <strong className="text-slate-900">{formatPrice(selectedOrderForGuide.materialCost)}</strong> plus the commission reward of <strong className="text-emerald-700">+{formatPrice(selectedOrderForGuide.reward)}</strong> will be credited to your wallet balance immediately upon order submission.
                      </p>
                    </div>

                    {/* Order & Live Recharge Verification Status (Always reading current open order) */}
                    <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isViewingOpenOrder ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                            Live Order & Recharge Status
                          </span>
                        </div>
                        {activeOrderToEvaluate && (
                          <span className="text-[10px] font-bold text-slate-500">
                            Reading Open Order #{activeOrderToEvaluate.id}
                          </span>
                        )}
                      </div>

                      {/* Viewed Order Status */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">
                          {isViewingOpenOrder ? 'Open Order Status:' : `Order #${selectedOrderForGuide.id} Status:`}
                        </span>
                        <span className={`font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full ${
                          selectedOrderForGuide.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : selectedOrderForGuide.status === 'in_cart'
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {selectedOrderForGuide.status === 'completed'
                            ? 'COMPLETED'
                            : selectedOrderForGuide.status === 'in_cart'
                            ? 'IN CART'
                            : 'AVAILABLE'}
                        </span>
                      </div>

                      {/* Minimum Recharge (Reading current open order) */}
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-medium">Minimum Recharge:</span>
                          {!isViewingOpenOrder && activeOrderToEvaluate && (
                            <span className="text-[10px] text-slate-400">(Order #{activeOrderToEvaluate.id})</span>
                          )}
                        </div>
                        <span className={`font-black text-xs ${
                          rechargeStatusType === 'recharge_free' || rechargeStatusType === 'complete'
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md'
                            : 'text-slate-950 font-mono font-bold'
                        }`}>
                          {minRechargeDisplay}
                        </span>
                      </div>

                      {/* Recharge Status (Reading current open order) */}
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-medium">Recharge Status:</span>
                          {!isViewingOpenOrder && activeOrderToEvaluate && (
                            <span className="text-[10px] text-slate-400">(Order #{activeOrderToEvaluate.id})</span>
                          )}
                        </div>

                        {rechargeStatusType === 'recharge_free' && (
                          <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Recharge Free
                          </span>
                        )}

                        {rechargeStatusType === 'complete' && (
                          <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Complete
                          </span>
                        )}

                        {rechargeStatusType === 'pending' && (
                          <span className="inline-flex items-center gap-1 font-black text-amber-800 bg-amber-50 border border-amber-300 text-[11px] px-2.5 py-0.5 rounded-full animate-pulse">
                            <Clock size={12} className="text-amber-700" /> Pending
                          </span>
                        )}

                        {rechargeStatusType === 'ready' && (
                          <span className="inline-flex items-center gap-1 font-black text-amber-950 bg-amber-100 border border-amber-300 text-[11px] px-2.5 py-0.5 rounded-full">
                            <Zap size={12} className="text-amber-600 fill-amber-500" /> Ready to recharge
                          </span>
                        )}
                      </div>

                      {/* Helpful switcher note if viewing a past completed order */}
                      {!isViewingOpenOrder && activeOrderToEvaluate && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Active open order is <strong>Order #{activeOrderToEvaluate.id}</strong></span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForGuide(activeOrderToEvaluate)}
                            className="text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                          >
                            Switch to Open Order
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium text-center">
                      Please follow the task instructions to proceed with the assigned order sequence.
                    </p>

                    {/* Action Buttons */}
                    <div className="pt-1 flex gap-2">
                      {isViewingOpenOrder && rechargeStatusType === 'ready' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForGuide(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-3 rounded-xl transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForGuide(null);
                              onOpenRechargeModal(openOrderShortfall);
                            }}
                            className="flex-2 bg-bronze hover:bg-bronze-hover active:scale-98 text-white text-xs font-black py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Zap size={14} className="fill-white" />
                            <span>Recharge {formatPrice(openOrderShortfall)}</span>
                          </button>
                        </>
                      ) : isViewingOpenOrder && selectedOrderForGuide.status === 'in_cart' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForGuide(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-3 rounded-xl transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForGuide(null);
                              handleCompleteOrder(selectedOrderForGuide.id, selectedOrderForGuide.reward);
                            }}
                            className="flex-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>Submit Order</span>
                          </button>
                        </>
                      ) : isViewingOpenOrder && selectedOrderForGuide.status === 'available' && openOrderShortfall <= 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForGuide(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-3 rounded-xl transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForGuide(null);
                              handleAddToCart(selectedOrderForGuide.id);
                            }}
                            className="flex-2 bg-bronze hover:bg-bronze-hover active:scale-98 text-white text-xs font-black py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart size={14} />
                            <span>Add to Cart</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForGuide(null)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          OK
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN ORDER COMPLETION CODE ACTIVATION MODAL (TRIGGERED VIA DOUBLE-TAP ON RESET CYCLE BUTTON) */}
      <AnimatePresence>
        {showOrderCodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Order Completion Code
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Admin Code Activation System
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrderCodeModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs space-y-1">
                  <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                    Target Account
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-sm flex items-center justify-between">
                    <span>{currentUser.phoneNumber}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md">
                      Current User
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Enter Admin Activation Code:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-1010-12-8492"
                    value={orderCodeInput}
                    onChange={(e) => setOrderCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 font-mono text-sm font-black tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all uppercase"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-500">
                    Enter the code provided by admin for phone <strong>{currentUser.phoneNumber}</strong> to complete your assigned orders and add the total balance into your wallet.
                  </p>
                </div>

                {orderCodeError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{orderCodeError}</span>
                  </div>
                )}

                {orderCodeSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{orderCodeSuccess}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderCodeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={orderCodeLoading || !orderCodeInput.trim()}
                  onClick={handleActivateOrderCode}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {orderCodeLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Activate Code</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
