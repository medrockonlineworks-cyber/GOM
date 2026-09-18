/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp, isSamePhone } from '../context/AppContext';
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
  Edit,
  Gift,
  Copy,
  KeyRound,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap
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
    adminUpdateUserStage,
    adminGeneratedCodes,
    usedCodes,
    generateOfflineRechargeCode,
    adminGiftCodes,
    generateAdminGiftCode,
    deleteAdminGiftCode,
    unlockCodes,
    generateUnlockCode,
    deleteUnlockCode,
    generateOrderCode,
    generateWhiteScreenCode,
    restoreUserAccess,
    revokeUnlockCode,
    reactivateUserAccount,
    toggleUserWhiteScreen,
    releaseWhiteScreen,
    isWhiteScreenLocked,
    adminCreateUser,
    isAdminDevice
  } = useApp();

  const { t } = useTranslation(language);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Admin Account Creation States (Bypassing single-device restriction)
  const [showCreateUserSection, setShowCreateUserSection] = useState(false);
  const [newAccountPhone, setNewAccountPhone] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('123456');
  const [newAccountBalance, setNewAccountBalance] = useState('750');
  const [newAccountReferral, setNewAccountReferral] = useState('');
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [createAccountSuccess, setCreateAccountSuccess] = useState('');
  const [createAccountError, setCreateAccountError] = useState('');

  const handleAdminCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAccountError('');
    setCreateAccountSuccess('');
    if (!newAccountPhone.trim()) {
      setCreateAccountError('Please enter a phone number.');
      return;
    }
    setCreateAccountLoading(true);
    try {
      const res = await adminCreateUser(
        newAccountPhone.trim(),
        newAccountPassword.trim() || '123456',
        Number(newAccountBalance) || 750,
        newAccountReferral.trim() || undefined
      );
      if (res.success) {
        setCreateAccountSuccess(`Account created successfully for ${newAccountPhone.trim()}! Balance: ${newAccountBalance} ETB.`);
        setNewAccountPhone('');
        setNewAccountPassword('123456');
        setNewAccountBalance('750');
        setNewAccountReferral('');
      } else {
        setCreateAccountError(res.message || 'Failed to create user account.');
      }
    } catch (err: any) {
      setCreateAccountError(err.message || 'An error occurred during account creation.');
    } finally {
      setCreateAccountLoading(false);
    }
  };

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

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'recharges' | 'withdrawals' | 'orders' | 'announcements' | 'support' | 'reports' | 'logos' | 'gifts' | 'unlock_codes'>('recharges');
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  // Unlock Code Generator States
  const [unlockType, setUnlockType] = useState<'tax_timelock' | 'next_round' | 'white_screen' | 'order_completion'>('tax_timelock');
  const [unlockPhone, setUnlockPhone] = useState('');
  const [unlockExpiry, setUnlockExpiry] = useState<string>('1440'); // Default 24 hours (1440 mins) like payment verify
  const [unlockCustomCode, setUnlockCustomCode] = useState('');
  const [orderTargetNumber, setOrderTargetNumber] = useState<number>(12);
  const [orderCompletionMode, setOrderCompletionMode] = useState<'up_to' | 'all'>('up_to');
  const [unlockSuccessCode, setUnlockSuccessCode] = useState('');
  const [unlockSuccessMsg, setUnlockSuccessMsg] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [copiedUnlockCode, setCopiedUnlockCode] = useState<string | null>(null);

  const handleGenerateUnlockCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setUnlockSuccessMsg('');
    setUnlockSuccessCode('');

    const targetPhoneClean = unlockPhone.trim() || 'ALL';
    const expiryMinutesNum = Number(unlockExpiry) || 1440;
    const expiresAtIso = expiryMinutesNum > 0 && expiryMinutesNum < 43200 
      ? new Date(Date.now() + expiryMinutesNum * 60 * 1000).toISOString() 
      : undefined;

    if (unlockType === 'order_completion') {
      const res = await generateOrderCode({
        targetPhone: targetPhoneClean,
        orderNumber: orderCompletionMode === 'all' ? 15 : orderTargetNumber,
        mode: orderCompletionMode,
        customCode: unlockCustomCode.trim() || undefined
      });
      if (res.success && res.code) {
        setUnlockSuccessCode(res.code);
        setUnlockSuccessMsg(res.message || `Order completion code generated for ${targetPhoneClean === 'ALL' ? 'Universal (Any Device)' : targetPhoneClean} (Order #${orderCompletionMode === 'all' ? 15 : orderTargetNumber})!`);
        setUnlockCustomCode('');
      } else {
        setUnlockError(res.message || 'Failed to generate order completion code.');
      }
      return;
    }

    let withdrawalAmount: number | undefined;
    let taxAmount: number | undefined;
    let penaltyAmount: number | undefined;
    let totalAmountDue: number | undefined;
    let targetTxId: string | undefined;

    if (unlockType === 'tax_timelock' && targetPhoneClean !== 'ALL') {
      const matchedUser = users.find(u => isSamePhone(u.phoneNumber, targetPhoneClean));
      if (matchedUser) {
        const pendingTx = transactions.find(t => t.userId === matchedUser.id && t.type === 'withdraw' && t.status === 'pending');
        if (pendingTx) {
          targetTxId = pendingTx.id;
          withdrawalAmount = Number(pendingTx.amount);
          taxAmount = Math.round(withdrawalAmount * 0.10 * 100) / 100;
          penaltyAmount = Math.round(taxAmount * 0.50 * 100) / 100;
          totalAmountDue = Math.round((taxAmount + penaltyAmount) * 100) / 100;
        }
      }
    }

    const res = await generateUnlockCode(unlockType, {
      targetPhone: targetPhoneClean,
      targetTxId,
      withdrawalAmount,
      taxAmount,
      penaltyAmount,
      totalAmountDue,
      customCode: unlockCustomCode.trim() || undefined,
      expiresAt: expiresAtIso
    });

    if (res.success && res.code) {
      setUnlockSuccessCode(res.code);
      setUnlockSuccessMsg(res.message || 'Unlock code generated successfully!');
      setUnlockCustomCode('');
    } else {
      setUnlockError(res.message || 'Failed to generate unlock code.');
    }
  };

  // APPLICATION WHITE SCREEN LOCK Generator States
  const [wsTargetUserId, setWsTargetUserId] = useState('');
  const [wsLockReason, setWsLockReason] = useState('');
  const [wsExpiresOption, setWsExpiresOption] = useState<'never' | '1h' | '24h' | '7d' | '30d'>('never');
  const [wsCustomCode, setWsCustomCode] = useState('');
  const [wsSuccessCode, setWsSuccessCode] = useState('');
  const [wsSuccessMsg, setWsSuccessMsg] = useState('');
  const [wsError, setWsError] = useState('');
  const [wsLoading, setWsLoading] = useState(false);
  const [copiedWsCode, setCopiedWsCode] = useState<string | null>(null);

  const handleGenerateWhiteScreenCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWsError('');
    setWsSuccessMsg('');
    setWsSuccessCode('');

    if (!wsTargetUserId.trim()) {
      setWsError('Please select or enter the Target User / Account.');
      return;
    }

    const targetUserObj = users.find(u => u.id === wsTargetUserId.trim() || isSamePhone(u.phoneNumber, wsTargetUserId.trim()));
    if (targetUserObj && (isSamePhone(targetUserObj.phoneNumber, '0951560276') || targetUserObj.role === 'admin')) {
      setWsError('The primary admin account 0951560276 is exempt and cannot be locked out.');
      return;
    }

    let expiresAt: string | undefined;
    if (wsExpiresOption !== 'never') {
      const now = Date.now();
      const durations: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      expiresAt = new Date(now + durations[wsExpiresOption]).toISOString();
    }

    setWsLoading(true);
    const res = await generateWhiteScreenCode({
      targetUserId: wsTargetUserId.trim(),
      lockReason: wsLockReason.trim() || undefined,
      expiresAt,
      customCode: wsCustomCode.trim() || undefined,
    });
    setWsLoading(false);

    if (res.success && res.code) {
      setWsSuccessCode(res.code);
      setWsSuccessMsg(res.message || 'White Screen Lock code generated successfully!');
      setWsCustomCode('');
    } else {
      setWsError(res.message || 'Failed to generate White Screen Lock code.');
    }
  };

  const handleAdminRestoreAccess = async (userId: string, phone?: string) => {
    if (confirm(`Restore application access for ${formatUserPhoneId(phone || userId)}? This will clear the white screen lock and reset their access state to ACTIVE.`)) {
      const res = await restoreUserAccess(userId);
      setUserFeedback(prev => ({
        ...prev,
        [userId]: { type: res.success ? 'success' : 'error', message: res.message }
      }));
      setTimeout(() => {
        setUserFeedback(prev => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }, 4000);
    }
  };

  // Admin Gift Code Generator States
  const [giftTargetPhone, setGiftTargetPhone] = useState('');
  const [giftAmount, setGiftAmount] = useState('500');
  const [giftCustomCode, setGiftCustomCode] = useState('');
  const [giftSuccess, setGiftSuccess] = useState('');
  const [giftError, setGiftError] = useState('');

  const handleGenerateGiftCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGiftError('');
    setGiftSuccess('');

    if (!giftTargetPhone.trim()) {
      setGiftError('Please select or enter a valid user phone number.');
      return;
    }
    const num = parseFloat(giftAmount);
    if (isNaN(num) || num <= 0) {
      setGiftError('Please enter a valid gift amount greater than 0 ETB.');
      return;
    }

    const res = await generateAdminGiftCode(giftTargetPhone, num, giftCustomCode);
    if (res.success) {
      setGiftSuccess(res.message);
      setGiftCustomCode('');
    } else {
      setGiftError(res.message);
    }
  };

  // Offline Code Generator States
  const [genPhone, setGenPhone] = useState('');
  const [genAmount, setGenAmount] = useState('');
  const [genRef, setGenRef] = useState('');
  const [genExpiry, setGenExpiry] = useState('1440'); // default 1 day (1440 minutes)
  const [generatedCodeResult, setGeneratedCodeResult] = useState('');
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');

  // Withdrawal Offline Code Generator States
  const [withdrawGenPhone, setWithdrawGenPhone] = useState('');
  const [withdrawGenAmount, setWithdrawGenAmount] = useState('');
  const [withdrawGenRef, setWithdrawGenRef] = useState('');
  const [withdrawGenExpiry, setWithdrawGenExpiry] = useState('1440'); // default 1 day
  const [withdrawGeneratedCodeResult, setWithdrawGeneratedCodeResult] = useState('');
  const [withdrawGenError, setWithdrawGenError] = useState('');
  const [withdrawGenSuccess, setWithdrawGenSuccess] = useState('');
  
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

  const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw' && (t.status === 'pending' || t.status === 'tax_submitted'));
  const approvedWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'approved');
  const rejectedWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'rejected');
  
  const filteredUsers = (users || []).filter(u => 
    (u?.phoneNumber && typeof u.phoneNumber === 'string' && u.phoneNumber.includes(searchQuery)) || 
    (u?.id && typeof u.id === 'string' && u.id.toLowerCase().includes(searchQuery.toLowerCase()))
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

        <button
          onClick={() => setActiveAdminSubTab('gifts')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'gifts' 
              ? 'bg-bronze text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Gift size={13} />
          🎁 Gift Cards
        </button>

        <button
          onClick={() => setActiveAdminSubTab('unlock_codes')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
            activeAdminSubTab === 'unlock_codes' 
              ? 'bg-amber-600 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <KeyRound size={13} />
          🔓 Unlock Codes
        </button>
      </div>

      {/* ADMIN SUB-VIEW AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* RECHARGE VERIFICATION QUEUE */}
        {activeAdminSubTab === 'recharges' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                📥 Deposits Operations Desk
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Review user deposit requests and issue cryptographically secure offline verification codes.
              </p>
            </div>

            {/* Recharge Code Generator & Tracker Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* CODE GENERATOR FORM (Left 5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    🔑 Recharge Code Generator
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Generate an offline cryptographically signed verification code for a user.
                  </p>
                </div>

                {genError && (
                  <div className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold p-2.5 rounded-xl flex items-center gap-1.5">
                    <X size={12} className="shrink-0" />
                    <span>{genError}</span>
                  </div>
                )}

                {genSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold p-2.5 rounded-xl flex items-center gap-1.5">
                    <Check size={12} className="shrink-0" />
                    <span>{genSuccess}</span>
                  </div>
                )}

                <form onSubmit={(e) => {
                  e.preventDefault();
                  setGenError('');
                  setGenSuccess('');
                  setGeneratedCodeResult('');

                  if (!genPhone.trim()) {
                    setGenError('User phone number is required.');
                    return;
                  }
                  if (!genAmount.trim() || isNaN(Number(genAmount)) || Number(genAmount) <= 0) {
                    setGenError('Valid recharge amount is required.');
                    return;
                  }
                  if (!genRef.trim()) {
                    setGenError('Payment reference or FT number is required.');
                    return;
                  }

                  const res = generateOfflineRechargeCode(
                    genPhone.trim(),
                    Number(genAmount),
                    genRef.trim().toUpperCase(),
                    Number(genExpiry)
                  );

                  if (res.success && res.code) {
                    setGeneratedCodeResult(res.code);
                    setGenSuccess(res.message || 'Code generated successfully.');
                  } else {
                    setGenError(res.message || 'Failed to generate code.');
                  }
                }} className="space-y-3">
                  
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">User Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0926193920"
                      value={genPhone}
                      onChange={(e) => setGenPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">Amount (ETB)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 200"
                        value={genAmount}
                        onChange={(e) => setGenAmount(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-bold text-amber-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">Expiry Time</label>
                      <select
                        value={genExpiry}
                        onChange={(e) => setGenExpiry(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-bold"
                      >
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                        <option value="1440">24 Hours (1 Day)</option>
                        <option value="10080">7 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">Payment Reference / FT Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FT26197HK0DY"
                      value={genRef}
                      onChange={(e) => setGenRef(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-mono font-bold uppercase tracking-wider"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow flex items-center justify-center gap-1 font-sans"
                  >
                    ⚡ Generate Verification Code
                  </button>
                </form>

                {generatedCodeResult && (
                  <div className="bg-amber-100/50 border border-amber-300 rounded-2xl p-4 space-y-3.5 text-center animate-fade-in">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-amber-800 uppercase tracking-widest font-sans">Signed Approval Code</span>
                      <span className="block text-sm font-black text-slate-900 font-mono select-all border border-dashed border-amber-400 bg-white p-2.5 rounded-xl tracking-wider select-all break-all">{generatedCodeResult}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCodeResult);
                          alert('Copied signed code to clipboard!');
                        }}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[9px] py-2 rounded-lg uppercase tracking-wider font-sans cursor-pointer"
                      >
                        📋 Copy Code
                      </button>
                      <a
                        href={`https://wa.me/?text=Hi! Your offline recharge code is: ${encodeURIComponent(generatedCodeResult)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] py-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-0.5 font-sans cursor-pointer"
                      >
                        💬 Send WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* GENERATED CODES LOG (Right 7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    📋 Generated Code Ledger
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Monitor active, used, and expired approval codes in real-time.
                  </p>
                </div>

                <div className="overflow-y-auto max-h-[360px] space-y-2 pr-1">
                  {adminGeneratedCodes.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-300 font-bold font-sans">No generated codes on file.</div>
                  ) : (
                    adminGeneratedCodes.map((item, idx) => {
                      const normalizedCode = (item.code || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
                      const isUsed = Array.isArray(usedCodes) && usedCodes.includes(normalizedCode);
                      const isExpired = !isUsed && new Date() > new Date(item.expiryTime);
                      
                      let statusBadge = (
                        <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans">Active</span>
                      );
                      if (isUsed) {
                        statusBadge = (
                          <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-sans">Used</span>
                        );
                      } else if (isExpired) {
                        statusBadge = (
                          <span className="text-[8px] font-black uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-sans">Expired</span>
                        );
                      }

                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs flex justify-between items-center hover:border-slate-300 transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-800">{item.phone}</span>
                              {statusBadge}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium space-y-0.5 font-sans">
                              <div>Amount: <span className="font-bold text-emerald-600">{item.amount} ETB</span></div>
                              <div>Ref: <span className="font-mono text-slate-600 font-bold">{item.reference}</span></div>
                              <div className="text-[9px] text-slate-400">Expires: {new Date(item.expiryTime).toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.code);
                              alert('Code copied!');
                            }}
                            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[9px] px-2 py-1.5 rounded-md uppercase font-sans cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Separator line */}
            <div className="border-t border-slate-200 my-4"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  📥 User Deposit Requests Queue
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Verify manual transfer requests or auto-sign verification codes for offline validation.
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
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-bold font-sans">
                No {rechargeStatusFilter} recharges found.
              </div>
            ) : (
              (rechargeStatusFilter === 'pending' ? pendingRecharges :
               rechargeStatusFilter === 'approved' ? approvedRecharges :
               rejectedRecharges).map(tx => {
                const existingCodeRecord = adminGeneratedCodes.find(item => 
                  item.phone === tx.userPhone && 
                  item.amount === tx.amount && 
                  (item.reference || '').trim().toUpperCase() === (tx.accountNumberOrRef || '').trim().toUpperCase()
                );
                return (
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

                    {tx.status === 'pending' && existingCodeRecord && (
                      <div className="text-[10px] bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 flex items-center justify-between">
                        <div>
                          <span className="block text-[9px] text-amber-800 font-bold uppercase tracking-wider">Active Signed Code:</span>
                          <span className="font-mono font-black text-amber-600 text-sm select-all">{existingCodeRecord.code}</span>
                          <span className="block text-[8px] text-slate-400 font-semibold mt-0.5">Expires: {new Date(existingCodeRecord.expiryTime).toLocaleString()}</span>
                        </div>
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full uppercase">Pending Verification</span>
                      </div>
                    )}

                    {tx.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-end">
                        <button
                          onClick={() => rejectTransaction(tx.id)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <X size={14} /> Reject Payment
                        </button>

                        <button
                          onClick={() => {
                            setGenPhone(tx.userPhone);
                            setGenAmount(tx.amount.toString());
                            setGenRef(tx.accountNumberOrRef || '');
                            
                            // Auto generate code right away
                            const res = generateOfflineRechargeCode(
                              tx.userPhone,
                              tx.amount,
                              (tx.accountNumberOrRef || '').trim().toUpperCase(),
                              1440 // default 1 day
                            );
                            if (res.success && res.code) {
                              setGeneratedCodeResult(res.code);
                              setGenSuccess(`${existingCodeRecord ? 'Regenerated' : 'Auto-generated'} code for ${tx.userPhone}!`);
                            } else {
                              setGenError(res.message || 'Auto-generation failed.');
                            }
                            // Smooth scroll back up to Code Generator card
                            const mainScroll = document.querySelector('.flex-1.overflow-y-auto');
                            if (mainScroll) {
                              mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                        >
                          {existingCodeRecord ? '🔄 Regenerate Sign Code' : '🔑 Auto-Sign Code'}
                        </button>

                        <button
                          onClick={() => approveTransaction(tx.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1 shadow cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <Check size={14} /> Approve Directly
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
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
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                📤 Withdrawals Operations Desk
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Review, approve, and track user withdrawal payout requests. Generate cryptographically secure tax sign-off codes for manual offline release.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* WITHDRAWAL CODE GENERATOR FORM (Left 5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-4 self-start">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    🔑 Withdrawal Tax Code Generator
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Generate an offline cryptographically signed verification code for a user's withdrawal release.
                  </p>
                </div>

                {withdrawGenError && (
                  <div className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold p-2.5 rounded-xl flex items-center gap-1.5">
                    <X size={12} className="shrink-0" />
                    <span>{withdrawGenError}</span>
                  </div>
                )}

                {withdrawGenSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold p-2.5 rounded-xl flex items-center gap-1.5">
                    <Check size={12} className="shrink-0" />
                    <span>{withdrawGenSuccess}</span>
                  </div>
                )}

                <form onSubmit={(e) => {
                  e.preventDefault();
                  setWithdrawGenError('');
                  setWithdrawGenSuccess('');
                  setWithdrawGeneratedCodeResult('');

                  if (!withdrawGenPhone.trim()) {
                    setWithdrawGenError('User phone number is required.');
                    return;
                  }
                  if (!withdrawGenAmount.trim() || isNaN(Number(withdrawGenAmount)) || Number(withdrawGenAmount) <= 0) {
                    setWithdrawGenError('Valid withdrawal amount is required.');
                    return;
                  }
                  if (!withdrawGenRef.trim()) {
                    setWithdrawGenError('Tax payment reference FT code is required.');
                    return;
                  }

                  const res = generateOfflineRechargeCode(
                    withdrawGenPhone.trim(),
                    Number(withdrawGenAmount),
                    withdrawGenRef.trim().toUpperCase(),
                    Number(withdrawGenExpiry)
                  );

                  if (res.success && res.code) {
                    setWithdrawGeneratedCodeResult(res.code);
                    setWithdrawGenSuccess('Withdrawal release verification code generated successfully.');
                  } else {
                    setWithdrawGenError(res.message || 'Failed to generate code.');
                  }
                }} className="space-y-3">
                  
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">User Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0926193920"
                      value={withdrawGenPhone}
                      onChange={(e) => setWithdrawGenPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">Withdrawal Amount (ETB)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 2000"
                        value={withdrawGenAmount}
                        onChange={(e) => setWithdrawGenAmount(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-bold text-amber-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">Expiry Time</label>
                      <select
                        value={withdrawGenExpiry}
                        onChange={(e) => setWithdrawGenExpiry(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-bold"
                      >
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                        <option value="1440">24 Hours (1 Day)</option>
                        <option value="10080">7 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 font-sans">Tax Payment FT Code / Reference</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FT26197HK0DY"
                      value={withdrawGenRef}
                      onChange={(e) => setWithdrawGenRef(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all font-mono font-bold uppercase tracking-wider"
                    />
                  </div>

                  {withdrawGenAmount && !isNaN(Number(withdrawGenAmount)) && Number(withdrawGenAmount) > 0 && (
                    <div className="text-[10px] bg-amber-50 border border-amber-100/60 rounded-xl p-2.5 text-amber-800 font-bold flex justify-between items-center">
                      <span>Calculated 10% tax:</span>
                      <span className="font-extrabold font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-amber-200">{(Number(withdrawGenAmount) * 0.1).toFixed(2)} ETB</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow flex items-center justify-center gap-1 font-sans"
                  >
                    ⚡ Generate Verification Code
                  </button>
                </form>

                {withdrawGeneratedCodeResult && (
                  <div className="bg-amber-100/50 border border-amber-300 rounded-2xl p-4 space-y-3.5 text-center animate-fade-in">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-amber-800 uppercase tracking-widest font-sans">Signed Approval Code</span>
                      <span className="block text-sm font-black text-slate-900 font-mono select-all border border-dashed border-amber-400 bg-white p-2.5 rounded-xl tracking-wider select-all break-all">{withdrawGeneratedCodeResult}</span>
                    </div>
                    
                    {/* Share message templates */}
                    {(() => {
                      const shareMessage = `💰 *Withdrawal Approval Code* 💰\n\n• *Phone*: ${withdrawGenPhone}\n• *Amount*: ${withdrawGenAmount} ETB\n• *Tax FT Ref*: ${(withdrawGenRef || '').toUpperCase()}\n• *Verification Code*: ${withdrawGeneratedCodeResult}\n\nUse this code to release your withdrawal.`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
                      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent('https://goms.net')}&text=${encodeURIComponent(shareMessage)}`;

                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(withdrawGeneratedCodeResult);
                                alert('Copied signed withdrawal release code to clipboard!');
                              }}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[9px] py-2 rounded-lg uppercase tracking-wider font-sans cursor-pointer flex items-center justify-center gap-1"
                            >
                              📋 Copy Code
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(shareMessage);
                                alert('Copied full withdrawal details to clipboard!');
                              }}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[9px] py-2 rounded-lg uppercase tracking-wider font-sans cursor-pointer flex items-center justify-center gap-1"
                            >
                              📝 Copy Details
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] py-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1 font-sans cursor-pointer"
                            >
                              💬 WhatsApp
                            </a>
                            <a
                              href={telegramUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-[9px] py-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1 font-sans cursor-pointer"
                            >
                              ✈️ Telegram
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* WITHDRAWAL APPROVAL QUEUE (Right 7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
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
                   rejectedWithdrawals).map(tx => {
                    const existingCodeRecord = adminGeneratedCodes.find(item => 
                      item.phone === tx.userPhone && 
                      Math.round(parseFloat(item.amount)) === Math.round(parseFloat(tx.amount as any)) && 
                      (item.reference || '').trim().toUpperCase() === (tx.taxRef || '').trim().toUpperCase()
                    );
                    const taxAmount = tx.amount * 0.10;
                    return (
                      <div key={tx.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5 hover:shadow-md transition-all">
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
                              {tx.status === 'pending' && (() => {
                                const isExpired = (Date.now() - new Date(tx.createdAt).getTime()) > 2 * 60 * 1000;
                                return (
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    isExpired ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {isExpired ? '⏰ Tax Expired (>2m App Access Deactivated)' : 'Pending Tax'}
                                  </span>
                                );
                              })()}
                              {tx.status === 'tax_submitted' && (
                                <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase animate-pulse">Tax Submitted</span>
                              )}
                            </div>
                            
                            <div className="mt-2 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                              <div>
                                <span className="text-slate-400 font-medium mr-1">Withdrawal Bank:</span>
                                <span className="font-black text-slate-800">{tx.bankName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium mr-1">Withdrawal Account Number:</span>
                                <span className="font-black text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 font-mono">{tx.accountNumberOrRef}</span>
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
                                <span className="text-slate-400 font-medium mr-1">Withdrawal Amount:</span>
                                <span className="text-slate-800 font-black">{tx.amount.toLocaleString()} ETB</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium mr-1">Tax Due (10%):</span>
                                <span className="text-amber-600 font-black">{taxAmount.toLocaleString()} ETB</span>
                              </div>
                              {tx.taxRef && (
                                <div className="mt-1 pt-1 border-t border-dashed border-slate-200">
                                  <span className="text-slate-400 font-medium mr-1">Tax Reference FT Code:</span>
                                  <span className="font-mono font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{tx.taxRef}</span>
                                </div>
                              )}
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

                            {tx.taxScreenshot && (
                              <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                                <span className="block text-[9px] text-slate-500 font-extrabold mb-1 uppercase tracking-wider">Uploaded Tax Receipt:</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveScreenshot(tx.taxScreenshot)}
                                  className="block cursor-zoom-in text-left border border-slate-200 rounded-lg overflow-hidden relative group"
                                >
                                  <img 
                                    src={tx.taxScreenshot} 
                                    alt="Tax Payment Receipt" 
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
                          <span className="text-base font-black text-red-600 shrink-0">
                            -{tx.amount.toLocaleString()} ETB
                          </span>
                        </div>

                        {(tx.status === 'pending' || tx.status === 'tax_submitted') && existingCodeRecord && (
                          <div className="text-[10px] bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 flex items-center justify-between">
                            <div>
                              <span className="block text-[9px] text-amber-800 font-bold uppercase tracking-wider">Active Tax Sign Code:</span>
                              <span className="font-mono font-black text-amber-600 text-sm select-all">{existingCodeRecord.code}</span>
                              <span className="block text-[8px] text-slate-400 font-semibold mt-0.5">Expires: {new Date(existingCodeRecord.expiryTime).toLocaleString()}</span>
                            </div>
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full uppercase">Pending Verification</span>
                          </div>
                        )}

                        {(tx.status === 'pending' || tx.status === 'tax_submitted') && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-end">
                            <button
                              onClick={() => rejectTransaction(tx.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1 border border-red-200/50 cursor-pointer"
                            >
                              <X size={14} /> Reject & Refund Payout
                            </button>

                            {tx.status === 'tax_submitted' && (
                              <button
                                onClick={() => {
                                  setWithdrawGenPhone(tx.userPhone);
                                  setWithdrawGenAmount(tx.amount.toString());
                                  setWithdrawGenRef(tx.taxRef || '');
                                  
                                  const res = generateOfflineRechargeCode(
                                    tx.userPhone,
                                    tx.amount,
                                    (tx.taxRef || '').trim().toUpperCase(),
                                    1440 // default 1 day
                                  );
                                  if (res.success && res.code) {
                                    setWithdrawGeneratedCodeResult(res.code);
                                    setWithdrawGenSuccess(`${existingCodeRecord ? 'Regenerated' : 'Auto-generated'} withdrawal release code for ${tx.userPhone}!`);
                                  } else {
                                    setWithdrawGenError(res.message || 'Auto-generation failed.');
                                  }
                                  // Smooth scroll back up to Withdrawal Code Generator card
                                  const mainScroll = document.querySelector('.flex-1.overflow-y-auto');
                                  if (mainScroll) {
                                    mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                                }}
                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                              >
                                {existingCodeRecord ? '🔄 Regenerate Tax Sign Code' : '🔑 Auto-Sign Tax Code'}
                              </button>
                            )}

                            <button
                              onClick={() => approveTransaction(tx.id)}
                              className="bg-bronze hover:bg-bronze-hover text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1 shadow cursor-pointer transition-all active:scale-[0.98]"
                            >
                              <Check size={14} /> Mark Payout Complete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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

            {/* Admin Device Multi-Account Creation Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-amber-950">Admin Multi-Account Device Bypass</h4>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/80">This admin device is permitted to register & create unlimited user accounts without single-device restrictions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateUserSection(!showCreateUserSection)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus size={13} />
                  {showCreateUserSection ? 'Hide Form' : 'Create Account'}
                </button>
              </div>

              {showCreateUserSection && (
                <form onSubmit={handleAdminCreateAccount} className="bg-white rounded-xl p-3 border border-amber-200/60 space-y-2.5 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0911223344"
                        value={newAccountPhone}
                        onChange={(e) => setNewAccountPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Password</label>
                      <input
                        type="text"
                        placeholder="Default: 123456"
                        value={newAccountPassword}
                        onChange={(e) => setNewAccountPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Initial Balance (ETB)</label>
                      <input
                        type="number"
                        placeholder="Default: 750"
                        value={newAccountBalance}
                        onChange={(e) => setNewAccountBalance(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Referral Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. GOM00276"
                        value={newAccountReferral}
                        onChange={(e) => setNewAccountReferral(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {createAccountError && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      <span>{createAccountError}</span>
                    </div>
                  )}

                  {createAccountSuccess && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>{createAccountSuccess}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateUserSection(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createAccountLoading}
                      className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      {createAccountLoading ? 'Creating Account...' : 'Create Account (Multi-Account Device Bypass)'}
                    </button>
                  </div>
                </form>
              )}
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
              {filteredUsers.map(user => {
                const isUserAdminAccount = user.role === 'admin' || isSamePhone(user.phoneNumber, '0951560276');
                const isWhiteScreen = !isUserAdminAccount && Boolean(
                  user.whiteScreenLocked || 
                  user.application_access_state === 'WHITE_SCREEN_LOCKED' || 
                  user.applicationAccessState === 'WHITE_SCREEN_LOCKED'
                );
                const isTaxLocked = !isUserAdminAccount && !isWhiteScreen && Boolean(
                  user.application_access_state === 'TAX_LOCKED' || 
                  user.applicationAccessState === 'TAX_LOCKED' || 
                  user.nextRoundLocked || 
                  transactions.some(t => 
                    (t.userId === user.id || isSamePhone(t.userPhone, user.phoneNumber)) && 
                    t.type === 'withdraw' && 
                    (t.status === 'pending' || t.status === 'tax_submitted') &&
                    (Date.now() - new Date(t.createdAt).getTime()) > 2 * 60 * 1000
                  )
                );
                const accountStatus: 'WHITE_SCREEN_LOCKED' | 'TAX_LOCKED' | 'ACTIVE' = isWhiteScreen 
                  ? 'WHITE_SCREEN_LOCKED' 
                  : isTaxLocked 
                    ? 'TAX_LOCKED' 
                    : 'ACTIVE';

                return (
                <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-800">{formatUserPhoneId(user.phoneNumber)}</span>
                      {accountStatus === 'WHITE_SCREEN_LOCKED' && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white border border-slate-700 flex items-center gap-1 shadow-xs">
                          <ShieldAlert size={10} className="text-rose-400" />
                          WHITE_SCREEN_LOCKED
                        </span>
                      )}
                      {accountStatus === 'TAX_LOCKED' && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs">
                          <Lock size={10} className="text-amber-600" />
                          TAX_LOCKED
                        </span>
                      )}
                      {accountStatus === 'ACTIVE' && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
                          <CheckCircle2 size={10} className="text-emerald-600" />
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      user?.role === 'admin' ? 'bg-amber-100 text-amber-950' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {(user?.role || 'user').toUpperCase()}
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
                    const invitedPersons = users.filter(u => 
                      u.referredBy === user.id || 
                      (u.referredBy && (
                        u.referredBy === user.phoneNumber || 
                        String(u.referredBy).replace(/[^0-9]/g, '') === (user.phoneNumber || '').replace(/[^0-9]/g, '')
                      )) ||
                      (u?.referredBy && user?.inviteCode && String(u.referredBy).trim().toUpperCase() === String(user.inviteCode).trim().toUpperCase())
                    );
                    const invitedCount = invitedPersons.length;
                    const isExpanded = expandedInvites[user.id] !== false;
                    return (
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedInvites(prev => ({ ...prev, [user.id]: isExpanded ? false : true }))}
                          className="w-full flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                        >
                          <span className="flex items-center gap-1 text-slate-600">
                            👥 Invited Partners ({invitedCount})
                          </span>
                          <span className="text-slate-400 font-extrabold">{isExpanded ? '▼ Hide' : '▶ Show'}</span>
                        </button>
                        
                        {isExpanded && (
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
                        placeholder="Amount in ETB (e.g. 750)"
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

                  {/* Next Round Locked Status & Reactivate Action */}
                  {user.nextRoundLocked && (
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wide block flex items-center gap-1">
                          🔒 Locked: Next Round Coming Soon
                        </span>
                        <span className="text-[9px] text-emerald-700 font-medium block">
                          User verified withdrawal tax & is currently waiting on next round.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await reactivateUserAccount(user.id);
                          setUserFeedback(prev => ({
                            ...prev,
                            [user.id]: { type: res.success ? 'success' : 'error', message: res.message }
                          }));
                          setTimeout(() => {
                            setUserFeedback(prev => {
                              const copy = { ...prev };
                              delete copy[user.id];
                              return copy;
                            });
                          }, 3500);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 cursor-pointer shadow-sm transition-all active:scale-95"
                      >
                        🚀 Start Next Round / Unlock
                      </button>
                    </div>
                  )}

                  {/* White Screen Lockout Status & Admin Restore Access Action */}
                  {accountStatus === 'WHITE_SCREEN_LOCKED' && (
                    <div className="bg-slate-900 border-2 border-rose-500/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                          <ShieldAlert size={14} className="shrink-0" />
                          White Screen Locked Account
                        </span>
                        <span className="text-[9px] text-slate-300 font-medium block">
                          User screen is completely white and application is inaccessible.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdminRestoreAccess(user.id, user.phoneNumber)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={13} />
                        Restore Application Access / Re-enable Account
                      </button>
                    </div>
                  )}

                  {/* Danger Zone: Delete Account & White Screen */}
                  <div className="pt-1.5 flex justify-between items-center border-t border-slate-100 flex-wrap gap-2">
                    <span className="text-[9px] text-slate-400 font-bold">UID: <span className="font-mono">{user.id}</span></span>
                    {!isUserAdminAccount && (
                      <div className="flex items-center gap-1.5">
                        {accountStatus === 'WHITE_SCREEN_LOCKED' ? (
                          <button
                            type="button"
                            onClick={() => handleAdminRestoreAccess(user.id, user.phoneNumber)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer border shadow-2xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
                          >
                            <CheckCircle2 size={10} />
                            Restore Access
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`⚠️ Put ${formatUserPhoneId(user.phoneNumber)} into complete WHITE SCREEN lockout? The user's screen will turn completely white and the app will become inaccessible.`)) {
                                const res = await toggleUserWhiteScreen(user.id, true);
                                alert(res.message);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer border shadow-2xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                          >
                            <ShieldAlert size={10} />
                            White Screen Lock
                          </button>
                        )}

                        <button
                          onClick={() => handleAdminDeleteUserSubmit(user.id, user.phoneNumber)}
                          className="flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer border border-rose-200/50"
                        >
                          <Trash2 size={10} />
                          Delete Account
                        </button>
                      </div>
                    )}
                    {isUserAdminAccount && (
                      <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        Admin Account (Exempt)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
                  const currentLogo = (marketplaceLogos && marketplaceLogos[marketKey]) || '';
                  const isDataUrl = typeof currentLogo === 'string' && currentLogo.startsWith('data:');
                  const marketLabel = (marketKey || '').toUpperCase();
                  
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
                            defaultValue={isDataUrl ? '' : currentLogo}
                            placeholder={isDataUrl ? 'Base64 Encoded (File Uploaded)' : 'Enter image HTTP/HTTPS URL...'}
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
                  const currentLogo = (bankLogos && bankLogos[bankInfo.key]) || '';
                  const isDataUrl = typeof currentLogo === 'string' && currentLogo.startsWith('data:');
                  
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
                            defaultValue={isDataUrl ? '' : currentLogo}
                            placeholder={isDataUrl ? 'Base64 Encoded (File Uploaded)' : 'Enter image HTTP/HTTPS URL...'}
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

        {/* GIFT CODES MANAGEMENT TAB */}
        {activeAdminSubTab === 'gifts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                🎁 Phone-Targeted Gift Codes Desk
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Generate gift codes bound to specific user phone numbers and wallet balances. The system strictly verifies the redeeming account's phone number before adding funds to their wallet.
              </p>
            </div>

            {/* GENERATE GIFT CODE FORM */}
            <form onSubmit={handleGenerateGiftCodeSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Plus size={14} className="text-bronze" /> Create New Gift Code
              </h4>

              {giftError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">
                  {giftError}
                </div>
              )}

              {giftSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>{giftSuccess}</span>
                  <button
                    type="button"
                    onClick={() => setGiftSuccess('')}
                    className="text-emerald-800 hover:text-emerald-950 text-[10px] font-black underline ml-2 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {/* Target Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">Target User Phone Number *</label>
                  <input
                    type="text"
                    value={giftTargetPhone}
                    onChange={(e) => setGiftTargetPhone(e.target.value)}
                    placeholder="e.g. 0926193920 or 0911223344"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                    required
                  />
                  {/* Quick Select Registered Users */}
                  {users.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold block">Quick Select Registered User:</span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {users.filter(u => u?.role !== 'admin').map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setGiftTargetPhone(u.phoneNumber)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                              giftTargetPhone === u.phoneNumber
                                ? 'bg-bronze text-white border-bronze shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            📱 {u.phoneNumber} ({u.walletBalance} ETB)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount & Custom Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 block">Gift Balance (ETB) *</label>
                    <input
                      type="number"
                      value={giftAmount}
                      onChange={(e) => setGiftAmount(e.target.value)}
                      placeholder="500"
                      min="1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 block">Custom Code (Optional)</label>
                    <input
                      type="text"
                      value={giftCustomCode}
                      onChange={(e) => setGiftCustomCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME500 (or leave blank)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-bronze"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-bronze hover:bg-bronze-hover text-white font-extrabold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Gift size={14} />
                Generate & Issue Gift Code
              </button>
            </form>

            {/* GENERATED GIFT CODES LIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">
                  📋 Issued Gift Codes History ({adminGiftCodes.length})
                </h4>
              </div>

              {adminGiftCodes.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-bold">
                  No gift codes issued yet. Use the form above to generate phone-bound gift codes.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {adminGiftCodes.map((gift) => (
                    <div
                      key={gift.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-800 tracking-wider font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                            {gift.code}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              gift.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {gift.status === 'active' ? '● Active' : '✓ Redeemed'}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600">
                            +{formatPrice(gift.amount)}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium space-x-2">
                          <span>Target Phone: <strong className="text-slate-700 font-bold">{gift.targetPhone}</strong></span>
                          <span>•</span>
                          <span>Created: {new Date(gift.createdAt).toLocaleDateString()}</span>
                        </div>

                        {gift.redeemedBy && (
                          <div className="text-[10px] text-slate-400 font-semibold">
                            Redeemed by {gift.redeemedBy} on {new Date(gift.redeemedAt || '').toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(gift.code);
                            alert(`Gift code "${gift.code}" copied to clipboard!`);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Copy size={12} /> Copy
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete gift code "${gift.code}"?`)) {
                              deleteAdminGiftCode(gift.id);
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* UNLOCK CODES SYSTEM MANAGEMENT */}
        {activeAdminSubTab === 'unlock_codes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                🔓 Time-Lock & Next Round Unlock Code Generator
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Generate unlock codes for users whose 3-day tax payment window has expired (tax + 50% penalty paid) or to unlock the Next Round Coming Soon state.
              </p>
            </div>

            {/* GENERATOR FORM CARD */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <KeyRound size={15} /> Issue New Unlock Code
              </h4>

              <form onSubmit={handleGenerateUnlockCodeSubmit} className="space-y-4">
                {/* Select Code Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setUnlockType('tax_timelock')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      unlockType === 'tax_timelock'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-rose-500" /> Tax Time-Lock Code
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      For accounts deactivated due to unpaid tax past 2 minutes.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnlockType('next_round')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      unlockType === 'next_round'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" /> Next Round Code
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      To unlock Next Round Coming Soon state for a user.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnlockType('white_screen')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      unlockType === 'white_screen'
                        ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-indigo-600" /> White Screen Lockout
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Makes screen completely white & blocks app upon redemption.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnlockType('order_completion')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      unlockType === 'order_completion'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <Zap size={14} className="text-blue-600" /> Order Completion Code
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Complete specific order (e.g. #12) or all 15 orders via Reset Cycle double-tap.
                    </span>
                  </button>
                </div>

                {/* Target User Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex justify-between">
                    <span>Target Account / Device Scope:</span>
                    <span className="text-slate-400 font-normal">Works across all user devices</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={unlockPhone}
                      onChange={(e) => setUnlockPhone(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="ALL">🌐 Universal Code (Effective on Any User Device)</option>
                      <option value="">-- Specific User Account --</option>
                      {users.map(u => {
                        const hasPendingWithdrawal = transactions.some(t => t.userId === u.id && t.type === 'withdraw' && t.status === 'pending');
                        const isNextRound = Boolean(u.nextRoundLocked);
                        const isWhiteScreen = Boolean(u.whiteScreenLocked);
                        const completedCount = (u.completedOrderIds || []).length;
                        let badge = ` [Completed: ${completedCount}/15]`;
                        if (hasPendingWithdrawal) badge += ' ⚠️ [Tax Pending]';
                        if (isNextRound) badge += ' 🔒 [Next Round]';
                        if (isWhiteScreen) badge += ' ⚪ [White Screen]';

                        return (
                          <option key={u.id} value={u.phoneNumber}>
                            {u.phoneNumber} ({formatPrice(u.walletBalance)}) {badge}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      type="text"
                      placeholder="e.g. 0910101010 or ALL"
                      value={unlockPhone === 'ALL' ? '' : unlockPhone}
                      onChange={(e) => setUnlockPhone(e.target.value)}
                      className="w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                {/* Expiry Selector (Matching Payment Verify System) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex justify-between">
                    <span>Code Expiration / Lifetime:</span>
                    <span className="text-slate-400 font-normal">Controls how long code remains redeemable</span>
                  </label>
                  <select
                    value={unlockExpiry}
                    onChange={(e) => setUnlockExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="30">30 Minutes (Quick Verification)</option>
                    <option value="60">1 Hour</option>
                    <option value="1440">24 Hours (1 Day - Recommended)</option>
                    <option value="10080">7 Days (1 Week)</option>
                    <option value="43200">30 Days</option>
                    <option value="0">No Expiration (Indefinite / Permanent)</option>
                  </select>
                </div>

                {/* Specific Configuration for Order Completion */}
                {unlockType === 'order_completion' && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs text-blue-950">
                        <Zap size={14} className="text-blue-600" />
                        <span>Order Completion Configuration:</span>
                      </div>
                      <span className="text-[10px] bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                        User Header Double-Tap Trigger
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-blue-900">Completion Mode:</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderCompletionMode('up_to')}
                            className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                              orderCompletionMode === 'up_to'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100/50'
                            }`}
                          >
                            Complete Up To Order (Add Order)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOrderCompletionMode('all');
                              setOrderTargetNumber(15);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                              orderCompletionMode === 'all'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100/50'
                            }`}
                          >
                            Complete All 15 Orders
                          </button>
                        </div>
                      </div>

                      {orderCompletionMode === 'up_to' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-blue-900 flex justify-between">
                            <span>Target Order Number:</span>
                            <span className="text-blue-700 font-bold">Order #{orderTargetNumber}</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={orderTargetNumber}
                              onChange={(e) => setOrderTargetNumber(Math.max(1, Math.min(15, parseInt(e.target.value) || 1)))}
                              className="w-20 bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-xs font-black text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                            <div className="flex gap-1 flex-wrap">
                              {[5, 10, 12, 14, 15].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setOrderTargetNumber(num)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    orderTargetNumber === num
                                      ? 'bg-blue-700 text-white border-blue-800'
                                      : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-100'
                                  }`}
                                >
                                  #{num}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/80 border border-blue-200/80 rounded-xl p-2.5 text-[11px] text-blue-900 font-medium">
                      📱 <strong>User Instructions:</strong> When user receives this code, they navigate to the <strong>Orders tab</strong> and <strong>double-tap the "Reset Cycle" button in the header</strong>. Entering this code will instantly mark orders 1 through {orderCompletionMode === 'all' ? 15 : orderTargetNumber} as completed!
                    </div>
                  </div>
                )}

                {/* Calculation Info Box for Tax Time Lock */}
                {unlockType === 'tax_timelock' && unlockPhone && (() => {
                  const targetUserObj = users.find(u => isSamePhone(u.phoneNumber, unlockPhone));
                  const pendingWithdrawalTx = targetUserObj ? transactions.find(t => t.userId === targetUserObj.id && t.type === 'withdraw' && t.status === 'pending') : null;
                  const wAmt = pendingWithdrawalTx ? Number(pendingWithdrawalTx.amount) : 0;
                  const tax10 = Math.round(wAmt * 0.10 * 100) / 100;
                  const penalty50 = Math.round(tax10 * 0.50 * 100) / 100;
                  const totalDue = Math.round((tax10 + penalty50) * 100) / 100;

                  return (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-amber-950">
                      <div className="font-extrabold text-amber-900 border-b border-amber-200/60 pb-1 flex justify-between items-center">
                        <span>💰 Tax + Penalty Payment Breakdown:</span>
                        <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">Tax + 50% Penalty</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>Withdrawal Request: <span className="font-bold">{wAmt > 0 ? formatPrice(wAmt) : 'N/A'}</span></div>
                        <div>Original Tax (10%): <span className="font-bold text-rose-700">{tax10 > 0 ? formatPrice(tax10) : 'N/A'}</span></div>
                        <div>Late Penalty (50% of Tax): <span className="font-bold text-amber-800">{penalty50 > 0 ? formatPrice(penalty50) : 'N/A'}</span></div>
                        <div className="col-span-2 pt-1 border-t border-amber-200/80 flex justify-between items-center text-xs font-black text-amber-950">
                          <span>TOTAL UNLOCK PAYMENT DUE (TAX + PENALTY):</span>
                          <span className="text-sm text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-xs">{totalDue > 0 ? formatPrice(totalDue) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Custom Code (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Custom Unlock Code (Optional, leave blank for auto-generate):
                  </label>
                  <input
                    type="text"
                    placeholder={
                      unlockType === 'order_completion'
                        ? 'e.g. ORD-1010-12-8492'
                        : unlockType === 'tax_timelock' 
                          ? 'e.g. TL-849201' 
                          : unlockType === 'white_screen' 
                            ? 'e.g. WS-928410' 
                            : 'e.g. NR-392014'
                    }
                    value={unlockCustomCode}
                    onChange={(e) => setUnlockCustomCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {unlockError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs p-3 rounded-xl">
                    ⚠️ {unlockError}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                    unlockType === 'order_completion'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <KeyRound size={15} />
                  <span>
                    Generate {
                      unlockType === 'order_completion'
                        ? `Order Completion (Order #${orderCompletionMode === 'all' ? 15 : orderTargetNumber})`
                        : unlockType === 'tax_timelock' 
                          ? 'Tax Time-Lock' 
                          : unlockType === 'white_screen' 
                            ? 'White Screen Lockout' 
                            : 'Next Round'
                    } Code
                  </span>
                </button>
              </form>

              {/* SUCCESS DISPLAY BOX - MATCHING PAYMENT VERIFY SYSTEM */}
              {unlockSuccessCode && (
                <div className="bg-amber-100/60 border border-amber-300 rounded-2xl p-4 space-y-3.5 text-center animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-900 uppercase tracking-widest bg-amber-200/80 px-2 py-0.5 rounded-full">
                      ⚡ Signed Security Code
                    </span>
                    <span className="text-[10px] font-bold text-amber-800">
                      {unlockPhone && unlockPhone !== 'ALL' ? `📱 Device: ${unlockPhone}` : '🌐 Scope: Any User Device'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                      {unlockSuccessMsg || 'Generated Cryptographic Unlock Code'}
                    </span>
                    <span className="block text-base font-black text-slate-900 font-mono select-all border border-dashed border-amber-400 bg-white p-3 rounded-xl tracking-wider select-all break-all shadow-xs">
                      {unlockSuccessCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(unlockSuccessCode);
                        setCopiedUnlockCode(unlockSuccessCode);
                        setTimeout(() => setCopiedUnlockCode(null), 2500);
                        alert(`Copied signed unlock code ${unlockSuccessCode} to clipboard!`);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1 font-sans cursor-pointer transition-all shadow-xs"
                    >
                      {copiedUnlockCode === unlockSuccessCode ? '✓ Copied' : '📋 Copy Code'}
                    </button>

                    {(() => {
                      const cleanPhone = (unlockPhone && unlockPhone !== 'ALL') ? unlockPhone.replace(/[^0-9]/g, '') : '';
                      const typeLabel = unlockType === 'order_completion' 
                        ? 'Order Completion' 
                        : unlockType === 'tax_timelock' 
                          ? 'Tax Time-Lock Unlock' 
                          : unlockType === 'white_screen' 
                            ? 'Security Access' 
                            : 'Next Round Unlock';
                      const msg = `Hi! Your ${typeLabel} code is: ${unlockSuccessCode}. Enter this on your screen to immediately unlock access across any device.`;
                      const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;

                      return (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1 font-sans cursor-pointer transition-all shadow-xs"
                        >
                          💬 Send WhatsApp
                        </a>
                      );
                    })()}
                  </div>

                  <p className="text-[10px] text-amber-900 font-medium leading-relaxed bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                    💡 <strong>Cross-Device Enabled:</strong> This code uses cryptographic signing and will immediately be accepted on any user device, even before database synchronization finishes.
                  </p>
                </div>
              )}
            </div>

            {/* APPLICATION WHITE SCREEN LOCK */}
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black">
                    <ShieldAlert size={18} className="text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      APPLICATION WHITE SCREEN LOCK
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Administrator-only security lockout code generator. When redeemed on the Lock Screen, the application turns completely white and becomes inaccessible.
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full">
                  Security Lockout
                </span>
              </div>

              <form onSubmit={handleGenerateWhiteScreenCodeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Target User / Account */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                      Target User / Account <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={wsTargetUserId}
                      onChange={(e) => setWsTargetUserId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="">-- Select Target User / Account --</option>
                      {users.map(u => {
                        const isExempt = u.role === 'admin' || isSamePhone(u.phoneNumber, '0951560276');
                        return (
                          <option key={u.id} value={u.id} disabled={isExempt}>
                            {formatUserPhoneId(u.phoneNumber)} ({u.id.substring(0, 8)}...) - {formatPrice(u.walletBalance)}
                            {isExempt ? ' [ADMIN - EXEMPT]' : (u.whiteScreenLocked || u.application_access_state === 'WHITE_SCREEN_LOCKED') ? ' [ALREADY WHITE-SCREEN LOCKED]' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Or enter Account ID / Phone:</span>
                      <input
                        type="text"
                        placeholder="e.g. 0912345678 or user-id"
                        value={wsTargetUserId}
                        onChange={(e) => setWsTargetUserId(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                  </div>

                  {/* Field 2: Optional Lock Reason */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                      Optional Lock Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Suspected fraudulent activity / Compliance audit / Administrative freeze"
                      value={wsLockReason}
                      onChange={(e) => setWsLockReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>

                  {/* Field 3: Optional Expiration */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                      Optional Expiration
                    </label>
                    <select
                      value={wsExpiresOption}
                      onChange={(e) => setWsExpiresOption(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="never">No Expiration (Indefinite until admin restore)</option>
                      <option value="1h">Expires in 1 Hour</option>
                      <option value="24h">Expires in 24 Hours (1 Day)</option>
                      <option value="7d">Expires in 7 Days</option>
                      <option value="30d">Expires in 30 Days</option>
                    </select>
                  </div>

                  {/* Optional Custom Format */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                      Optional Custom Code <span className="text-slate-400 font-normal">(Leave blank for WS-XXXXXX)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WS-583921"
                      value={wsCustomCode}
                      onChange={(e) => setWsCustomCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>
                </div>

                {wsError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs p-3 rounded-xl">
                    ⚠️ {wsError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={wsLoading}
                  className="w-full bg-slate-900 hover:bg-black text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <ShieldAlert size={16} className="text-rose-400" />
                  <span>{wsLoading ? 'Generating...' : 'Generate White Screen Code'}</span>
                </button>
              </form>

              {/* SUCCESS DISPLAY BOX */}
              {wsSuccessCode && (
                <div className="bg-slate-900 text-white border-2 border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs">
                    <ShieldAlert size={18} className="shrink-0" />
                    <span>{wsSuccessMsg}</span>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Generated White Screen Code (Format: WS-XXXXXX)
                      </div>
                      <div className="text-2xl font-black font-mono text-white tracking-widest select-all">
                        {wsSuccessCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(wsSuccessCode);
                        setCopiedWsCode(wsSuccessCode);
                        setTimeout(() => setCopiedWsCode(null), 2500);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      {copiedWsCode === wsSuccessCode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedWsCode === wsSuccessCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-300 font-medium space-y-1">
                    <p>
                      🔒 <strong>Security Warning:</strong> When this code is entered on the Lock Screen, the user's screen will turn completely white and the application will become completely inaccessible.
                    </p>
                    <p className="text-slate-400">
                      Access can only be restored by an authorized administrator using the "Restore Application Access" action in User Management.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* GENERATED UNLOCK CODES TABLE */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <KeyRound size={15} className="text-amber-600" /> Issued Security & Unlock Codes ({(unlockCodes || []).length})
                </h4>
              </div>

              {(unlockCodes || []).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No security or unlock codes generated yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(unlockCodes || []).map((uc) => {
                    const isWsCode = uc.code_type === 'WHITE_SCREEN_LOCK' || uc.type === 'white_screen';
                    const isOrderCode = uc.code_type === 'ORDER_COMPLETION' || uc.type === 'order_completion' || (uc.code && uc.code.startsWith('ORD'));
                    const isRevoked = uc.status === 'REVOKED' || uc.status === 'revoked';
                    const isUsed = uc.status === 'USED' || uc.status === 'used';
                    const isActive = !isRevoked && !isUsed && (uc.status === 'ACTIVE' || uc.status === 'active');

                    return (
                      <div
                        key={uc.id}
                        className="bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm text-slate-900 tracking-wider bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                              {uc.code}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isWsCode
                                ? 'bg-slate-900 text-white border border-slate-700 flex items-center gap-1'
                                : isOrderCode
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1'
                                  : uc.type === 'tax_timelock' 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isWsCode ? (
                                <>
                                  <ShieldAlert size={10} className="text-rose-400" />
                                  WHITE_SCREEN_LOCK
                                </>
                              ) : isOrderCode ? (
                                <>
                                  <Zap size={10} className="text-blue-600" />
                                  ORDER_COMPLETION {uc.targetOrderNumber ? `(#${uc.targetOrderNumber})` : ''}
                                </>
                              ) : (
                                uc.type === 'tax_timelock' ? 'TAX_UNLOCK' : 'NEXT_ROUND'
                              )}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              isActive 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                : isUsed 
                                  ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {uc.status?.toUpperCase() || (isActive ? 'ACTIVE' : 'USED')}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                            {(uc.target_user_id || uc.targetPhone) && (
                              <span>Target Account: <strong className="text-slate-800 font-mono">{uc.target_user_id || uc.targetPhone}</strong></span>
                            )}
                            {isOrderCode && (
                              <span>
                                Target Orders: <strong className="text-blue-700 font-bold">
                                  {uc.orderCompletionMode === 'all' || (uc.targetOrderNumber && uc.targetOrderNumber >= 15)
                                    ? 'All 15 Orders'
                                    : `Orders 1 through ${uc.targetOrderNumber || 12}`}
                                </strong>
                              </span>
                            )}
                            {uc.totalAmountDue && (
                              <span>Amount Paid: <strong className="text-emerald-700">{formatPrice(uc.totalAmountDue)}</strong></span>
                            )}
                            {uc.lock_reason && (
                              <span>Reason: <em className="text-slate-700 font-medium">"{uc.lock_reason}"</em></span>
                            )}
                            {uc.expires_at && (
                              <span className="text-rose-600 font-bold">Expires: {new Date(uc.expires_at).toLocaleString()}</span>
                            )}
                            <span className="text-slate-400">Created: {new Date(uc.createdAt).toLocaleString()}</span>
                          </div>

                          {uc.usedByPhone && (
                            <div className="text-[10px] text-slate-500 font-semibold">
                              Redeemed by {uc.usedByPhone} on {new Date(uc.usedAt || '').toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(uc.code);
                              alert(`Code "${uc.code}" copied to clipboard!`);
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          >
                            <Copy size={12} /> Copy
                          </button>

                          {isActive && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Revoke code "${uc.code}"? It will no longer be redeemable.`)) {
                                  await revokeUnlockCode(uc.id, uc.code);
                                }
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete code "${uc.code}"?`)) {
                                deleteUnlockCode(uc.id);
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
