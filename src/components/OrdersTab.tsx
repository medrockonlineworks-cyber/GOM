/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  const { currentUser, orders, submitOrder, addToCart, resetOrderCycle } = useStateSelectAll();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successReward, setSuccessReward] = useState(0);

  // Custom hook destructuring to avoid state issues
  function useStateSelectAll() {
    return useApp();
  }

  if (!currentUser) return null;

  const handleAddToCart = (orderId: number) => {
    addToCart(orderId);
  };

  const handleCompleteOrder = (orderId: number, reward: number) => {
    setProcessingId(orderId);
    
    // Add a tiny realistic visual processing timeout
    setTimeout(() => {
      const res = submitOrder(orderId);
      setProcessingId(null);
      if (res.success) {
        setSuccessReward(reward);
        setShowSuccessDialog(true);
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
            Order Tasks
          </h2>
          <p className="text-[11px] text-slate-500 italic">Complete 10 sequential tasks per cycle</p>
        </div>
        
        {/* Reset button to clear cycle for continuous testing */}
        <button
          onClick={() => {
            const isCycleCompleted = currentUser && currentUser.completedOrderIds.length >= 10;
            if (!isCycleCompleted) {
              alert(`Please complete all 10 order tasks first! You have completed ${currentUser?.completedOrderIds.length || 0}/10 tasks.`);
              return;
            }
            const res = resetOrderCycle();
            if (res && res.message) {
              alert(res.message);
            }
          }}
          className={`font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
            currentUser && currentUser.completedOrderIds.length >= 10
              ? 'bg-bronze hover:bg-bronze-hover text-white border-bronze animate-pulse' 
              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
          }`}
          title={currentUser && currentUser.completedOrderIds.length >= 10 ? "Reset task cycle to start over with brand new materials" : "Complete all 10 tasks to reset cycle"}
        >
          {currentUser && currentUser.completedOrderIds.length >= 10 ? (
            <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
          ) : (
            '🔒'
          )} 
          Reset Cycle
        </button>
      </div>

      {/* SEQUENTIAL LIST OF 10 ORDERS */}
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
                  ✓ COMPLETED
                </div>
              )}

              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50/40 rounded-2xl">
                  <div className="bg-white/90 border border-slate-300 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                    🔒 Locked Stage
                  </div>
                </div>
              )}

              {isInCart && (
                <div className="absolute -top-2.5 -right-1 bg-bronze text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-md animate-pulse">
                  IN PROGRESS
                </div>
              )}

              {isAvailable && (
                <div className="absolute -top-2.5 -right-1 bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm">
                  STAGE {order.id}
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
                    Order {order.id}: {isLocked ? 'Locked Premium Stage' : order.productName}
                  </h3>
                  
                  {/* Costs Details Grid */}
                  <div className="grid grid-cols-2 mt-2 gap-y-1">
                    <p className="text-[10px] text-slate-500">Material Cost:</p>
                    <p className={`text-[10px] font-black text-right ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                      {isLocked 
                        ? '🔒 Locked' 
                        : `${order.materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
                      }
                    </p>
                    <p className="text-[10px] text-slate-500">Reward:</p>
                    <p className={`text-[10px] font-black text-right ${isLocked ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {isLocked 
                        ? '🔒 Locked' 
                        : `+${order.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON SECTION */}
              {!isLocked && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-amber-900">
                    {isCompleted ? 'Earnings Settled' : hasInsufficientBalance ? `Min Recharge: ${order.minRechargeRequired} ETB` : 'Ready to submit'}
                  </span>

                  <div className="flex gap-2">
                    {isCompleted ? (
                      <span className="text-emerald-600 font-extrabold text-[10px] uppercase flex items-center gap-1">
                        Completed & Paid
                      </span>
                    ) : isAvailable ? (
                      hasInsufficientBalance ? (
                        <button
                          onClick={() => onOpenRechargeModal(order.minRechargeRequired)}
                          className="bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Recharge Now
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(order.id)}
                          className="bg-bronze hover:bg-bronze-hover text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      )
                    ) : isInCart ? (
                      <button
                        onClick={() => handleCompleteOrder(order.id, order.reward)}
                        disabled={processingId !== null}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider px-4 py-2 rounded-lg shadow-md flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {processingId === order.id ? (
                          <>
                            <RefreshCw size={11} className="animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            Pay & Submit
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* RECHARGE NEEDED EXAMPLE IF ANY OF ACTIVE HAS LOW BALANCE */}
      {orders.some(o => o.status === 'available' && currentUser.walletBalance < o.materialCost) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
          <p className="text-[11px] font-bold text-red-700 uppercase">Recharge Required</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-600 font-medium">Insufficient funds to complete next stage.</span>
            <button 
              onClick={() => {
                const nextOrder = orders.find(o => o.status === 'available');
                if (nextOrder) onOpenRechargeModal(nextOrder.minRechargeRequired);
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase transition-all cursor-pointer"
            >
              Recharge Now
            </button>
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
                <h3 className="text-lg font-black text-slate-800">Order Completed!</h3>
                <p className="text-xs text-slate-500">The platform successfully processed your matched digital transaction.</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                <span className="block text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">Commission Reward Credited</span>
                <span className="block text-2xl font-black text-emerald-700 mt-1">+{successReward} ETB</span>
              </div>

              <p className="text-[10px] text-slate-400 font-medium">Your wallet has been automatically credited. The next sequential product is now unlocked!</p>

              <button
                onClick={() => setShowSuccessDialog(false)}
                className="w-full bg-bronze hover:bg-bronze-hover active:bg-bronze/90 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer"
              >
                Unlock Next Level
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
