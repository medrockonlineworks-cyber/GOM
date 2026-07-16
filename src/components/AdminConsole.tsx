/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sliders, 
  Volume2, 
  Headphones, 
  FileSpreadsheet, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  CornerDownRight, 
  Search, 
  Coins,
  ShieldCheck,
  TrendingUp,
  Settings,
  Terminal,
  Activity,
  Edit
} from 'lucide-react';

import { formatUserPhoneId, useTranslation } from '../utils/translations';
import { sha256 } from 'js-sha256';

const securityTranslations: Record<string, {
  gateTitle: string;
  gateSubtitle: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  unlockBtn: string;
  cancelBtn: string;
  errorInvalid: string;
}> = {
  en: {
    gateTitle: "Administrative Security Gate",
    gateSubtitle: "This area contains restricted global market operational tools. Please re-authenticate by entering your administrator password to proceed.",
    passwordLabel: "Admin Password",
    passwordPlaceholder: "Enter admin password",
    unlockBtn: "Unlock Console",
    cancelBtn: "Cancel & Exit",
    errorInvalid: "Invalid administrator password. Access denied.",
  },
  am: {
    gateTitle: "የአስተዳዳሪ ደህንነት በር",
    gateSubtitle: "ይህ ክፍል የተገደቡ የአለም አቀፍ ገበያ ማስኬጃ መሳሪያዎችን ይዟል። እባክዎን ለመቀጠል የአስተዳዳሪ የይለፍ ቃልዎን ያስገቡ።",
    passwordLabel: "የአስተዳዳሪ ይለፍ ቃል",
    passwordPlaceholder: "የአስተዳዳሪ ይለፍ ቃል ያስገቡ",
    unlockBtn: "ቁልፍ ክፈት",
    cancelBtn: "ሰርዝ እና ውጣ",
    errorInvalid: "የተሳሳተ የአስተዳዳሪ ይለፍ ቃል። መዳረሻ ተከልክሏል።",
  },
  ar: {
    gateTitle: "بوابة الأمان الإدارية",
    gateSubtitle: "تحتوي هذه المنطقة على أدوات تشغيلية مقيدة لسوق الإنترنت العالمي. يرجى إعادة المصادقة بإدخال كلمة مرور المسؤول للمتابعة.",
    passwordLabel: "كلمة مرور المسؤول",
    passwordPlaceholder: "أدخل كلمة مرور المسؤول",
    unlockBtn: "إلغاء قفل اللوحة",
    cancelBtn: "إلغاء وخروج",
    errorInvalid: "كلمة مرور المسؤول غير صالحة. تم رفض الوصول.",
  },
  zh: {
    gateTitle: "系统管理员安全网关",
    gateSubtitle: "此区域包含受限的全球市场运营工具。请重新输入管理员密码以继续访问。",
    passwordLabel: "管理员密码",
    passwordPlaceholder: "输入管理员密码",
    unlockBtn: "解锁控制台",
    cancelBtn: "取消并退出",
    errorInvalid: "管理员密码不正确。拒绝访问。",
  },
  es: {
    gateTitle: "Puerta de Seguridad Administrativa",
    gateSubtitle: "Esta área contiene herramientas operativas restringidas del mercado global. Vuelva a autenticarse ingresando su contraseña de administrador para continuar.",
    passwordLabel: "Contraseña de Administrador",
    passwordPlaceholder: "Ingrese la contraseña de administrador",
    unlockBtn: "Desbloquear Consola",
    cancelBtn: "Cancelar y Salir",
    errorInvalid: "Contraseña de administrador no válida. Acceso denegado.",
  },
  fr: {
    gateTitle: "Portail de Sécurité Administratif",
    gateSubtitle: "Cette zone contient des outils opérationnels restreints du marché mondial. Veuillez vous réauthentifier en saisissant votre mot de passe administrateur pour continuer.",
    passwordLabel: "Mot de passe Administrateur",
    passwordPlaceholder: "Saisir le mot de passe",
    unlockBtn: "Déverrouiller la Console",
    cancelBtn: "Annuler et Quitter",
    errorInvalid: "Mot de passe administrateur incorrect. Accès refusé.",
  },
  sw: {
    gateTitle: "Lango la Usalama la Utawala",
    gateSubtitle: "Eneo hili lina zana za uendeshaji zilizozuiliwa za soko la kimataifa. Tafadhali thibitisha upya kwa kuingiza nenosiri lako la usimamizi ili kuendelea.",
    passwordLabel: "Nenosiri la Usimamizi",
    passwordPlaceholder: "Weka nenosiri la usimamizi",
    unlockBtn: "Fungua Jopo",
    cancelBtn: "Ghairi na Toka",
    errorInvalid: "Nenosiri la usimamizi si sahihi. Ufikiaji umekataliwa.",
  },
  so: {
    gateTitle: "Albaabka Amniga Maamulka",
    gateSubtitle: "Goobtan waxay ka kooban tahay qalab hawleed xaddidan oo suuqa caalamiga ah. Fadlan mar kale is-xaqiiji adigoo gelaya eraygaaga sirta ah ee maamulka si aad u sii waddo.",
    passwordLabel: "Erayga Sirta ah ee Maamulaha",
    passwordPlaceholder: "Geli erayga sirta ah ee maamulka",
    unlockBtn: "Furo Guddiga",
    cancelBtn: "Jooji & Kabax",
    errorInvalid: "Erayga sirta ah ee maamulaha waa khalad. Helitaanka waa la diiday.",
  },
  pt: {
    gateTitle: "Portal de Segurança Administrativa",
    gateSubtitle: "Esta área contém ferramentas operacionais restritas do mercado global. Por favor, reautentique-se digitando sua senha de administrador para continuar.",
    passwordLabel: "Senha do Administrador",
    passwordPlaceholder: "Digite a senha do administrador",
    unlockBtn: "Desbloquear Painel",
    cancelBtn: "Cancelar e Sair",
    errorInvalid: "Senha de administrador inválida. Acesso negado.",
  }
};

