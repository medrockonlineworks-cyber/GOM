/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { useTranslation, formatUserPhoneId, formatPhoneNumbersInText } from '../utils/translations';
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
  ChevronDown,
  ChevronUp,
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
  Check,
  UploadCloud
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

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
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
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const customVerifyT = {
  en: {
    verifyRecharge: 'Verify Recharge',
    amount: 'Amount:',
    bank: 'Bank:',
    reference: 'Reference:',
    approved: 'Approved',
    pending: 'Pending',
    adminVerifyCode: 'Admin Verification Code',
    enterSecureCode: 'Enter the secure code obtained from the admin (via Telegram/WhatsApp) to cryptographically validate the transaction offline.',
    close: 'Close',
    verifying: 'Verifying...',
    verifyCode: 'Verify Code',
    
    releaseWithdrawal: 'Release Withdrawal',
    withdrawalAmount: 'Withdrawal Amount:',
    taxDue: 'Tax Due (10%):',
    accountNo: 'Account Nº:',
    complete: 'Complete',
    approvalPending: 'Approval Pending',
    taxPending: 'Tax Pending',
    taxPaymentRequired: '⚠️ Tax Payment Required',
    taxDesc: (amountStr: string) => `According to regulatory guidelines, a 10% release tax (${amountStr}) must be paid before releasing the transfer.`,
    payTo: 'Pay Release Tax To (CBE)',
    copyCbe: 'Copy CBE Account',
    copiedAlert: 'CBE account number copied to clipboard!',
    taxRefLabel: 'Tax Reference Number (FT Code)',
    taxScreenshotLabel: 'Tax Payment Screenshot',
    clickToUpload: 'Click to upload or drag & drop',
    supportedImages: 'Supported images (PNG, JPG)',
    submitTaxProof: 'Submit Tax Proof',
    submitting: 'Submitting...',
    taxVerificationPending: '⏱️ Tax Verification Pending',
    taxVerificationPendingDesc: 'You have submitted your tax proof. Please enter the cryptographically signed verification code provided by the administrator to release the funds.',
    ftCode: 'FT Code:',
    taxReleaseCode: 'Tax Release Code',
    obtainSignCode: 'Obtain this sign code from the administrator once they verify your tax payment receipt.',
    releasing: 'Releasing...',
    refRequired: 'Tax reference FT code is required.',
    codeRequired: 'Verification code is required.'
  },
  pt: {
    verifyRecharge: 'Verificar Recarga',
    amount: 'Valor:',
    bank: 'Banco:',
    reference: 'Referência:',
    approved: 'Aprovado',
    pending: 'Pendente',
    adminVerifyCode: 'Código de Verificação do Admin',
    enterSecureCode: 'Insira o código seguro obtido com o administrador (via Telegram/WhatsApp) para validar a transação de forma criptográfica offline.',
    close: 'Fechar',
    verifying: 'Verificando...',
    verifyCode: 'Verificar Código',

    releaseWithdrawal: 'Liberar Retirada',
    withdrawalAmount: 'Valor da Retirada:',
    taxDue: 'Imposto (10%):',
    accountNo: 'Nº Conta:',
    complete: 'Completo',
    approvalPending: 'Aprovação Pendente',
    taxPending: 'Taxa Pendente',
    taxPaymentRequired: '⚠️ Pagamento de Taxa Requerido',
    taxDesc: (amountStr: string) => `De acordo com as diretrizes regulatórias, um imposto de liberação de 10% (${amountStr}) deve ser pago antes de liberar a transferência.`,
    payTo: 'Pagar Taxa de Liberação para',
    copyCbe: 'Copiar Conta CBE',
    copiedAlert: 'Conta CBE copiada para a área de transferência!',
    taxRefLabel: 'Número de Referência da Taxa (FT Code)',
    taxScreenshotLabel: 'Comprovante de Pagamento da Taxa',
    clickToUpload: 'Clique para enviar ou arraste e solte',
    supportedImages: 'Imagens suportadas (PNG, JPG)',
    submitTaxProof: 'Enviar Comprovante',
    submitting: 'Enviando...',
    taxVerificationPending: '⏱️ Verificação de Taxa Pendente',
    taxVerificationPendingDesc: 'Você enviou o comprovante de pagamento de taxa. Forneça o código assinado criptograficamente gerado pelo administrador para validar a liberação.',
    ftCode: 'Código FT:',
    taxReleaseCode: 'Código de Liberação da Taxa',
    obtainSignCode: 'Obtenha este código de assinatura com o administrador após ele aprovar seu comprovante de pagamento.',
    releasing: 'Liberando...',
    refRequired: 'Código de referência da taxa é obrigatório.',
    codeRequired: 'Código de verificação é obrigatório.'
  },
  am: {
    verifyRecharge: 'ሪቻርጅ ማረጋገጫ',
    amount: 'የገንዘብ መጠን፦',
    bank: 'ባንክ፦',
    reference: 'ማጣቀሻ፦',
    approved: 'የጸደቀ',
    pending: 'በመጠባበቅ ላይ',
    adminVerifyCode: 'የአስተዳዳሪ ማረጋገጫ ኮድ',
    enterSecureCode: 'ግብይቱን በአስተማማኝ ሁኔታ ከመስመር ውጭ ለማረጋገጥ ከአስተዳዳሪው (በቴሌግራም/ዋትስአፕ) ያገኙትን ደህንነቱ የተጠበቀ ኮድ ያስገቡ።',
    close: 'ዝጋ',
    verifying: 'በማረጋገጥ ላይ...',
    verifyCode: 'ኮድ አረጋግጥ',

    releaseWithdrawal: 'ገንዘብ ማውጣትን ፍቀድ',
    withdrawalAmount: 'የሚወጣው የገንዘብ መጠን፦',
    taxDue: 'የሚከፈለው ታክስ (10%)፦',
    accountNo: 'የአካውንት ቁጥር፦',
    complete: 'ተጠናቋል',
    approvalPending: 'ማረጋገጫ በመጠባበቅ ላይ',
    taxPending: 'ታክስ በመጠባበቅ ላይ',
    taxPaymentRequired: '⚠️ የታክስ ክፍያ ያስፈልጋል',
    taxDesc: (amountStr: string) => `በመመሪያው መሰረት ዝውውሩን ከመልቀቅዎ በፊት 10% የመልቀቂያ ታክስ (${amountStr}) መከፈል አለበት።`,
    payTo: 'የመልቀቂያ ታክሱን ለ (CBE) ይክፈሉ',
    copyCbe: 'የCBE አካውንት ኮፒ አድርግ',
    copiedAlert: 'የCBE አካውንት ቁጥር ኮፒ ተደርጓል!',
    taxRefLabel: 'የታክስ ማጣቀሻ ቁጥር (FT Code)',
    taxScreenshotLabel: 'የታክስ ክፍያ ቅጽበታዊ ገጽ እይታ',
    clickToUpload: 'ለመጫን ይጫኑ ወይም እዚህ ይጎትቱ',
    supportedImages: 'የሚደገፉ ምስሎች (PNG, JPG)',
    submitTaxProof: 'የታክስ ማረጋገጫ አስረክብ',
    submitting: 'በማስገባት ላይ...',
    taxVerificationPending: '⏱️ የታክስ ማረጋገጫ በመጠባበቅ ላይ',
    taxVerificationPendingDesc: 'የታክስ ማረጋገጫዎን አስገብተዋል። እባክዎ ገንዘቡን ለመልቀቅ በአስተዳዳሪው የተሰጠውን በምስጢር የተፈረመውን የማረጋገጫ ኮድ ያስገቡ።',
    ftCode: 'FT ኮድ፦',
    taxReleaseCode: 'የታክስ መልቀቂያ ኮድ',
    obtainSignCode: 'አስተዳዳሪው የታክስ ክፍያ ደረሰኝዎን ካረጋገጡ በኋላ ይህንን የፊርማ ኮድ ከእርሱ ያግኙ።',
    releasing: 'በመልቀቅ ላይ...',
    refRequired: 'የታክስ ማጣቀሻ FT ኮድ ያስፈልጋል።',
    codeRequired: 'የማረጋገጫ ኮድ ያስፈልጋል።'
  }
};

