import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '../utils/translations';
import { useApp } from '../context/AppContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'am', label: 'Amharic', flag: '🇪🇹' },
    { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
    { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', label: 'French', flag: '🇫🇷' },
    { code: 'sw', label: 'Swahili', flag: '🇰🇪' },
    { code: 'so', label: 'Somali', flag: '🇸🇴' },
    { code: 'pt', label: 'Portuguese', flag: '🇦🇴' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

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
    <div className="relative" ref={containerRef} id="language-selector-root">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#051F10]/95 border border-emerald-800/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-black text-white cursor-pointer hover:bg-emerald-900 transition-colors shadow-inner focus:outline-none"
      >
        <Globe size={11} className="text-emerald-400 animate-[spin_12s_linear_infinite]" />
        <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
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
            className="absolute right-0 mt-2 w-36 bg-[#051F10]/98 border border-emerald-800/90 rounded-2xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 backdrop-blur-md"
          >
            <div className="max-h-60 overflow-y-auto scrollbar-none py-0.5 flex flex-col gap-0.5">
              {languages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-amber-400 text-slate-950 font-black' 
                        : 'text-slate-200 hover:bg-emerald-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
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