interface AdminConsoleProps {
  onExit?: () => void;
}

const resizeImageBase64 = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions preserving aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onExit }) => {
  const { 
    users, 
    transactions, 
    supportMessages, 
    auditLogs, 
    scalingMultiplier, 
    systemReports,
    approveTransaction, 
    rejectTransaction, 
    updateScalingMultiplier, 
    updateProductCost, 
    updateAllProductCosts,
    addAnnouncement, 
    deleteAnnouncement, 
    replyToSupport,
    adjustUserBalance,
    productCosts,
    rechargeAccounts,
    addRechargeAccount,
    updateRechargeAccount,
    deleteRechargeAccount,
    bankLogos,
    marketplaceLogos,
    updateBankLogo,
    updateMarketplaceLogo,
    deleteBankLogo,
    deleteMarketplaceLogo,
    formatPrice,
    currency,
    currentUser,
    language,
    adminChangeUserPassword,
    adminDeleteUser,
    adminUpdateUserStage
  } = useApp();

  const { t } = useTranslation(language);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    const hashed = sha256(passwordInput);
    // Explicitly require the admin-specific console password '852121'
    const targetHash = "2b03c89806148889482ecec643b5d0e5fcf3b7b7c87ae5d8b6bfa34e84e1768a";
    
    if (hashed === targetHash) {
      setIsAuthorized(true);
      setErrorMsg('');
    } else {
      const st = securityTranslations[language] || securityTranslations.en;
      setErrorMsg(st.errorInvalid);
    }
  };

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'recharges' | 'withdrawals' | 'orders' | 'announcements' | 'support' | 'reports' | 'logos'>('recharges');
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  
  // Status filters for recharges and withdrawals
  const [rechargeStatusFilter, setRechargeStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [annSuccess, setAnnSuccess] = useState(false);

  const [supportReplies, setSupportReplies] = useState<{ [ticketId: string]: string }>({});
  const [adjustAmounts, setAdjustAmounts] = useState<{ [userId: string]: string }>({});

  // Helper state variables for admin user account management
  const [userPasswordInputs, setUserPasswordInputs] = useState<{ [userId: string]: string }>({});
  const [userStageInputs, setUserStageInputs] = useState<{ [userId: string]: string }>({});
  const [userFeedback, setUserFeedback] = useState<{ [userId: string]: { type: 'success' | 'error'; message: string } }>({});
  const [expandedInvites, setExpandedInvites] = useState<{ [userId: string]: boolean }>({});

  // Recharge Accounts Form State
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [formBank, setFormBank] = useState('');
  const [formAccName, setFormAccName] = useState('');
  const [formAccNo, setFormAccNo] = useState('');

  const editAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setFormBank(acc.bank);
    setFormAccName(acc.accName);
    setFormAccNo(acc.accNo);
    setIsAddingAccount(false);
  };

  const cancelForm = () => {
    setIsAddingAccount(false);
    setEditingAccountId(null);
    setFormBank('');
    setFormAccName('');
    setFormAccNo('');
  };

  const saveAccount = () => {
    if (!formBank.trim() || !formAccName.trim() || !formAccNo.trim()) {
      alert("Please fill in all bank details.");
      return;
    }

    if (editingAccountId !== null) {
      updateRechargeAccount(editingAccountId, formBank, formAccName, formAccNo);
    } else {
      addRechargeAccount(formBank, formAccName, formAccNo);
    }
    cancelForm();
  };

  if (!isAuthorized) {
    const st = securityTranslations[language] || securityTranslations.en;
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 min-h-[400px]">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center"
        >
          {/* Logo / Lock Indicator */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center shadow-lg relative">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-amber-500/5 rounded-full"
              />
              <ShieldCheck size={32} className="text-amber-500" />
            </div>
          </div>

          <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 mb-2">
            {st.gateTitle}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {st.gateSubtitle}
          </p>

          <form onSubmit={handleAuthorize} className="space-y-4">
            <div className="text-left">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 pl-1">
                {st.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={st.passwordPlaceholder}
                  className="w-full bg-slate-950 text-white placeholder-slate-600 border border-slate-800 focus:border-amber-500/50 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all pr-12 font-mono"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <Terminal size={16} />
                </div>
              </div>
            </div>

            {errorMsg && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-bold text-rose-500 pl-1 text-left flex items-center gap-1.5"
              >
                ⚠️ {errorMsg}
              </motion.p>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                disabled={!passwordInput.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-amber-500/5 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} /> {st.unlockBtn}
              </button>

              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="w-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-slate-800"
                >
                  {st.cancelBtn}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const pendingRecharges = transactions.filter(t => t.type === 'recharge' && t.status === 'pending');
  const approvedRecharges = transactions.filter(t => t.type === 'recharge' && t.status === 'approved');
  const rejectedRecharges = transactions.filter(t => t.type === 'recharge' && t.status === 'rejected');

  const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');
  const approvedWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'approved');
  const rejectedWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'rejected');
  
  const filteredUsers = users.filter(u => 
    u.phoneNumber.includes(searchQuery) || 
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    addAnnouncement(newAnnTitle, newAnnContent);
    setNewAnnTitle('');
    setNewAnnContent('');
    setAnnSuccess(true);
    setTimeout(() => setAnnSuccess(false), 2000);
  };

  const handleSupportReplySubmit = (ticketId: string) => {
    const reply = supportReplies[ticketId];
    if (!reply || !reply.trim()) return;

    replyToSupport(ticketId, reply);
    setSupportReplies(prev => {
      const copy = { ...prev };
      delete copy[ticketId];
      return copy;
    });
  };

  const handleAdjustUserBalanceSubmit = (userId: string, isAddition: boolean) => {
    const rawVal = adjustAmounts[userId];
    const val = Number(rawVal);
    if (!rawVal || isNaN(val) || val <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    adjustUserBalance(userId, isAddition ? val : -val);
    setAdjustAmounts(prev => ({ ...prev, [userId]: '' }));
    alert(`Successfully ${isAddition ? 'added' : 'deducted'} ${val} ETB ${isAddition ? 'to' : 'from'} user's balance.`);
  };

  const handleAdminChangePasswordSubmit = async (userId: string) => {
    const pwd = userPasswordInputs[userId];
    if (!pwd || pwd.trim().length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }
    const res = await adminChangeUserPassword(userId, pwd.trim());
    if (res.success) {
      setUserPasswordInputs(prev => ({ ...prev, [userId]: '' }));
      setUserFeedback(prev => ({ ...prev, [userId]: { type: 'success', message: 'Password changed successfully!' } }));
      setTimeout(() => {
        setUserFeedback(prev => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }, 4000);
    } else {
      setUserFeedback(prev => ({ ...prev, [userId]: { type: 'error', message: res.message } }));
    }
  };

  const handleAdminUpdateStageSubmit = async (userId: string) => {
    const stageStr = userStageInputs[userId];
    const stageNum = Number(stageStr);
    if (!stageStr || isNaN(stageNum) || stageNum < 1 || stageNum > 15) {
      alert("Please enter a valid level stage from 1 to 15.");
      return;
    }
    const res = await adminUpdateUserStage(userId, stageNum);
    if (res.success) {
      setUserStageInputs(prev => ({ ...prev, [userId]: '' }));
      setUserFeedback(prev => ({ ...prev, [userId]: { type: 'success', message: `Stage updated to Level ${stageNum} successfully!` } }));
      setTimeout(() => {
        setUserFeedback(prev => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }, 4000);
    } else {
      setUserFeedback(prev => ({ ...prev, [userId]: { type: 'error', message: res.message } }));
    }
  };

  const handleAdminDeleteUserSubmit = async (userId: string, userPhone: string) => {
    if (confirm(`⚠️ WARNING: ARE YOU ABSOLUTELY SURE you want to delete user ${formatUserPhoneId(userPhone)}? This will delete their profile permanently from Firestore and cannot be undone.`)) {
      const res = await adminDeleteUser(userId);
      if (res.success) {
        alert("User account deleted successfully.");
      } else {
        alert("Failed to delete user: " + res.message);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      
      {/* ADMIN CONTROL PANEL HEADER */}
      <div className="bg-deep-forest text-white px-5 py-4 shrink-0 shadow-md flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-deep-forest rotate-45"></div>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-500">Administrator Panel</h2>
            <p className="text-[10px] text-slate-300">Live marketplace operations desk</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-900/30">
              ● System Online
            </span>
          </div>
          {onExit && (
            <button
              onClick={onExit}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl border border-rose-500/20 flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <X size={12} /> Exit Operations
            </button>
          )}
        </div>
      </div>

      {/* QUICK HORIZONTAL NAV RAIL */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
        <button
          onClick={() => setActiveAdminSubTab('recharges')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'recharges' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowUpRight size={13} />
          Deposits
          {pendingRecharges.length > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {pendingRecharges.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminSubTab('withdrawals')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'withdrawals' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowDownLeft size={13} />
          Withdraws
          {pendingWithdrawals.length > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {pendingWithdrawals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminSubTab('users')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'users' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users size={13} />
          Users
        </button>

        <button
          onClick={() => setActiveAdminSubTab('orders')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'orders' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sliders size={13} />
          Pricing Model
        </button>

        <button
          onClick={() => setActiveAdminSubTab('announcements')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'announcements' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Volume2 size={13} />
          Broadcast
        </button>

        <button
          onClick={() => setActiveAdminSubTab('support')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'support' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Headphones size={13} />
          Support
        </button>

        <button
          onClick={() => setActiveAdminSubTab('reports')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'reports' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Activity size={13} />
          Log & Reports
        </button>

        <button
          onClick={() => setActiveAdminSubTab('logos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'logos' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Settings size={13} />
          Customize Logos
        </button>
      </div>

      {/* ADMIN SUB-VIEW AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* RECHARGE VERIFICATION QUEUE */}
        {activeAdminSubTab === 'recharges' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                  📥 Deposits Operations Desk
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Review, verify, and track the CBE, Dashen, Awash, or Abyssinia manual deposits.
                </p>
              </div>

              {/* Status filter segmented control */}
              <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setRechargeStatusFilter('pending')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    rechargeStatusFilter === 'pending'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pending ({pendingRecharges.length})
                </button>
                <button
                  onClick={() => setRechargeStatusFilter('approved')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    rechargeStatusFilter === 'approved'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Approved ({approvedRecharges.length})
                </button>
                <button
                  onClick={() => setRechargeStatusFilter('rejected')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    rechargeStatusFilter === 'rejected'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Rejected ({rejectedRecharges.length})
                </button>
              </div>
            </div>

            {(rechargeStatusFilter === 'pending' ? pendingRecharges :
              rechargeStatusFilter === 'approved' ? approvedRecharges :
              rejectedRecharges).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-bold">
                No {rechargeStatusFilter} recharges found.
              </div>
            ) : (
              (rechargeStatusFilter === 'pending' ? pendingRecharges :
               rechargeStatusFilter === 'approved' ? approvedRecharges :
               rejectedRecharges).map(tx => (
                <div key={tx.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{tx.bankName}</span>
                        {tx.status === 'approved' && (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">Approved</span>
                        )}
                        {tx.status === 'rejected' && (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase">Rejected</span>
                        )}
                        {tx.status === 'pending' && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase">Pending</span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <span className="block text-[10px] text-slate-500">User ID: <span className="font-mono text-slate-700 font-bold">{tx.userId}</span></span>
                        <span className="block text-[10px] text-slate-500">Phone (Raw): <span className="font-bold text-slate-700">{tx.userPhone}</span></span>
                        <span className="block text-[10px] text-slate-500">Phone (Hidden): <span className="font-bold text-slate-700">{formatUserPhoneId(tx.userPhone)}</span></span>
                        <span className="block text-[10px] text-amber-900 font-black mt-0.5">TXID / Reference: {tx.accountNumberOrRef}</span>
                        <span className="block text-[9px] text-slate-400 font-bold">Created: {new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                      {tx.screenshot && (
                        <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                          <span className="block text-[9px] text-slate-500 font-extrabold mb-1 uppercase tracking-wider">Uploaded Screenshot:</span>
                          <button
                            type="button"
                            onClick={() => setActiveScreenshot(tx.screenshot)}
                            className="block cursor-zoom-in text-left border border-slate-200 rounded-lg overflow-hidden relative group"
                          >
                            <img 
                              src={tx.screenshot} 
                              alt="Payment Receipt" 
                              className="max-h-36 rounded-lg object-contain border border-slate-200 hover:opacity-90 transition-opacity" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold gap-1">
                              🔎 Click to Zoom
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-base font-black text-emerald-600">
                      +{tx.amount.toLocaleString()} ETB
                    </span>
                  </div>

                  {tx.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100 justify-end">
                      <button
                        onClick={() => rejectTransaction(tx.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 border border-red-200/50 cursor-pointer"
                      >
                        <X size={14} /> Reject Payment
                      </button>
                      <button
                        onClick={() => approveTransaction(tx.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow cursor-pointer"
                      >
                        <Check size={14} /> Approve CBE / Bank Transfer
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* RECHARGE ACCOUNTS CONFIGURATION */}
            <div className="pt-4 border-t border-slate-200 mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                    💳 Receiving Bank Accounts Config
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Manage the receiving bank accounts that users see and copy during deposit/recharge.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAddingAccount(true);
                    setEditingAccountId(null);
                    setFormBank('');
                    setFormAccName('');
                    setFormAccNo('');
                  }}
                  className="bg-bronze hover:bg-bronze-hover text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                >
                  <Plus size={12} /> Add Bank Account
                </button>
              </div>

              {/* Form to add or edit an account */}
              {(isAddingAccount || editingAccountId !== null) && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-inner">
                  <span className="text-xs font-black text-slate-700 block">
                    {editingAccountId !== null ? '✏️ Edit Bank Account' : '➕ Add New Bank Account'}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Commercial Bank of Ethiopia (CBE)"
                        value={formBank}
                        onChange={(e) => setFormBank(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. GOM"
                        value={formAccName}
                        onChange={(e) => setFormAccName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 1000552233445"
                        value={formAccNo}
                        onChange={(e) => setFormAccNo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={cancelForm}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveAccount}
                      className="bg-bronze hover:bg-bronze-hover text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Check size={14} /> Save Account
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts list */}
              <div className="space-y-2">
                {rechargeAccounts.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 font-bold py-4">
                    No receiving accounts configured. Users will not be able to deposit!
                  </div>
                ) : (
                  rechargeAccounts.map(acc => (
                    <div key={acc.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="block text-xs font-black text-slate-800">{acc.bank}</span>
                        <span className="block text-[10px] text-slate-400 font-bold mt-0.5">Account: {acc.accNo}</span>
                        <span className="block text-[10px] text-bronze font-bold mt-0.5">Name: {acc.accName}</span>
                      </div>
                      <div className="flex gap-2 justify-end self-end sm:self-center">
                        <button
                          onClick={() => editAccount(acc)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => deleteRechargeAccount(acc.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* WITHDRAWAL APPROVAL QUEUE */}
        {activeAdminSubTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                  📤 Withdrawals Operations Desk
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Review, approve, and track user withdrawal payout requests.
                </p>
              </div>

              {/* Status filter segmented control */}
              <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setWithdrawStatusFilter('pending')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    withdrawStatusFilter === 'pending'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pending ({pendingWithdrawals.length})
                </button>
                <button
                  onClick={() => setWithdrawStatusFilter('approved')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    withdrawStatusFilter === 'approved'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Approved ({approvedWithdrawals.length})
                </button>
                <button
                  onClick={() => setWithdrawStatusFilter('rejected')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    withdrawStatusFilter === 'rejected'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Rejected ({rejectedWithdrawals.length})
                </button>
              </div>
            </div>

            {(withdrawStatusFilter === 'pending' ? pendingWithdrawals :
              withdrawStatusFilter === 'approved' ? approvedWithdrawals :
              rejectedWithdrawals).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-bold">
                No {withdrawStatusFilter} withdrawals found.
              </div>
            ) : (
              (withdrawStatusFilter === 'pending' ? pendingWithdrawals :
               withdrawStatusFilter === 'approved' ? approvedWithdrawals :
               rejectedWithdrawals).map(tx => (
                <div key={tx.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-deep-forest">{tx.bankName}</span>
                        {tx.status === 'approved' && (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">Approved</span>
                        )}
                        {tx.status === 'rejected' && (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase">Rejected</span>
                        )}
                        {tx.status === 'pending' && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase">Pending</span>
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium mr-1">Withdrawal Bank:</span>
                          <span className="font-black text-slate-800">{tx.bankName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium mr-1">Withdrawal Account Number:</span>
                          <span className="font-black text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">{tx.accountNumberOrRef}</span>
                        </div>
                        {(() => {
                          const matchedUser = users.find(u => u.id === tx.userId);
                          const holderName = tx.accountHolderName || matchedUser?.withdrawalAccName;
                          if (holderName) {
                            return (
                              <div>
                                <span className="text-slate-400 font-medium mr-1">Account Holder Name:</span>
                                <span className="font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/30">{holderName}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <div>
                          <span className="text-slate-400 font-medium mr-1">User Phone (Raw):</span>
                          <span className="font-bold text-slate-800">{tx.userPhone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium mr-1">User Phone (Hidden):</span>
                          <span className="font-bold text-slate-800">{formatUserPhoneId(tx.userPhone)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium mr-1">User ID:</span>
                          <span className="font-mono text-slate-800 font-bold">{tx.userId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium mr-1">Created:</span>
                          <span className="text-slate-600 font-medium">{new Date(tx.createdAt).toLocaleString()}</span>
                        </div>
                        {tx.description && (
                          <div className="text-[11px] text-slate-500 italic mt-1 border-t border-slate-200/60 pt-1">
                            "{tx.description}"
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-base font-black text-red-600 shrink-0">
                      -{tx.amount.toLocaleString()} ETB
                    </span>
                  </div>

                  {tx.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100 justify-end">
                      <button
                        onClick={() => rejectTransaction(tx.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 border border-red-200/50 cursor-pointer"
                      >
                        <X size={14} /> Reject & Refund Payout
                      </button>
                      <button
                        onClick={() => approveTransaction(tx.id)}
                        className="bg-bronze hover:bg-bronze-hover text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow cursor-pointer"
                      >
                        <Check size={14} /> Mark Payout Complete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* USER DIRECTORY MANAGEMENT */}
        {activeAdminSubTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-700">👥 User Accounts Directory</h3>
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full">
                {users.length} Registered
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search phone number or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-bronze font-medium text-slate-700"
              />
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-slate-800">{formatUserPhoneId(user.phoneNumber)}</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-amber-100 text-amber-950' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 text-[10px]">
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Balance</span>
                      <span className="font-extrabold text-slate-700">{formatPrice(user.walletBalance)}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Earnings</span>
                      <span className="font-extrabold text-slate-700">{formatPrice(user.totalEarnings)}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Task Stage</span>
                      <span className="font-extrabold text-bronze">Order {Math.min(15, user.currentOrderIndex + 1)}/15</span>
                    </div>
                  </div>

                  {/* Registered Withdrawal Account details */}
                  {user.withdrawalAccNo && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-[10px] text-slate-600 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
                        💳 Registered Withdrawal Account
                      </span>
                      <div>
                        <span className="text-slate-400 font-medium mr-1">Bank:</span>
                        <span className="font-extrabold text-slate-800">{user.withdrawalBank}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium mr-1">Account Number:</span>
                        <span className="font-mono font-extrabold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/30">{user.withdrawalAccNo}</span>
                      </div>
                      {user.withdrawalAccName && (
                        <div>
                          <span className="text-slate-400 font-medium mr-1">Account Holder Name:</span>
                          <span className="font-extrabold text-slate-800">{user.withdrawalAccName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invited Users List */}
                  {(() => {
                    const invitedPersons = users.filter(u => u.referredBy === user.id || u.referredBy === user.phoneNumber);
                    const invitedCount = invitedPersons.length;
                    return (
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedInvites(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                          className="w-full flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                        >
                          <span className="flex items-center gap-1 text-slate-600">
                            👥 Invited Partners ({invitedCount})
                          </span>
                          <span className="text-slate-400 font-extrabold">{expandedInvites[user.id] ? '▼ Hide' : '▶ Show'}</span>
                        </button>
                        
                        {expandedInvites[user.id] && (
                          <div className="pt-1.5 space-y-1.5 border-t border-slate-200/60 max-h-[160px] overflow-y-auto pr-0.5">
                            {invitedCount === 0 ? (
                              <div className="text-[10px] text-slate-400 text-center py-1 font-semibold italic">No invites yet.</div>
                            ) : (
                              invitedPersons.map(member => (
                                <div key={member.id} className="bg-white border border-slate-100 rounded-lg p-2 flex justify-between items-center text-[10px] shadow-xs">
                                  <div className="space-y-0.5">
                                    <div className="font-extrabold text-slate-800">
                                      {formatUserPhoneId(member.phoneNumber)}
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-bold">
                                      Joined: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                  <div className="text-right space-y-0.5">
                                    <div className="font-extrabold text-slate-700">
                                      {formatPrice(member.walletBalance)}
                                    </div>
                                    <div className="text-[8px] text-bronze font-black">
                                      Order {Math.min(15, member.currentOrderIndex + 1)}/15
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Manual Balance Adjustment */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                      🛠️ Manual Balance Adjustment
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount in ETB (e.g. 588)"
                        value={adjustAmounts[user.id] || ''}
                        onChange={(e) => setAdjustAmounts(prev => ({ ...prev, [user.id]: e.target.value }))}
                        className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-bronze"
                      />
                      <button
                        onClick={() => handleAdjustUserBalanceSubmit(user.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-lg active:scale-95 transition-all whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => handleAdjustUserBalanceSubmit(user.id, false)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-lg active:scale-95 transition-all whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        - Reduce
                      </button>
                    </div>
                  </div>

                  {/* Change User Password & Adjust Task Stage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Password change block */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                        🔑 Change User Password
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="New password..."
                          value={userPasswordInputs[user.id] || ''}
                          onChange={(e) => setUserPasswordInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-bronze"
                        />
                        <button
                          onClick={() => handleAdminChangePasswordSubmit(user.id)}
                          className="bg-slate-700 hover:bg-slate-800 text-white font-black text-[10px] uppercase px-2.5 py-1.5 rounded-lg active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Stage Adjustment block */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                        🎯 Adjust Task Stage
                      </span>
                      <div className="flex gap-1.5">
                        <select
                          value={userStageInputs[user.id] || ''}
                          onChange={(e) => setUserStageInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-bronze"
                        >
                          <option value="">Select Level...</option>
                          {Array.from({ length: 15 }, (_, i) => i + 1).map(level => (
                            <option key={level} value={level}>Level {level}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAdminUpdateStageSubmit(user.id)}
                          className="bg-bronze text-white font-black text-[10px] uppercase px-2.5 py-1.5 rounded-lg active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {userFeedback[user.id] && (
                    <div className={`p-2 rounded-lg text-center text-xs font-bold leading-tight ${
                      userFeedback[user.id].type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {userFeedback[user.id].message}
                    </div>
                  )}

                  {/* Danger Zone: Delete Account */}
                  <div className="pt-1.5 flex justify-between items-center border-t border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold">UID: <span className="font-mono">{user.id}</span></span>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleAdminDeleteUserSubmit(user.id, user.phoneNumber)}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer border border-rose-200/50"
                      >
                        <Trash2 size={10} />
                        Delete Account
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDER PRICING MODEL CONFIG */}
        {activeAdminSubTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
              📈 Sequential Pricing scaling config
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Adjust the multiplier that automatically scales successive order material costs progressively, preventing manual calculations.
            </p>

            {/* Scaling Multiplier Setting */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Progressive Scaling Multiplier (e.g. 1.5 = +50%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1.1"
                    max="3"
                    value={scalingMultiplier}
                    onChange={(e) => updateScalingMultiplier(Number(e.target.value))}
                    className="w-24 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                  <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-[10px] text-slate-500 font-medium flex items-center justify-between">
                    <span>Multiplier factor: {scalingMultiplier}x per order stage.</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentL1Prod = productCosts.find(p => p.id === 1);
                        const currentL1Cost = currentL1Prod?.baseCost || 975;
                        if (confirm(`Are you sure you want to reset and auto-scale all level material costs progressively using this multiplier? Level 1 cost of ${currentL1Cost} ETB will be used as the base, and Level 2-15 will be dynamically scaled and progressive constraints will be enforced.`)) {
                          const newCosts = [];
                          const base = currentL1Cost;
                          for (let level = 1; level <= 15; level++) {
                            const cost = Math.round(base * Math.pow(scalingMultiplier, level - 1));
                            const defaultPct = level === 1 ? 25 : 
                                               level === 2 ? 27 : 
                                               level === 3 ? 30 : 
                                               level === 4 ? 32 : 
                                               level === 5 ? 35 : 
                                               level === 6 ? 38 : 
                                               level === 7 ? 40 : 40;
                            newCosts.push({
                              id: level,
                              baseCost: cost,
                              rewardMultiplier: defaultPct / 100
                            });
                          }
                          updateAllProductCosts(newCosts);
                          alert("All 15 product level costs and commissions have been auto-scaled successfully with progressive constraints!");
                        }
                      }}
                      className="bg-bronze hover:bg-bronze-hover text-white text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-extrabold ml-2"
                    >
                      ⚡ Auto-Scale All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Helpful progression constraint info alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-800 space-y-1 shadow-sm leading-relaxed">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-900 block">📊 Progressive Rule Enforced:</span>
              <p>
                To maintain a healthy platform economy, the system guarantees that the price of each order level is strictly greater than the previous level's total return (payout = material cost + reward commission). If an edit or scaling multiplier violates this rule, subsequent levels will automatically scale upwards to preserve proper progression.
              </p>
            </div>

            {/* Individual base costs update */}
            <div className="space-y-2.5">
              <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Configure Base Level & Rewards</span>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((level) => {
                const currentProd = productCosts.find(p => p.id === level);
                const currentCost = currentProd?.baseCost || 975;
                const currentRewardPercent = Math.round((currentProd?.rewardMultiplier || 0.15) * 100);

                return (
                  <div key={level} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">Product Order Level #{level}</span>
                      <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Fully Customizable Cost & Commission
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Material Cost (ETB)</label>
                        <input
                          type="number"
                          value={currentCost}
                          onChange={(e) => updateProductCost(level, Number(e.target.value), currentRewardPercent)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Commission Percent (%)</label>
                        <input
                          type="number"
                          value={currentRewardPercent}
                          onChange={(e) => updateProductCost(level, currentCost, Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENT BROADCAST CENTER */}
        {activeAdminSubTab === 'announcements' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-700">📢 Announcement Broadcast Center</h3>

            {/* Announcement form */}
            <form onSubmit={handleCreateAnnouncement} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              {annSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold border border-emerald-100">
                  Announcement broadcasted successfully!
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBE Bank Holiday Details"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Message Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type official system broadcast message details..."
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-bronze hover:bg-bronze-hover text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Broadcast Announcement
              </button>
            </form>
          </div>
        )}

        {/* CUSTOMER SUPPORT VERIFICATION replies */}
        {activeAdminSubTab === 'support' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-700">💬 Customer Support Ticket Board</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Answer user questions regarding deposits and payout delays directly.
            </p>

            {supportMessages.filter(m => m.status === 'open').length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-bold">
                No open customer support tickets.
              </div>
            ) : (
              supportMessages.filter(m => m.status === 'open').map(ticket => (
                <div key={ticket.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs font-black text-slate-800">{ticket.subject}</span>
                      <span className="block text-[10px] text-slate-400 font-bold mt-0.5">From User: {formatUserPhoneId(ticket.userPhone)}</span>
                    </div>
                    <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full uppercase">
                      Open
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {ticket.message}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Reply as Administrator</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Transfer verified, funds credited..."
                        value={supportReplies[ticket.id] || ''}
                        onChange={(e) => setSupportReplies(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                      />
                      <button
                        onClick={() => handleSupportReplySubmit(ticket.id)}
                        className="bg-bronze hover:bg-bronze-hover text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center shrink-0 cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* LEDGER AND SYSTEM STATS REPORTS */}
        {activeAdminSubTab === 'reports' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-700">📊 Market Platform System Reports</h3>

            {/* Quick Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Total Users</span>
                <span className="text-base font-black text-slate-800">{systemReports.totalUsers}</span>
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Deposits Paid</span>
                <span className="text-base font-black text-emerald-700">{systemReports.totalRecharged} ETB</span>
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Payouts Settled</span>
                <span className="text-base font-black text-red-600">{systemReports.totalWithdrawn} ETB</span>
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Commissions Paid</span>
                <span className="text-base font-black text-amber-900">{systemReports.totalRewardsDistributed} ETB</span>
              </div>
            </div>

            {/* Real-time scrollable system-wide audit logs */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Terminal size={14} /> Cryptographic Audit Ledger
              </span>
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[10px] space-y-2 h-72 overflow-y-auto border border-slate-800 shadow-inner">
                {auditLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5 pb-2 border-b border-slate-800/60 leading-relaxed">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-black">
                      <span>[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                      <span>{log.id}</span>
                    </div>
                    <div className="font-extrabold text-slate-300">
                      ACTION: {log.action} | PHONE: {formatUserPhoneId(log.userPhone)}
                    </div>
                    <p className="text-emerald-300/85">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMIZE LOGOS SUB-VIEW */}
        {activeAdminSubTab === 'logos' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                🖼️ Customize Bank & Marketplace Logos
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Upload custom local image files or enter image URLs to dynamically change bank logos and homepage marketplace banners in real-time.
              </p>
            </div>

            {/* Marketplace Logos Sections */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Marketplace Platforms Banners (Homepage)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(marketplaceLogos || {}).map((marketKey) => {
                  const currentLogo = marketplaceLogos[marketKey];
                  const marketLabel = marketKey.toUpperCase();
                  
                  return (
                    <div key={marketKey} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200/60 p-2 flex items-center justify-center shrink-0">
                          <img 
                            src={currentLogo} 
                            alt={marketLabel} 
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-extrabold text-slate-700 block capitalize">{marketLabel} Banner</span>
                          <span className="text-[10px] text-slate-400">Appears in integrated global marketplaces grid</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteMarketplaceLogo(marketKey)}
                          title="Reset to default logo"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer flex items-center justify-center border border-slate-200 hover:border-rose-200 shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* URL input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Image URL</label>
                          <input 
                            type="text" 
                            defaultValue={currentLogo.startsWith('data:') ? '' : currentLogo}
                            placeholder={currentLogo.startsWith('data:') ? 'Base64 Encoded (File Uploaded)' : 'Enter image HTTP/HTTPS URL...'}
                            onChange={(e) => {
                              if (e.target.value.trim()) {
                                updateMarketplaceLogo(marketKey, e.target.value.trim());
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-bronze"
                          />
                        </div>

                        {/* File upload */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Or Upload Local Image File</label>
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    if (typeof reader.result === 'string') {
                                      const resized = await resizeImageBase64(reader.result);
                                      updateMarketplaceLogo(marketKey, resized);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-slate-500 text-[10px] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bank Logos Sections */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Dynamic Bank Partners Logos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'cbe', label: 'Commercial Bank of Ethiopia (CBE)' },
                  { key: 'dashen', label: 'Dashen Bank' },
                  { key: 'abyssinia', label: 'Bank of Abyssinia (BoA)' },
                  { key: 'awash', label: 'Awash Bank' },
                  { key: 'telebirr', label: 'Telebirr Mobile Money' },
                  { key: 'hibret', label: 'Hibret Bank' },
                  { key: 'wegagen', label: 'Wegagen Bank' },
                  { key: 'oromia', label: 'Cooperative Bank of Oromia' }
                ].map((bankInfo) => {
                  const currentLogo = bankLogos[bankInfo.key] || '';
                  
                  return (
                    <div key={bankInfo.key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200/60 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {currentLogo ? (
                            <img 
                              src={currentLogo} 
                              alt={bankInfo.label} 
                              className="max-w-full max-h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-extrabold">No Logo</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-extrabold text-slate-700 block">{bankInfo.label}</span>
                          <span className="text-[10px] text-slate-400">Used across recharges and withdrawals</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteBankLogo(bankInfo.key)}
                          title="Reset to default logo"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer flex items-center justify-center border border-slate-200 hover:border-rose-200 shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* URL input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Image URL</label>
                          <input 
                            type="text" 
                            defaultValue={currentLogo.startsWith('data:') ? '' : currentLogo}
                            placeholder={currentLogo.startsWith('data:') ? 'Base64 Encoded (File Uploaded)' : 'Enter image HTTP/HTTPS URL...'}
                            onChange={(e) => {
                              if (e.target.value.trim()) {
                                updateBankLogo(bankInfo.key, e.target.value.trim());
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-bronze"
                          />
                        </div>

                        {/* File upload */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Or Upload Local Image File</label>
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    if (typeof reader.result === 'string') {
                                      const resized = await resizeImageBase64(reader.result);
                                      updateBankLogo(bankInfo.key, resized);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-slate-500 text-[10px] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* SCREENSHOT LIGHTBOX MODAL */}
      <AnimatePresence>
        {activeScreenshot && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 max-w-lg w-full flex flex-col space-y-4 border border-slate-100 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase tracking-widest text-bronze">Payment Receipt Proof</span>
                <button
                  type="button"
                  onClick={() => setActiveScreenshot(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-auto max-h-[65vh] flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-200">
                <img
                  src={activeScreenshot}
                  alt="Receipt Fullscreen"
                  className="max-h-[60vh] object-contain rounded-xl shadow-lg border border-slate-200/50"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveScreenshot(null)}
                  className="bg-bronze hover:bg-bronze-hover text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
