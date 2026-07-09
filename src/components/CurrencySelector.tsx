import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, ChevronDown, Check } from 'lucide-react';
import { Currency } from '../types';
import { useApp } from '../context/AppContext';

export default function CurrencySelector() {
  const { currency, setCurrency } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currencies: { code: Currency; label: string; flag: string; symbol: string }[] = [
    { code: 'ETB', label: 'ETB', flag: '🇪🇹', symbol: 'Br' },
    { code: 'USD', label: 'USD', flag: '🇺🇸', symbol: '$' },
    { code: 'EUR', label: 'EUR', flag: '🇪🇺', symbol: '€' },
    { code: 'CNY', label: 'CNY', flag: '🇨🇳', symbol: '¥' },
    { code: 'SAR', label: 'SAR', flag: '🇸🇦', symbol: 'SR' },
    { code: 'KES', label: 'KES', flag: '🇰🇪', symbol: 'KSh' },
    { code: 'SOS', label: 'SOS', flag: '🇸🇴', symbol: 'Sh.So.' },
    { code: 'AOA', label: 'AOA', flag: '🇦🇴', symbol: 'Kz' },
  ];

  const currentCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef} id="currency-selector-root">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#051F10]/95 border border-emerald-800/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-black text-white cursor-pointer hover:bg-emerald-900 transition-colors shadow-inner focus:outline-none"
      >
        <Coins size={11} className="text-amber-400 animate-[pulse_3s_infinite]" />
        <span>{currentCurrency.flag} {currentCurrency.symbol} {currentCurrency.code}</span>
        <ChevronDown size={10} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Vertical */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-32 bg-[#051F10]/98 border border-emerald-800/90 rounded-2xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 backdrop-blur-md"
          >
            <div className="max-h-60 overflow-y-auto scrollbar-none py-0.5 flex flex-col gap-0.5">
              {currencies.map((curr) => {
                const isSelected = currency === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      setCurrency(curr.code);
                      setIsOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-amber-400 text-slate-950 font-black' 
                        : 'text-slate-200 hover:bg-emerald-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{curr.flag}</span>
                      <span>{curr.symbol} {curr.code}</span>
                    </div>
                    {isSelected && <Check size={10} className="stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