const getCustomVerifyT = (lang: string) => {
  return customVerifyT[lang as keyof typeof customVerifyT] || customVerifyT.en;
};

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
    language,
    updateAccountDetails,
    registerWithdrawalAccount,
    formatPrice,
    currency,
    verifyRechargeOffline,
    submitWithdrawalTax,
    verifyWithdrawalOffline,
    rechargeAccounts
  } = useApp();

  const { t } = useTranslation(language);
  const cvt = getCustomVerifyT(language);

  const localT = {
    en: {
      accountSettings: 'Account Settings',
      phoneNumberLabel: 'Phone Number',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Leave blank to keep current password',
      saveChanges: 'Save Changes',
      updating: 'Updating...',
      successUpdate: 'Account updated successfully!',
      emptyPhoneError: 'Phone number cannot be empty.',
      phoneTakenError: 'This phone number is already in use.',
      bonusRecords: 'Bonus Records',
      bonusTransactions: 'Bonus Transactions',
      noBonusesFound: 'No bonus records found.',
      bonusSub: 'Register rewards & admin-credited bonuses.',
      registerWithdrawal: 'Register Withdrawal Account',
      currentlyRegistered: 'Registered Account',
      noRegisteredAccount: 'No withdrawal account registered yet.',
      payoutBank: 'Payout Bank / Method',
      withdrawalAccNo: 'Withdrawal Account Number',
      withdrawalAccName: 'Account Holder Name',
      saveAccount: 'Save Account',
      withdrawalAccountRegistered: 'Withdrawal account registered successfully!',
      comingSoon: 'Coming Soon'
    },
    am: {
      accountSettings: 'የመለያ ቅንብሮች',
      phoneNumberLabel: 'የስልክ ቁጥር',
      newPasswordLabel: 'አዲስ የይለፍ ቃል',
      newPasswordPlaceholder: 'ያለውን የይለፍ ቃል ለማቆየት ባዶ ይተውት',
      saveChanges: 'ለውጦችን አስቀምጥ',
      updating: 'በማዘመን ላይ...',
      successUpdate: 'መለያዎ በተሳካ ሁኔታ ተዘምኗል!',
      emptyPhoneError: 'የስልክ ቁጥር ባዶ መሆን አይችልም።',
      phoneTakenError: 'ይህ የስልክ ቁጥር በሌላ መለያ ተይዟል።',
      bonusRecords: 'የቦነስ መዝገቦች',
      bonusTransactions: 'የቦነስ ግብይቶች',
      noBonusesFound: 'ምንም የቦነስ መዝገብ አልተገኘም።',
      bonusSub: 'የምዝገባ ሽልማቶች እና የአስተዳዳሪ ቦነሶች።',
      registerWithdrawal: 'የመውጫ ሂሳብ ይመዝግቡ',
      currentlyRegistered: 'የተመዘገበ ሂሳብ',
      noRegisteredAccount: 'እስካሁን ምንም የመውጫ ሂሳብ አልተመዘገበም።',
      payoutBank: 'የክፍያ ባንክ / ዘዴ',
      withdrawalAccNo: 'የመውጫ ሂሳብ ቁጥር',
      withdrawalAccName: 'የአካውንት ባለቤት ስም',
      saveAccount: 'ሂሳብ አስቀምጥ',
      withdrawalAccountRegistered: 'የመውጫ ሂሳብዎ በተሳካ ሁኔታ ተመዝግቧል!',
      comingSoon: 'በቅርቡ የሚመጣ'
    },
    ar: {
      accountSettings: 'إعدادات الحساب',
      phoneNumberLabel: 'رقم الهاتف',
      newPasswordLabel: 'كلمة المرور الجديدة',
      newPasswordPlaceholder: 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية',
      saveChanges: 'حفظ التغييرات',
      updating: 'جاري التحديث...',
      successUpdate: 'تم تحديث الحساب بنجاح!',
      emptyPhoneError: 'لا يمكن أن يكون رقم الهاتف فارغاً.',
      phoneTakenError: 'رقم الهاتف هذا قيد الاستخدام بالفعل.',
      bonusRecords: 'سجلات المكافآت',
      bonusTransactions: 'معاملات المكافآت',
      noBonusesFound: 'لم يتم العثور على سجلات مكافآت.',
      bonusSub: 'مكافآت التسجيل والمكافآت المعتمدة من الإدارة.',
      registerWithdrawal: 'تسجيل حساب السحب',
      currentlyRegistered: 'الحساب المسجل',
      noRegisteredAccount: 'لم يتم تسجيل حساب سحب بعد.',
      payoutBank: 'بنك الدفع / الطريقة',
      withdrawalAccNo: 'رقم حساب السحب',
      withdrawalAccName: 'اسم صاحب الحساب',
      saveAccount: 'حفظ الحساب',
      withdrawalAccountRegistered: 'تم تسجيل حساب السحب بنجاح!',
      comingSoon: 'قريباً'
    },
    zh: {
      accountSettings: '账户设置',
      phoneNumberLabel: '手机号码',
      newPasswordLabel: '新密码',
      newPasswordPlaceholder: '留空以保持当前密码',
      saveChanges: '保存更改',
      updating: '更新中...',
      successUpdate: '账户更新成功！',
      emptyPhoneError: '手机号码不能为空。',
      phoneTakenError: '该手机号码已被使用。',
      bonusRecords: '红利记录',
      bonusTransactions: '红利交易',
      noBonusesFound: '未找到红利记录。',
      bonusSub: '注册奖励和管理员发放的红利。',
      registerWithdrawal: '注册提现账户',
      currentlyRegistered: '已注册账户',
      noRegisteredAccount: '尚未注册提现账户。',
      payoutBank: '提现银行 / 方式',
      withdrawalAccNo: '提现账号',
      withdrawalAccName: '账户持有人姓名',
      saveAccount: '保存账户',
      withdrawalAccountRegistered: '提现账户注册成功！',
      comingSoon: '即将推出'
    },
    es: {
      accountSettings: 'Configuración de la Cuenta',
      phoneNumberLabel: 'Número de Teléfono',
      newPasswordLabel: 'Nueva Contraseña',
      newPasswordPlaceholder: 'Dejar en blanco para mantener la contraseña actual',
      saveChanges: 'Guardar Cambios',
      updating: 'Actualizando...',
      successUpdate: '¡Cuenta actualizada con éxito!',
      emptyPhoneError: 'El número de teléfono no puede estar vacío.',
      phoneTakenError: 'Este número de teléfono ya está en uso.',
      bonusRecords: 'Registros de Bonos',
      bonusTransactions: 'Transacciones de Bonos',
      noBonusesFound: 'No se encontraron registros de bonos.',
      bonusSub: 'Recompensas de registro y bonos acreditados por el administrador.',
      registerWithdrawal: 'Registrar cuenta de retiro',
      currentlyRegistered: 'Cuenta registrada',
      noRegisteredAccount: 'Aún no se ha registrado ninguna cuenta de retiro.',
      payoutBank: 'Banco / Método de pago',
      withdrawalAccNo: 'Número de cuenta de retiro',
      withdrawalAccName: 'Nombre del titular de la cuenta',
      saveAccount: 'Guardar cuenta',
      withdrawalAccountRegistered: '¡Cuenta de retiro registrada con éxito!',
      comingSoon: 'Próximamente'
    },
    fr: {
      accountSettings: 'Paramètres du Compte',
      phoneNumberLabel: 'Numéro de Téléphone',
      newPasswordLabel: 'Nouveau Mot de Passe',
      newPasswordPlaceholder: 'Laisser vide pour conserver le mot de passe actuel',
      saveChanges: 'Enregistrer les Modifications',
      updating: 'Mise à jour...',
      successUpdate: 'Compte mis à jour avec succès !',
      emptyPhoneError: 'Le numéro de téléphone ne peut pas être vide.',
      phoneTakenError: 'Ce numéro de téléphone est déjà utilisé.',
      bonusRecords: 'Historique des Bonus',
      bonusTransactions: 'Transactions de Bonus',
      noBonusesFound: 'Aucun enregistrement de bonus trouvé.',
      bonusSub: 'Récompenses d\'inscription et bonus crédités par l\'administrateur.',
      registerWithdrawal: 'Enregistrer un compte de retrait',
      currentlyRegistered: 'Compte enregistré',
      noRegisteredAccount: 'Aucun compte de retrait enregistré pour le moment.',
      payoutBank: 'Banque / Méthode de paiement',
      withdrawalAccNo: 'Numéro de compte de retrait',
      withdrawalAccName: 'Nom du titulaire du compte',
      saveAccount: 'Enregistrer le compte',
      withdrawalAccountRegistered: 'Compte de retrait enregistré avec succès !',
      comingSoon: 'Bientôt disponible'
    },
    sw: {
      accountSettings: 'Mipangilio ya Akaunti',
      phoneNumberLabel: 'Nambari ya Simu',
      newPasswordLabel: 'Nenosiri Jipya',
      newPasswordPlaceholder: 'Acha tupu ili kuweka nenosiri la sasa',
      saveChanges: 'Hifadhi Mabadiliko',
      updating: 'Inasasisha...',
      successUpdate: 'Akaunti imesasishwa kikamilifu!',
      emptyPhoneError: 'Nambari ya simu haiwezi kuwa tupu.',
      phoneTakenError: 'Nambari hii ya simu tayari inatumika.',
      bonusRecords: 'Rekodi za Bonasi',
      bonusTransactions: 'Miamala ya Bonasi',
      noBonusesFound: 'Hakuna rekodi za bonasi zilizopatikana.',
      bonusSub: 'Sajili zawadi & bonasi zilizowekwa na msimamizi.',
      registerWithdrawal: 'Sajili Akaunti ya Kutoa Pesa',
      currentlyRegistered: 'Akaunti Iliyosajiliwa',
      noRegisteredAccount: 'Hakuna akaunti ya kutoa pesa iliyosajiliwa bado.',
      payoutBank: 'Benki ya Malipo / Njia',
      withdrawalAccNo: 'Nambari ya Akaunti ya Kutoa Pesa',
      withdrawalAccName: 'Jina la Mmiliki wa Akaunti',
      saveAccount: 'Hifadhi Akaunti',
      withdrawalAccountRegistered: 'Akaunti ya kutoa pesa imesajiliwa kikamilifu!',
      comingSoon: 'Inakuja Hivi Karibuni'
    },
    so: {
      accountSettings: 'Habaynta Koontada',
      phoneNumberLabel: 'Lambarka Taleefanka',
      newPasswordLabel: 'Erayga Sirta ah ee Cusub',
      newPasswordPlaceholder: 'Ku dhaaf maran si aad u haysato erayga sirta ah ee hadda',
      saveChanges: 'Keydi Isbeddelada',
      updating: 'La cusbooneysiinayo...',
      successUpdate: 'Koontada si guul leh ayaa loo cusbooneysiiyay!',
      emptyPhoneError: 'Lambarka taleefanku ma noqon karo mid maran.',
      phoneTakenError: 'Lambarkan taleefanka mar hore ayaa la isticmaalay.',
      bonusRecords: 'Diiwaanada Gunnada',
      bonusTransactions: 'Muamalaadka Gunnada',
      noBonusesFound: 'Wax diiwaanno gunno ah lama helin.',
      bonusSub: 'Diiwaangeli abaalmarinta & gunnooyinka maamuluhu ku shubay.',
      registerWithdrawal: 'Diiwaangeli Koontada Lacag Bixinta',
      currentlyRegistered: 'Koontada Diiwaangashan',
      noRegisteredAccount: 'Wali ma jirto koonto lacag bixin ah oo diiwaangashan.',
      payoutBank: 'Bangiga Lacag Bixinta / Habka',
      withdrawalAccNo: 'Lambarka Koontada Lacag Bixinta',
      withdrawalAccName: 'Magaca Lahaa Koontada',
      saveAccount: 'Keydi Koontada',
      withdrawalAccountRegistered: 'Koontada lacag bixinta si guul leh ayaa loo diiwaangeliyay!',
      comingSoon: 'Dhawaan Filo'
    },
    pt: {
      accountSettings: 'Configurações da Conta',
      phoneNumberLabel: 'Número de Telefone',
      newPasswordLabel: 'Nova Senha',
      newPasswordPlaceholder: 'Deixe em branco para manter a senha atual',
      saveChanges: 'Salvar Alterações',
      updating: 'Atualizando...',
      successUpdate: 'Conta atualizada com sucesso!',
      emptyPhoneError: 'O número de telefone não pode estar vazio.',
      phoneTakenError: 'Este número de telefone já está em uso.',
      bonusRecords: 'Registros de Bônus',
      bonusTransactions: 'Transações de Bônus',
      noBonusesFound: 'Nenhum registro de bônus encontrado.',
      bonusSub: 'Recompensas de registro e bônus creditados pelo administrador.',
      registerWithdrawal: 'Registrar Conta de Retirada',
      currentlyRegistered: 'Conta Registrada',
      noRegisteredAccount: 'Nenhuma conta de retirada registrada ainda.',
      payoutBank: 'Banco / Método de Pagamento',
      withdrawalAccNo: 'Número da Conta de Retirada',
      withdrawalAccName: 'Nome do Titular da Conta',
      saveAccount: 'Salvar Conta',
      withdrawalAccountRegistered: 'Conta de retirada registrada com sucesso!',
      comingSoon: 'Em breve'
    }
  };

  const [activeHistoryPanel, setActiveHistoryPanel] = useState<'none' | 'recharges' | 'withdrawals' | 'transactions' | 'orders' | 'referrals' | 'bonuses'>('none');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');

  // Offline verification modal states
  const [selectedPendingRecharge, setSelectedPendingRecharge] = useState<Transaction | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Withdrawal tax and offline verification modal states
  const [selectedPendingWithdrawal, setSelectedPendingWithdrawal] = useState<Transaction | null>(null);
  const [withdrawalTaxRefInput, setWithdrawalTaxRefInput] = useState('');
  const [withdrawalTaxScreenshot, setWithdrawalTaxScreenshot] = useState<string | null>(null);
  const [withdrawalVerificationCode, setWithdrawalVerificationCode] = useState('');
  const [withdrawalTaxLoading, setWithdrawalTaxLoading] = useState(false);
  const [withdrawalTaxError, setWithdrawalTaxError] = useState('');
  const [withdrawalTaxSuccess, setWithdrawalTaxSuccess] = useState('');
  const [withdrawalDragActive, setWithdrawalDragActive] = useState(false);

  // Settings states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsLoading, setSettingsLoading] = useState('');

  // Withdrawal Account state
  const [showWithdrawalAccountModal, setShowWithdrawalAccountModal] = useState(false);
  const [withdrawalBank, setWithdrawalBank] = useState(currentUser?.withdrawalBank || 'Commercial Bank of Ethiopia (CBE)');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [withdrawalAccNo, setWithdrawalAccNo] = useState(currentUser?.withdrawalAccNo || '');
  const [withdrawalAccName, setWithdrawalAccName] = useState(currentUser?.withdrawalAccName || '');
  const [withdrawalAccError, setWithdrawalAccError] = useState('');
  const [withdrawalAccSuccess, setWithdrawalAccSuccess] = useState('');
  const [withdrawalAccLoading, setWithdrawalAccLoading] = useState(false);

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.withdrawalBank) setWithdrawalBank(currentUser.withdrawalBank);
      if (currentUser.withdrawalAccNo) setWithdrawalAccNo(currentUser.withdrawalAccNo);
      if (currentUser.withdrawalAccName) setWithdrawalAccName(currentUser.withdrawalAccName);
    }
  }, [currentUser]);

  const isEthiopianUser = !!(
    currentUser && (
      currentUser.phoneNumber?.trim().startsWith('+251') || 
      currentUser.phoneNumber?.trim().startsWith('251') || 
      currentUser.phoneNumber?.trim().startsWith('09') || 
      currentUser.phoneNumber?.trim().startsWith('07') || 
      currentUser.phoneNumber?.trim().startsWith('9') || 
      currentUser.phoneNumber?.trim().startsWith('7')
    )
  );

  const getUserCountryCode = (phone?: string) => {
    if (!phone) return null;
    const trimmed = phone.trim();
    const codes = ['+254', '+253', '+252', '+291', '+211', '+249', '+971', '+244', '+86'];
    for (const code of codes) {
      if (trimmed.startsWith(code) || trimmed.startsWith(code.replace('+', ''))) {
        return code;
      }
    }
    return null;
  };

  const ETH_BANKS = [
    'Commercial Bank of Ethiopia (CBE)',
    'Telebirr',
    'Dashen Bank',
    'Bank of Abyssinia (BoA)',
    'Awash Bank',
    'United Bank (Hibret Bank)',
    'Nib International Bank',
    'Wegagen Bank'
  ];

  const COUNTRY_LOCAL_METHODS = [
    { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'M-Pesa (Safaricom)' },
    { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'Airtel Money (Kenya)' },
    { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'Equity Bank (Kenya)' },
    { countryCode: '+253', countryName: 'Djibouti', flag: '🇩🇯', bank: 'Waafi Cash (Djibouti)' },
    { countryCode: '+253', countryName: 'Djibouti', flag: '🇩🇯', bank: 'CAC Bank Pay' },
    { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'EVC Plus (Somalia)' },
    { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'Zaad (Somalia)' },
    { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'Premier Bank (Somalia)' },
    { countryCode: '+211', countryName: 'South Sudan', flag: '🇸🇸', bank: 'm-Gurush (South Sudan)' },
    { countryCode: '+211', countryName: 'South Sudan', flag: '🇸🇸', bank: 'NilePay Mobile Money' },
    { countryCode: '+249', countryName: 'Sudan', flag: '🇸🇩', bank: 'Bank of Khartoum (BOK)' },
    { countryCode: '+249', countryName: 'Sudan', flag: '🇸🇩', bank: 'Sygpay Mobile Wallet' },
    { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'e& money (UAE)' },
    { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'STC Pay UAE' },
    { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'Careem Pay (UAE)' },
    { countryCode: '+244', countryName: 'Angola', flag: '🇦🇴', bank: 'Unitel Money (Angola)' },
    { countryCode: '+244', countryName: 'Angola', flag: '🇦🇴', bank: 'Multicaixa Express' },
    { countryCode: '+86', countryName: 'China', flag: '🇨🇳', bank: 'Alipay (支付宝)' },
    { countryCode: '+86', countryName: 'China', flag: '🇨🇳', bank: 'WeChat Pay (微信支付)' },
  ];

  const INT_WITHDRAW_METHODS = [
    'Mastercard',
    'PayPal',
    'Binance (USDT)',
    'Visa Card'
  ];

  const isEth = isEthiopianUser || currency === 'ETB';

  const handleWithdrawalAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalAccError('');
    setWithdrawalAccSuccess('');
    setWithdrawalAccLoading(true);

    try {
      const res = await registerWithdrawalAccount(withdrawalBank, withdrawalAccNo, withdrawalAccName);
      if (res.success) {
        setWithdrawalAccSuccess(localT[language].withdrawalAccountRegistered || res.message);
        setTimeout(() => {
          setShowWithdrawalAccountModal(false);
          setWithdrawalAccSuccess('');
        }, 1500);
      } else {
        setWithdrawalAccError(res.message);
      }
    } catch (err: any) {
      setWithdrawalAccError(err.message || 'An error occurred.');
    } finally {
      setWithdrawalAccLoading(false);
    }
  };

  if (!currentUser) return null;

  // Filter lists for current user
  const userTransactions = transactions.filter(t => t.userId === currentUser.id);
  const userRecharges = userTransactions.filter(t => t.type === 'recharge');
  const userWithdrawals = userTransactions.filter(t => t.type === 'withdraw');
  const userOrderRewards = userTransactions.filter(t => t.type === 'reward');
  const userBonuses = userTransactions.filter(t => 
    t.type === 'welcome_bonus' || 
    t.type === 'referral_bonus' || 
    (t.type === 'recharge' && t.accountNumberOrRef === 'SYSTEM_MANUAL') ||
    t.description?.toLowerCase().includes('bonus')
  );
  const userTickets = supportMessages.filter(t => t.userId === currentUser.id);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?ref=${currentUser.inviteCode || `GOM${currentUser.phoneNumber.slice(-5)}`}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openSettings = () => {
    setSettingsPhone(currentUser.phoneNumber);
    setSettingsPassword('');
    setSettingsError('');
    setSettingsSuccess('');
    setShowSettingsModal(true);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    const trimmedPhone = settingsPhone.trim();
    if (!trimmedPhone) {
      setSettingsError(localT[language].emptyPhoneError);
      return;
    }

    setSettingsLoading('true');
    try {
      const res = await updateAccountDetails(trimmedPhone, settingsPassword);
      if (res.success) {
        setSettingsSuccess(localT[language].successUpdate);
        setSettingsPassword('');
        setTimeout(() => {
          setShowSettingsModal(false);
        }, 1500);
      } else {
        setSettingsError(res.message);
      }
    } catch (err: any) {
      console.error(err);
      setSettingsError('Failed to update settings. Please try again.');
    } finally {
      setSettingsLoading('');
    }
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
        <button 
          onClick={openSettings}
          className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all p-2 rounded-xl border border-slate-200/50 cursor-pointer active:scale-95 flex items-center justify-center shadow-2xs"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
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
              {formatPrice(currentUser.walletBalance, { showUnit: false })}
            </span>
            <span className="text-sm text-amber-400 font-black">{currency}</span>
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

          {/* Bonus Records */}
          <button 
            onClick={() => setActiveHistoryPanel('bonuses')}
            className="w-full py-3 flex items-center justify-between group text-left cursor-pointer transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/50">
                <Gift size={15} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">{localT[language].bonusRecords}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {userBonuses.length}
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

          {/* Register Withdrawal Account */}
          <button 
            onClick={() => setShowWithdrawalAccountModal(true)}
            className="w-full py-3 flex items-center justify-between group text-left cursor-pointer transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100/50">
                <Landmark size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  {currentUser.withdrawalAccNo ? localT[language].currentlyRegistered : localT[language].registerWithdrawal}
                </span>
                {currentUser.withdrawalAccNo ? (
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    {currentUser.withdrawalBank}: {currentUser.withdrawalAccNo} {currentUser.withdrawalAccName && `(${currentUser.withdrawalAccName})`}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    {localT[language].noRegisteredAccount}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
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

      {/* 6. PROFESSIONAL SYSTEM AND CORE SETTINGS PANEL - ADMIN ONLY */}
      {currentUser.role === 'admin' && (
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
      )}




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
                    {activeHistoryPanel === 'bonuses' && localT[language].bonusTransactions}
                    {activeHistoryPanel === 'transactions' && t('completeLedgerLog')}
                    {activeHistoryPanel === 'orders' && t('finishedMatchingTasks')}
                    {activeHistoryPanel === 'referrals' && t('referralRewardsProgram')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {activeHistoryPanel === 'referrals' ? t('inviteFriendsGetRewards') : activeHistoryPanel === 'bonuses' ? localT[language].bonusSub : t('etbAssetsLedger')}
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
                      <div 
                        key={tx.id} 
                        onClick={() => {
                          if (tx.status === 'pending') {
                            setSelectedPendingRecharge(tx);
                            setVerificationCodeInput('');
                            setVerificationError('');
                            setVerificationSuccess('');
                          }
                        }}
                        className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center transition-all ${
                          tx.status === 'pending' ? 'cursor-pointer hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="block text-xs font-black text-slate-800">{tx.bankName}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">{t('refCode')}: {tx.accountNumberOrRef}</span>
                          <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                          </span>
                          {tx.status === 'pending' && (
                            <span className="block text-[9px] text-amber-600 font-black flex items-center gap-1 animate-pulse mt-1">
                              👉 {language === 'pt' ? 'Clique para inserir o código de verificação' : 'Click to enter verification code'}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-black text-amber-800 text-right">+{formatPrice(tx.amount)}</span>
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
                    userWithdrawals.map(tx => {
                      const isClickable = tx.status === 'pending' || tx.status === 'tax_submitted';
                      return (
                        <div 
                          key={tx.id} 
                          onClick={() => {
                            if (isClickable) {
                              setSelectedPendingWithdrawal(tx);
                              setWithdrawalTaxRefInput(tx.taxRef || '');
                              setWithdrawalTaxScreenshot(tx.taxScreenshot || null);
                              setWithdrawalVerificationCode('');
                              setWithdrawalTaxError('');
                              setWithdrawalTaxSuccess('');
                            }
                          }}
                          className={`bg-white border p-4 rounded-2xl shadow-sm flex justify-between items-center transition-all ${
                            isClickable 
                              ? 'border-amber-200/80 hover:border-amber-300 cursor-pointer hover:shadow active:scale-[0.99] bg-gradient-to-r from-white to-amber-50/20' 
                              : 'border-slate-100'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="block text-xs font-black text-slate-800">{tx.bankName}</span>
                            <span className="block text-[10px] text-slate-400 font-medium">{t('accountNumber')}: {tx.accountNumberOrRef}</span>
                            <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                            </span>
                            {isClickable && (
                              <span className="block text-[9px] text-amber-600 font-bold animate-pulse mt-1">
                                🔔 {tx.status === 'pending' ? (language === 'pt' ? 'Pagar taxa de 10% para liberar' : 'Pay 10% tax to release') : (language === 'pt' ? 'Inserir código de verificação' : 'Click to enter verification code')}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="block text-xs font-black text-red-500">-{formatPrice(tx.amount)}</span>
                            <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 ${
                              tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              tx.status === 'tax_submitted' ? 'bg-blue-100 text-blue-700' :
                              tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {tx.status === 'pending' ? (language === 'pt' ? 'Pendente' : 'Pending Tax') : 
                               tx.status === 'tax_submitted' ? (language === 'pt' ? 'Aprovação Pendente' : 'Approval Pending') :
                               tx.status === 'approved' ? t('approvedStatus') : t('rejectedStatus')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                )}

                {/* BONUSES LIST */}
                {activeHistoryPanel === 'bonuses' && (
                  userBonuses.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold">{localT[language].noBonusesFound}</div>
                  ) : (
                    userBonuses.map(tx => {
                      const isWelcome = tx.type === 'welcome_bonus';
                      const isReferral = tx.type === 'referral_bonus';
                      const isSystem = tx.accountNumberOrRef === 'SYSTEM_MANUAL';
                      
                      let bonusLabel = t('bonus');
                      if (isWelcome) bonusLabel = t('registrationWelcomeBonus');
                      else if (isReferral) bonusLabel = t('referralWelcomeBonus');
                      else if (isSystem) bonusLabel = t('adminBalanceCredit');

                      return (
                        <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                          <div className="space-y-1">
                            <span className="block text-xs font-black text-rose-600 uppercase tracking-wide">{bonusLabel}</span>
                            <span className="block text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px]">{formatPhoneNumbersInText(tx.description || '')}</span>
                            <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-xs font-black text-emerald-600">+{formatPrice(tx.amount)}</span>
                            <span className="inline-block text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mt-1.5">
                              {t('approvedStatus')}
                            </span>
                          </div>
                        </div>
                      );
                    })
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
                            <span className="block text-xs font-black text-slate-800 capitalize">{(tx.type || '').replace('_', ' ')}</span>
                            <span className="block text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px]">{formatPhoneNumbersInText(tx.description || '')}</span>
                            <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`block text-xs font-black ${isAddition ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {isAddition ? '+' : '-'}{formatPrice(tx.amount)}
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
                          <p className="text-[10px] text-slate-500 font-medium leading-normal max-w-[220px]">{formatPhoneNumbersInText(tx.description || '')}</p>
                          <span className="block text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock size={8} /> {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-xs font-black text-emerald-600">+{formatPrice(tx.amount)}</span>
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
                          <p>• {t('youGet100Etb', { reward: formatPrice(196) })}</p>
                          <p>• {t('yourFriendGets100Etb', { reward: formatPrice(196) })}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-800/30">
                          <span className="block text-[8px] uppercase tracking-wider text-emerald-300">{t('totalReferrals')}</span>
                          <span className="block text-sm font-black text-emerald-400 mt-0.5">{currentUser.referralCount || 0}</span>
                        </div>
                        <div className="bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-800/30">
                          <span className="block text-[8px] uppercase tracking-wider text-emerald-300">{t('referralEarnings')}</span>
                          <span className="block text-sm font-black text-emerald-400 mt-0.5">{formatPrice(currentUser.referralEarnings || 0)}</span>
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
                        <li>{t('instantCashBonus', { reward: formatPrice(196) })}</li>
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

        {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings className="text-amber-500" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {localT[language].accountSettings}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleUpdateSettings} className="p-6 space-y-4">
                {settingsError && (
                  <div className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black p-3 rounded-xl flex items-center gap-2">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{settingsError}</span>
                  </div>
                )}

                {settingsSuccess && (
                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                {/* Phone Input */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {localT[language].phoneNumberLabel}
                  </label>
                  <input
                    type="tel"
                    required
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    placeholder="e.g. 0912345678"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-semibold"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {localT[language].newPasswordLabel}
                  </label>
                  <input
                    type="password"
                    value={settingsPassword}
                    onChange={(e) => setSettingsPassword(e.target.value)}
                    placeholder={localT[language].newPasswordPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-semibold"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">
                    {localT[language].newPasswordPlaceholder}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={settingsLoading === 'true'}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {settingsLoading === 'true' ? localT[language].updating : localT[language].saveChanges}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showWithdrawalAccountModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Landmark className="text-amber-500" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {localT[language].registerWithdrawal}
                  </h3>
                </div>
                <button
                  onClick={() => setShowWithdrawalAccountModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleWithdrawalAccountSubmit} className="p-6 space-y-4">
                {withdrawalAccError && (
                  <div className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black p-3 rounded-xl flex items-center gap-2">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{withdrawalAccError}</span>
                  </div>
                )}

                {withdrawalAccSuccess && (
                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{withdrawalAccSuccess}</span>
                  </div>
                )}

                {/* Bank / Method Selection */}
                <div className="relative space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {localT[language].payoutBank}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBankDropdown(!showBankDropdown)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="truncate">
                      {withdrawalBank || 'Select Bank / Method'}
                    </span>
                    {showBankDropdown ? (
                      <ChevronUp size={14} className="text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    )}
                  </button>

                  {showBankDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-30 max-h-52 overflow-y-auto p-1.5 space-y-1"
                    >
                      {/* LOCAL METHODS */}
                      <div className="px-2.5 py-1 text-[8px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg">
                        📍 Local Methods
                      </div>
                      
                      {isEth ? (
                        ETH_BANKS.map((bank, index) => {
                          const isComingSoon = ['United Bank (Hibret Bank)', 'Nib International Bank', 'Wegagen Bank'].includes(bank);
                          if (isComingSoon) {
                            return (
                              <div
                                key={`eth-${index}`}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between opacity-60 bg-slate-50/30 cursor-not-allowed select-none"
                              >
                                <span className="text-slate-400">🇪🇹 {bank}</span>
                                <span className="text-[8px] bg-amber-100 text-amber-800 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0">
                                  {localT[language].comingSoon}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <button
                              key={`eth-${index}`}
                              type="button"
                              onClick={() => {
                                setWithdrawalBank(bank);
                                setShowBankDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                withdrawalBank === bank ? 'text-amber-600 bg-amber-50/40 font-black' : 'text-slate-600'
                              }`}
                            >
                              <span>🇪🇹 {bank}</span>
                              {withdrawalBank === bank && <Check size={12} className="text-amber-600 shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        (() => {
                          const code = getUserCountryCode(currentUser.phoneNumber);
                          const matchedMethods = COUNTRY_LOCAL_METHODS.filter(m => m.countryCode === code);
                          if (matchedMethods.length === 0) {
                            return <div className="px-3 py-1.5 text-[10px] text-slate-400 font-semibold">No local methods available</div>;
                          }
                          return matchedMethods.map((method, index) => (
                            <button
                              key={`other-${index}`}
                              type="button"
                              onClick={() => {
                                setWithdrawalBank(method.bank);
                                setShowBankDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                withdrawalBank === method.bank ? 'text-amber-600 bg-amber-50/40 font-black' : 'text-slate-600'
                              }`}
                            >
                              <span>{method.flag} {method.bank}</span>
                              {withdrawalBank === method.bank && <Check size={12} className="text-amber-600 shrink-0" />}
                            </button>
                          ));
                        })()
                      )}

                      {/* INTERNATIONAL METHODS */}
                      <div className="px-2.5 py-1 text-[8px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg mt-1">
                        🌐 International / Crypto
                      </div>
                      {INT_WITHDRAW_METHODS.map((bank, index) => (
                        <div
                          key={`int-${index}`}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between opacity-60 bg-slate-50/30 cursor-not-allowed select-none"
                        >
                          <span className="text-slate-400">💳 {bank}</span>
                          <span className="text-[8px] bg-amber-100 text-amber-800 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0">
                            {localT[language].comingSoon}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Account Holder Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {localT[language].withdrawalAccName}
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawalAccName}
                    onChange={(e) => setWithdrawalAccName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-semibold"
                  />
                </div>

                {/* Account Number Input */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {localT[language].withdrawalAccNo}
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawalAccNo}
                    onChange={(e) => setWithdrawalAccNo(e.target.value)}
                    placeholder="e.g. Bank Account or Wallet number"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-semibold"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawalAccountModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawalAccLoading}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {withdrawalAccLoading ? localT[language].updating : localT[language].saveAccount}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedPendingRecharge && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            {(() => {
              const currentTxInModal = transactions.find(t => t.id === selectedPendingRecharge.id) || selectedPendingRecharge;
              return (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
                >
                  {/* Header */}
                  <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-amber-500 animate-pulse" size={18} />
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                        {cvt.verifyRecharge}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPendingRecharge(null)}
                      className="w-7 h-7 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Form Content */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (currentTxInModal.status === 'approved') return;
                    setVerificationLoading(true);
                    setVerificationError('');
                    setVerificationSuccess('');
                    try {
                      const res = await verifyRechargeOffline(selectedPendingRecharge.id, verificationCodeInput);
                      if (res.success) {
                        setVerificationSuccess(res.message);
                        setVerificationCodeInput('');
                        setTimeout(() => {
                          setSelectedPendingRecharge(null);
                        }, 2000);
                      } else {
                        setVerificationError(res.message);
                      }
                    } catch (err: any) {
                      setVerificationError(err.message || 'An error occurred during verification.');
                    } finally {
                      setVerificationLoading(false);
                    }
                  }} className="p-6 space-y-4">
                    
                    {/* Details Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">{cvt.amount}</span>
                        <span className="text-slate-900 font-black">{formatPrice(selectedPendingRecharge.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">{cvt.bank}</span>
                        <span className="text-slate-800 font-bold">{selectedPendingRecharge.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">{cvt.reference}</span>
                        <span className="text-slate-800 font-mono font-bold select-all bg-slate-200/60 px-2 py-0.5 rounded text-[10px]">{selectedPendingRecharge.accountNumberOrRef}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">Status:</span>
                        {currentTxInModal.status === 'approved' ? (
                          <span className="text-emerald-600 font-black flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" /> {cvt.approved}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-black flex items-center gap-1 animate-pulse">
                            <Clock size={10} /> {cvt.pending}
                          </span>
                        )}
                      </div>
                    </div>

                    {verificationError && (
                      <div className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0 animate-bounce" />
                        <span>{verificationError}</span>
                      </div>
                    )}

                    {verificationSuccess && (
                      <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0 animate-ping" />
                        <span>{verificationSuccess}</span>
                      </div>
                    )}

                    {/* Verification Code Input Section */}
                    {currentTxInModal.status !== 'approved' && (
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {cvt.adminVerifyCode}
                        </label>
                        <input
                          type="text"
                          required
                          value={verificationCodeInput}
                          onChange={(e) => setVerificationCodeInput(e.target.value)}
                          placeholder="e.g. EXP36-SIG36"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-mono font-bold placeholder:font-sans placeholder:font-medium tracking-widest text-center"
                        />
                        <p className="text-[9px] text-slate-400 leading-normal pt-1 text-center font-medium">
                          {cvt.enterSecureCode}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {currentTxInModal.status === 'approved' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPendingRecharge(null)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                        >
                          {cvt.close}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedPendingRecharge(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="submit"
                            disabled={verificationLoading || !!verificationSuccess}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {verificationLoading ? cvt.verifying : cvt.verifyCode}
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </motion.div>
              );
            })()}
          </div>
        )}

        {selectedPendingWithdrawal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            {(() => {
              const currentTxInModal = transactions.find(t => t.id === selectedPendingWithdrawal.id) || selectedPendingWithdrawal;
              const taxAmount = currentTxInModal.amount * 0.10;
              return (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
                >
                  {/* Header */}
                  <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-slate-50 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-amber-500 animate-pulse" size={18} />
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                        {cvt.releaseWithdrawal}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPendingWithdrawal(null)}
                      className="w-7 h-7 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    
                    {/* Details Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">{cvt.withdrawalAmount}</span>
                        <span className="text-slate-900 font-black">{formatPrice(currentTxInModal.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">{cvt.taxDue}</span>
                        <span className="text-amber-600 font-black">{formatPrice(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">{cvt.bank}</span>
                        <span className="text-slate-800 font-bold">{currentTxInModal.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">{cvt.accountNo}</span>
                        <span className="text-slate-800 font-mono font-bold select-all bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px]">{currentTxInModal.accountNumberOrRef}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">Status:</span>
                        {currentTxInModal.status === 'approved' ? (
                          <span className="text-emerald-600 font-black flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" /> {cvt.complete}
                          </span>
                        ) : currentTxInModal.status === 'tax_submitted' ? (
                          <span className="text-blue-600 font-black flex items-center gap-1 animate-pulse">
                            <Clock size={10} /> {cvt.approvalPending}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-black flex items-center gap-1 animate-pulse">
                            <Clock size={10} /> {cvt.taxPending}
                          </span>
                        )}
                      </div>
                    </div>

                    {withdrawalTaxError && (
                      <div className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0 animate-bounce" />
                        <span>{withdrawalTaxError}</span>
                      </div>
                    )}

                    {withdrawalTaxSuccess && (
                      <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0 animate-ping" />
                        <span>{withdrawalTaxSuccess}</span>
                      </div>
                    )}

                    {/* Step 1: Submit Tax Proof */}
                    {currentTxInModal.status === 'pending' && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!withdrawalTaxRefInput.trim()) {
                          setWithdrawalTaxError(cvt.refRequired);
                          return;
                        }
                        setWithdrawalTaxLoading(true);
                        setWithdrawalTaxError('');
                        setWithdrawalTaxSuccess('');
                        try {
                          const res = await submitWithdrawalTax(
                            currentTxInModal.id,
                            withdrawalTaxRefInput.trim(),
                            withdrawalTaxScreenshot || undefined
                          );
                          if (res.success) {
                            setWithdrawalTaxSuccess(res.message);
                          } else {
                            setWithdrawalTaxError(res.message);
                          }
                        } catch (err: any) {
                          setWithdrawalTaxError(err.message || 'An error occurred.');
                        } finally {
                          setWithdrawalTaxLoading(false);
                        }
                      }} className="space-y-4">
                        <div className="bg-amber-50/50 rounded-2xl p-3.5 border border-amber-100/50 text-[10.5px] leading-relaxed text-slate-600 font-medium">
                          <p className="font-extrabold text-amber-900 mb-1.5 uppercase tracking-wider text-[9.5px]">
                            {cvt.taxPaymentRequired}
                          </p>
                          <p className="mb-2">
                            {cvt.taxDesc(formatPrice(taxAmount))}
                          </p>
                          <div className="bg-white border border-slate-200/50 p-3.5 rounded-xl text-center space-y-2.5">
                            <div>
                              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                {cvt.payTo}
                              </span>
                              <span className="block text-sm font-black text-slate-900 font-mono tracking-widest select-all bg-slate-100 px-3 py-1.5 rounded-lg mt-1 inline-block">
                                1000419524747
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('1000419524747');
                                alert(cvt.copiedAlert);
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[9.5px] uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                              📋 {cvt.copyCbe}
                            </button>
                          </div>
                        </div>

                        {/* Reference Input */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {cvt.taxRefLabel}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. FT262193910"
                            value={withdrawalTaxRefInput}
                            onChange={(e) => setWithdrawalTaxRefInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-mono font-bold tracking-widest text-center uppercase"
                          />
                        </div>

                        {/* Screenshot Upload */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {cvt.taxScreenshotLabel}
                          </label>
                          
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setWithdrawalDragActive(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setWithdrawalDragActive(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setWithdrawalDragActive(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                const file = e.dataTransfer.files[0];
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  if (event.target?.result) {
                                    const compressed = await compressImage(event.target.result as string);
                                    setWithdrawalTaxScreenshot(compressed);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-2 ${
                              withdrawalDragActive
                                ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                            onClick={() => {
                              document.getElementById('tax-receipt-upload-input')?.click();
                            }}
                          >
                            <input
                              type="file"
                              id="tax-receipt-upload-input"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    if (event.target?.result) {
                                      const compressed = await compressImage(event.target.result as string);
                                      setWithdrawalTaxScreenshot(compressed);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <UploadCloud size={28} className={withdrawalDragActive ? 'text-amber-500' : 'text-slate-400'} />
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-700">
                                {cvt.clickToUpload}
                              </p>
                              <p className="text-[8.5px] text-slate-400 font-semibold">
                                {cvt.supportedImages}
                              </p>
                            </div>
                          </div>

                          {withdrawalTaxScreenshot && (
                            <div className="relative border border-slate-200 rounded-xl p-1.5 bg-white inline-block">
                              <img src={withdrawalTaxScreenshot} alt="Uploaded receipt preview" className="max-h-24 object-contain rounded-lg border border-slate-100" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWithdrawalTaxScreenshot(null);
                                }}
                                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-rose-600 transition-colors shadow"
                              >
                                &times;
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPendingWithdrawal(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="submit"
                            disabled={withdrawalTaxLoading}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {withdrawalTaxLoading ? cvt.submitting : cvt.submitTaxProof}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 2: Input Verification / Tax Sign Code */}
                    {currentTxInModal.status === 'tax_submitted' && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!withdrawalVerificationCode.trim()) {
                          setWithdrawalTaxError(cvt.codeRequired);
                          return;
                        }
                        setWithdrawalTaxLoading(true);
                        setWithdrawalTaxError('');
                        setWithdrawalTaxSuccess('');
                        try {
                          const res = await verifyWithdrawalOffline(currentTxInModal.id, withdrawalVerificationCode.trim());
                          if (res.success) {
                            setWithdrawalTaxSuccess(res.message);
                            setWithdrawalVerificationCode('');
                            setTimeout(() => {
                              setSelectedPendingWithdrawal(null);
                            }, 2000);
                          } else {
                            setWithdrawalTaxError(res.message);
                          }
                        } catch (err: any) {
                          setWithdrawalTaxError(err.message || 'Verification failed.');
                        } finally {
                          setWithdrawalTaxLoading(false);
                        }
                      }} className="space-y-4">
                        
                        <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-100/50 text-[10.5px] leading-relaxed text-slate-600 font-medium">
                          <p className="font-extrabold text-blue-900 mb-1.5 uppercase tracking-wider text-[9.5px]">
                            {cvt.taxVerificationPending}
                          </p>
                          <p className="mb-2">
                            {cvt.taxVerificationPendingDesc}
                          </p>
                          <div className="space-y-1 text-slate-500 font-semibold">
                            <div><span className="font-bold">{cvt.ftCode}</span> <span className="font-mono font-bold bg-white border px-1 rounded text-blue-600 text-[10px]">{currentTxInModal.taxRef}</span></div>
                          </div>
                        </div>

                        {/* Verification Code Input */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {cvt.taxReleaseCode}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. EXP36-SIG36"
                            value={withdrawalVerificationCode}
                            onChange={(e) => setWithdrawalVerificationCode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-mono font-bold placeholder:font-sans placeholder:font-medium tracking-widest text-center"
                          />
                          <p className="text-[9px] text-slate-400 leading-normal pt-1 text-center font-medium">
                            {cvt.obtainSignCode}
                          </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPendingWithdrawal(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98]"
                          >
                            {cvt.close}
                          </button>
                          <button
                            type="submit"
                            disabled={withdrawalTaxLoading || !!withdrawalTaxSuccess}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {withdrawalTaxLoading ? cvt.releasing : cvt.releaseWithdrawal}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
