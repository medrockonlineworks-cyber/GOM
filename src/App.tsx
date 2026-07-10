/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp, EXCHANGE_RATES } from './context/AppContext';
import { useTranslation } from './utils/translations';
import LanguageSelector from './components/LanguageSelector';
import CurrencySelector from './components/CurrencySelector';
import { MobileFrame } from './components/MobileFrame';
import { AuthScreens } from './components/AuthScreens';
import { HomeTab } from './components/HomeTab';
import { OrdersTab } from './components/OrdersTab';
import { MyTab } from './components/MyTab';
import { AdminConsole } from './components/AdminConsole';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  ShoppingBag, 
  User as UserIcon, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Info,
  Layers,
  Store,
  X,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Headphones,
  Copy,
  CheckCircle2,
  Download,
  Share,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Trash2,
  Image,
  FileText,
  Check,
  AlertCircle,
  Coins,
  Landmark
} from 'lucide-react';

const rechargeSuggestionTranslations: Record<string, {
  suggestTitle: string;
  suggestDesc: string;
  useAmountBtn: string;
}> = {
  en: {
    suggestTitle: "Transfer Recommendation",
    suggestDesc: "To ensure fast verification, we recommend transferring the rounded-up amount of {rounded} {currency} instead of {exact} {currency}.",
    useAmountBtn: "Use {rounded} {currency}",
  },
  am: {
    suggestTitle: "የማስተላለፊያ ምክረ ሃሳብ",
    suggestDesc: "ፈጣን ማረጋገጫ ለማግኘት፣ ከ {exact} {currency} ይልቅ ወደ ላይ የተጠጋጋውን {rounded} {currency} እንዲያስተላልፉ እንመክራለን።",
    useAmountBtn: "{rounded} {currency} ተጠቀም",
  },
  ar: {
    suggestTitle: "توصية التحويل",
    suggestDesc: "لضمان التحقق السريع، نوصي بتحويل المبلغ المقرب لأعلى {rounded} {currency} بدلاً من {exact} {currency}.",
    useAmountBtn: "استخدم {rounded} {currency}",
  },
  zh: {
    suggestTitle: "转账建议",
    suggestDesc: "为确保快速审核，建议您转账向上取整的金额 {rounded} {currency}，而非精确的 {exact} {currency}。",
    useAmountBtn: "使用 {rounded} {currency}",
  },
  es: {
    suggestTitle: "Recomendación de Transferencia",
    suggestDesc: "Para garantizar una verificación rápida, recomendamos transferir el monto redondeado de {rounded} {currency} en lugar de {exact} {currency}.",
    useAmountBtn: "Usar {rounded} {currency}",
  },
  fr: {
    suggestTitle: "Recommandation de Transfert",
    suggestDesc: "Pour garantir une vérification rapide, nous vous recommandons de transférer le montant arrondi de {rounded} {currency} au lieu de {exact} {currency}.",
    useAmountBtn: "Utiliser {rounded} {currency}",
  },
  sw: {
    suggestTitle: "Pendekezo la Uhamisho",
    suggestDesc: "Ili kuhakikisha uthibitishaji wa haraka, tunapendekeza uhamishe kiasi kilichofanyiwa makadirio ya juu cha {rounded} {currency} badala ya {exact} {currency}.",
    useAmountBtn: "Tumia {rounded} {currency}",
  },
  so: {
    suggestTitle: "Talo ku saabsan xawaaladda",
    suggestDesc: "Si loo xaqiijiyo hubin degdeg ah, waxaan kugula talineynaa inaad wareejiso cadadka la soo koobay ee {rounded} {currency} bedelkii {exact} {currency}.",
    useAmountBtn: "Isticmaal {rounded} {currency}",
  },
  pt: {
    suggestTitle: "Recomendação de Transferência",
    suggestDesc: "Para garantir uma verificação rápida, recomendamos transferir o valor arredondado de {rounded} {currency} em vez de {exact} {currency}.",
    useAmountBtn: "Usar {rounded} {currency}",
  }
};

const txidGuideTranslations: Record<string, {
  cbe: string;
  telebirr: string;
  binance: string;
  other: string;
}> = {
  en: {
    cbe: "CBE Tip: CBE transaction reference codes are exactly 12 characters/digits (e.g., FTxxxxxxxxxx). Double check your receipt or SMS.",
    telebirr: "Telebirr Tip: Telebirr transaction IDs are exactly 10 characters/digits (e.g., PPxxxxxxxxx). Check your SMS or confirmation screen.",
    binance: "Binance Tip: Enter your TRC-20 TxID (Transaction Hash) to ensure rapid, automated transaction matching.",
    other: "Please copy and paste the exact transaction ID, reference number, or transaction hash from your receipt."
  },
  am: {
    cbe: "የCBE ጠቃሚ ምክር፡ የCBE ማጣቀሻ ኮዶች በትክክል 12 ቁምፊዎች/አሃዞች ናቸው (ምሳሌ፡ FTxxxxxxxxxx)። እባክዎ ደረሰኝዎን ወይም SMSዎን ደግመው ያረጋግጡ።",
    telebirr: "የቴሌብር ጠቃሚ ምክር፡ የቴሌብር ግብይት መለያዎች በትክክል 10 ቁምፊዎች/አሃዞች ናቸው (ምሳሌ፡ PPxxxxxxxxx)። እባክዎ SMSዎን ወይም ማረጋገጫዎን ያረጋግጡ።",
    binance: "የቢናንስ ጠቃሚ ምክር፡ ፈጣን እና አውቶማቲክ ግብይትን ለማረጋገጥ የእርስዎን የTRC-20 TxID (የግብይት ሃሽ) ያስገቡ።",
    other: "እባክዎን ከደረሰኝዎ ላይ ትክክለኛውን የግብይት መለያ፣ የማጣቀሻ ቁጥር ወይም የግብይት ሃሽ ኮፒ አድርገው እዚህ ይለጥፉ።"
  },
  ar: {
    cbe: "نصيحة CBE: رموز مرجع معاملات البنك التجاري الإثيوبي تتكون من 12 رقمًا/حرفًا (مثل FTxxxxxxxxxx). تحقق من الإيصال أو الرسالة النصية.",
    telebirr: "نصيحة Telebirr: رموز مرجع معاملات تيلبير تتكون من 10 أرقام/أحرف (مثل PPxxxxxxxxx). تحقق من الرسالة النصية أو شاشة التأكيد.",
    binance: "نصيحة Binance: أدخل رمز TxID (هاش المعاملة) الخاص بـ TRC-20 لضمان مطابقة المعاملة التلقائية السريعة.",
    other: "يرجى نسخ ولصق رمز مرجع المعاملة بدقة من إيصال الدفع الخاص بك."
  },
  es: {
    cbe: "Consejo de CBE: Los códigos de referencia de CBE tienen exactamente 12 caracteres/dígitos (ej. FTxxxxxxxxxx). Verifique su recibo o SMS.",
    telebirr: "Consejo de Telebirr: Los ID de transacción de Telebirr tienen exactamente 10 caracteres/dígitos (ej. PPxxxxxxxxx). Verifique su SMS o pantalla de confirmación.",
    binance: "Consejo de Binance: Ingrese su TxID TRC-20 (Hash de transacción) para asegurar una verificación rápida y automatizada.",
    other: "Copie y pegue el ID de transacción, código de referencia o hash exacto de su recibo."
  },
  fr: {
    cbe: "Conseil CBE : Les codes de référence CBE font exactement 12 caractères/chiffres (ex. FTxxxxxxxxxx). Vérifiez votre reçu ou SMS.",
    telebirr: "Conseil Telebirr : Les identifiants Telebirr font exactement 10 caractères/chiffres (ex. PPxxxxxxxxx). Vérifiez votre SMS ou écran de confirmation.",
    binance: "Conseil Binance : Saisissez votre TxID TRC-20 (Hash de transaction) pour un rapprochement rapide et automatisé.",
    other: "Veuillez copier et coller l'identifiant de transaction, le code de référence ou le hash exact de votre reçu."
  },
  zh: {
    cbe: "CBE 提示：CBE 交易参考代码正好是 12 位字符/数字（例如 FTxxxxxxxxxx）。请仔细核对您的收据或短信。",
    telebirr: "Telebirr 提示：Telebirr 交易 ID 正好是 10 位字符/数字（例如 PPxxxxxxxxx）。请核对您的短信或确认屏幕。",
    binance: "币安提示：请输入您的 TRC-20 TxID（交易哈希值）以确保快速、自动化的交易对账。",
    other: "请从您的收据中复制并粘贴准确的交易 ID、参考号或交易哈希。"
  },
  sw: {
    cbe: "Kidokezo cha CBE: Misimbo ya kumbukumbu ya CBE ni tarakimu 12 hasa (mfano, FTxxxxxxxxxx). Angalia tena risiti au SMS yako.",
    telebirr: "Kidokezo cha Telebirr: ID za muamala za Telebirr ni tarakimu 10 hasa (mfano, PPxxxxxxxxx). Angalia SMS au skrini ya uthibitisho.",
    binance: "Kidokezo cha Binance: Weka TxID yako ya TRC-20 (Transaction Hash) ili kuhakikisha muafaka wa haraka na otomatiki.",
    other: "Tafadhali nakili na ubandike msimbo sahihi wa muamala, nambari ya marejeleo, au hash ya muamala kutoka kwenye risiti yako."
  },
  so: {
    cbe: "Talo CBE: Koodhadhka tixraaca ee CBE waa sax 12 xaraf/lambar (tusaale, FTxxxxxxxxxx). Laba jeer iska hubi rasiidhkaaga ama SMS-kaaga.",
    telebirr: "Talo Telebirr: Aqoonsiga muamala ee Telebirr waa sax 10 xaraf/lambar (tusaale, PPxxxxxxxxx). Hubi SMS-kaaga ama shaashadda xaqiijinta.",
    binance: "Talo Binance: Geli TRC-20 TxID (Transaction Hash) si loo xaqiijiyo waafajin degdeg ah oo toos ah.",
    other: "Fadlan koobi garee kuna dheji aqoonsiga muamala ee saxda ah, lambarka tixraaca, ama hash-ka rasiidhkaaga."
  },
  pt: {
    cbe: "Dica do CBE: Os códigos de referência de transação do CBE têm exatamente 12 caracteres/dígitos (ex: FTxxxxxxxxxx). Verifique seu recibo ou SMS.",
    telebirr: "Dica do Telebirr: Os IDs de transação do Telebirr têm exatamente 10 caracteres/dígitos (ex: PPxxxxxxxxx). Verifique seu SMS ou tela de confirmação.",
    binance: "Dica do Binance: Insira seu TxID TRC-20 (Hash de transação) para garantir uma conciliação rápida e automatizada.",
    other: "Copie e cole o ID de transação, número de referência ou hash exato do seu recibo."
  }
};

const paymentGuideTranslations: Record<string, {
  cbeTitle: string;
  cbeSteps: string[];
  telebirrTitle: string;
  telebirrSteps: string[];
  binanceTitle: string;
  binanceSteps: string[];
  intTitle: string;
  intSteps: string[];
  otherTitle: string;
  otherSteps: string[];
}> = {
  en: {
    cbeTitle: "Commercial Bank of Ethiopia (CBE) - Step-by-Step Guide",
    cbeSteps: [
      "Copy our official CBE Account Number shown above: 1000419524747.",
      "Open your CBE Mobile Banking app, or dial *889#.",
      "Transfer your desired recharge amount to Ethiopia agent-Leykun jemaneh.",
      "Copy the 12-digit transaction reference ID (usually starts with 'FT' or is purely numeric) from your confirmation SMS/receipt.",
      "Enter that exact 12-digit reference ID in the field below, and click 'Submit'."
    ],
    telebirrTitle: "Telebirr Mobile Money - Step-by-Step Guide",
    telebirrSteps: [
      "Copy our official Telebirr Number shown above: 0926193920.",
      "Open your Telebirr app or dial *127# on your phone.",
      "Select 'Send Money', choose 'To mobile number', and enter our agent number.",
      "Send the desired recharge amount to Ethiopia agent-Leykun jemaneh.",
      "Copy the 10-digit transaction ID from your confirmation SMS/receipt (usually starts with 'PP' or 'TX').",
      "Enter the exact 10-digit ID in the field below, and click 'Submit'."
    ],
    binanceTitle: "Binance Pay (USDT) - Crypto Transfer Guide",
    binanceSteps: [
      "Copy our official USDT-TRC20 wallet address shown above.",
      "Open your Binance app or preferred crypto wallet, and select 'Withdraw' or 'Pay'.",
      "Send your desired deposit amount in USDT on the Tron (TRC-20) network.",
      "After the transfer succeeds, copy the Transaction Hash (TxID) from your transaction details.",
      "Paste the TxID in the reference field below, and click 'Submit'."
    ],
    intTitle: "International Gateways - Step-by-Step Guide",
    intSteps: [
      "We will issue a secure checkout link or invoice for your chosen amount.",
      "Complete the payment using your Visa, Mastercard, or PayPal account.",
      "Note down the receipt number, payment email, or reference code.",
      "Enter the reference details below, and click 'Submit'."
    ],
    otherTitle: "Local Mobile Money & Bank Agents - Step-by-Step Guide",
    otherSteps: [
      "Copy our local agent account number or transfer details shown above.",
      "Send your desired deposit amount using your local mobile money (e.g., M-Pesa, EVC) or local bank app.",
      "Copy the exact transaction reference number or transaction ID from your provider's SMS or receipt.",
      "Enter the reference number below, and click 'Submit' for manual verification."
    ]
  },
  am: {
    cbeTitle: "የኢትዮጵያ ንግድ ባንክ (CBE) - የደረጃ በደረጃ መመሪያ",
    cbeSteps: [
      "ከላይ የሚታየውን ይፋዊ የCBE አካውንት ቁጥራችንን ይቅዱ፡ 1000419524747።",
      "የCBE ሞባይል ባንኪንግ መተግበሪያን ይክፈቱ ወይም *889# ይደውሉ።",
      "የሚፈልጉትን የማስቀመጫ መጠን ወደ Ethiopia agent-Leykun jemaneh ያስተላልፉ።",
      "ከተላከ በኋላ ከክፍያ ማረጋገጫ አጭር መልእክት (SMS) ወይም ደረሰኝ ላይ ባለ 12-ባህሪ የማጣቀሻ መለያውን (በ 'FT' የሚጀምር ወይም ሙሉ ቁጥር) ይቅዱ።",
      "ያንን ትክክለኛ ባለ 12-ባህሪ የማጣቀሻ መለያ ከታች ባለው ቦታ ላይ ያስገቡ እና 'Submit' የሚለውን በመጫን ይላኩ።"
    ],
    telebirrTitle: "የቴሌብር ሞባይል ገንዘብ - የደረጃ በደረጃ መመሪያ",
    telebirrSteps: [
      "ከላይ የሚታየውን ይፋዊ የቴሌብር ቁጥራችንን ይቅዱ፡ 0926193920።",
      "የቴሌብር (telebirr) መተግበሪያዎን ይክፈቱ ወይም በስልክዎ ላይ *127# ይደውሉ።",
      "'Send Money' የሚለውን ይምረጡ፣ በመቀጠል 'To mobile number' መርጠው የኛን ወኪል ቁጥር ያስገቡ።",
      "የሚፈልጉትን የገንዘብ መጠን ወደ Ethiopia agent-Leykun jemaneh ያስተላልፉ።",
      "ከክፍያ ማረጋገጫ አጭር መልእክት (SMS) ወይም ከደረሰኙ ላይ ባለ 10-ባህሪ የግብይት መለያውን (በ 'PP' ወይም 'TX' የሚጀምር) ይቅዱ።",
      "ያንን ትክክለኛ ባለ 10-ባህሪ የግብይት መለያ ከታች ያስገቡ እና 'Submit' የሚለውን በመጫን ይላኩ።"
    ],
    binanceTitle: "Binance Pay (USDT) - የክሪፕቶ ማስተላለፊያ መመሪያ",
    binanceSteps: [
      "ከላይ የሚታየውን ይፋዊ የUSDT-TRC20 የክሪፕቶ አድራሻችንን ይቅዱ።",
      "የቢናንስ (Binance) መተግበሪያን ወይም የክሪፕቶ ቦርሳዎን ይክፈቱ እና 'Withdraw' eller 'Pay' የሚለውን ይምረጡ።",
      "በ Tron (TRC-20) ኔትወርክ ላይ የሚፈልጉትን የUSDT መጠን ያስተላልፉ።",
      "የማስተላለፍ ሂደቱ ሲጠናቀቅ የግብይት ሃሽ (TxID) ኮዱን ከግብይት ዝርዝሮችዎ ላይ ይቅዱ።",
      "ያንን የTxID ኮድ ከታች በማጣቀሻ ቦታው ላይ ይለጥፉ፣ ከዚያ 'Submit' የሚለውን ይጫኑ።"
    ],
    intTitle: "አለም አቀፍ የክፍያ አማራጮች - የደረጃ በደረጃ መመሪያ",
    intSteps: [
      "ለገለጹት መጠን አስተማማኝ የክፍያ መጠየቂያ ደረሰኝ ወይም ሊንክ እንሰጥዎታለን።",
      "ቪዛ (Visa)፣ ማስተርካርድ (Mastercard) ወይም ፔይፓል (PayPal) አካውንት በመጠቀም ክፍያውን ይፈጽሙ።",
      "የደረሰኝ ቁጥሩን፣ የከፈሉበትን ኢሜል ወይም የማጣቀሻ ኮዱን ይያዙ።",
      "የማጣቀሻ መረጃውን ከታች ያስገቡ እና 'Submit' የሚለውን ይጫኑ።"
    ],
    otherTitle: "የሀገር ውስጥ ሞባይል ገንዘብ እና ባንኮች - የደረጃ በደረጃ መመሪያ",
    otherSteps: [
      "ከላይ የሚታየውን የሀገር ውስጥ ወኪላችንን ሂሳብ ወይም የማስተላለፊያ መረጃ ይቅዱ።",
      "የአካባቢዎን የሞባይል ገንዘብ (ለምሳሌ M-Pesa, EVC) ወይም ባንክ መተግበሪያ በመጠቀም ገንዘቡን ያስተላልፉ።",
      "ከአቅራቢዎ የክፍያ ማረጋገጫ አጭር መልእክት (SMS) ወይም ደረሰኝ ላይ የማጣቀሻ ቁጥሩን ወይም የግብይት መለያውን ይቅዱ።",
      "የማጣቀሻ ቁጥሩን ከታች ያስገቡ እና በእጅ እንዲረጋገጥ 'Submit' የሚለውን ይጫኑ።"
    ]
  },
  ar: {
    cbeTitle: "البنك التجاري الإثيوبي (CBE) - دليل خطوة بخطوة",
    cbeSteps: [
      "انسخ رقم حساب CBE الرسمي الموضح أعلاه: 1000419524747.",
      "افتح تطبيق الخدمات المصرفية عبر الهاتف المحمول من CBE، أو اتصل بالرمز *889#.",
      "قم بتحويل مبلغ الشحن المطلوب إلى وكيل إثيوبيا Ethiopia agent-Leykun jemaneh.",
      "انسخ معرف مرجع المعاملة المكون من 12 رقمًا (يبدأ عادةً بـ 'FT' أو أرقام فقط) من رسالة التأكيد النصية/الإيصال.",
      "أدخل معرف المرجع المكون من 12 رقمًا بالضبط في الحقل أدناه، وانقر فوق 'إرسال'."
    ],
    telebirrTitle: "تيلبير موبايل موني (Telebirr) - دليل خطوة بخطوة",
    telebirrSteps: [
      "انسخ رقم تيلبير الرسمي الموضح أعلاه: 0926193920.",
      "افتح تطبيق تيلبير الخاص بك أو اتصل بالرمز *127# على هاتفك.",
      "اختر 'إرسال الأموال'، واختر 'إلى رقم الهاتف المحمول'، وأدخل رقم وكيلنا.",
      "أرسل مبلغ الشحن المطلوب إلى وكيل إثيوبيا Ethiopia agent-Leykun jemaneh.",
      "انسخ معرف المعاملة المكون من 10 أرقام من رسالة التأكيد النصية/الإيصال (يبدأ عادةً بـ 'PP' أو 'TX').",
      "أدخل المعرف المكون من 10 أرقام بالضبط في الحقل أدناه، وانقر فوق 'إرسال'."
    ],
    binanceTitle: "بينانس باي (Binance Pay) - دليل تحويل العملات الرقمية",
    binanceSteps: [
      "انسخ عنوان محفظة USDT-TRC20 الرسمية الموضحة أعلاه.",
      "افتح تطبيق بينانس الخاص بك أو محفظة العملات الرقمية المفضلة لديك، وحدد 'سحب' أو 'دفع'.",
      "أرسل مبلغ الإيداع المطلوب بالدولار الرقمي (USDT) عبر شبكة Tron (TRC-20).",
      "بعد نجاح التحويل، انسخ هاش المعاملة (TxID) من تفاصيل معاملتك.",
      "الصق الـ TxID في حقل المرجع أدناه، وانقر فوق 'إرسال'."
    ],
    intTitle: "البوابات الدولية - دليل خطوة بخطوة",
    intSteps: [
      "سنقوم بإصدار رابط دفع آمن أو فاتورة بالمبلغ الذي اخترته.",
      "أكمل الدفع باستخدام حساب الفيزا، الماستركارد، أو الباي بال الخاص بك.",
      "قم بتدوين رقم الإيصال، بريد الدفع الإلكتروني، أو رمز المرجع.",
      "أدخل تفاصيل المرجع أدناه، وانقر فوق 'إرسال'."
    ],
    otherTitle: "الخدمات المالية المحلية ووكلاء البنوك - دليل خطوة بخطوة",
    otherSteps: [
      "انسخ رقم حساب وكيلنا المحلي أو تفاصيل التحويل الموضحة أعلاه.",
      "أرسل مبلغ الإيداع المطلوب باستخدام محفظة الجوال المحلية (مثل M-Pesa، EVC) أو تطبيق البنك المحلي الخاص بك.",
      "انسخ رقم مرجع المعاملة أو معرف المعاملة بالضبط من رسالة التأكيد أو إيصال مزود الخدمة الخاص بك.",
      "أدخل رقم المرجع أدناه، وانقر فوق 'إرسال' للتحقق اليدوي."
    ]
  },
  zh: {
    cbeTitle: "埃塞俄比亚商业银行 (CBE) - 步骤指南",
    cbeSteps: [
      "复制我们上面显示的官方 CBE 账号：1000419524747。",
      "打开您的 CBE 手机银行应用，或拨打 *889#。",
      "将您想要充值的金额转账给埃塞俄比亚代理 Ethiopia agent-Leykun jemaneh。",
      "从您的确认短信/收据中复制 12 位交易参考 ID（通常以 'FT' 开头或纯数字）。",
      "在下方字段中输入准确的 12 位参考 ID，然后点击'提交'。",
    ],
    telebirrTitle: "Telebirr 移动货币 - 步骤指南",
    telebirrSteps: [
      "复制我们上面显示的官方 Telebirr 号码：0926193920。",
      "在手机上打开您的 Telebirr 应用或拨打 *127#。",
      "选择'发送资金'，选择'发送至手机号'，然后输入我们的代理号码。",
      "将您想要充值的金额发送给埃塞俄比亚代理 Ethiopia agent-Leykun jemaneh。",
      "从您的确认短信/收据中复制 10 位交易 ID（通常以 'PP' 或 'TX' 开头）。",
      "在下方字段中输入准确的 10 位 ID，然后点击'提交'。"
    ],
    binanceTitle: "币安支付 (USDT) - 加密货币转账指南",
    binanceSteps: [
      "复制我们上面显示的官方 USDT-TRC20 钱包地址。",
      "打开您的币安应用或首选加密钱包，选择'提现'或'支付'。",
      "在 Tron (TRC-20) 网络上发送您想要充值的 USDT 金额。",
      "转账成功后，从交易详情中复制交易哈希 (TxID)。",
      "在下方参考字段中粘贴该 TxID，然后点击'提交'。"
    ],
    intTitle: "国际网关 - 步骤指南",
    intSteps: [
      "我们将为您选择的金额生成一个安全的结账链接或发票。",
      "使用您的 Visa、Mastercard 或 PayPal 账户完成付款。",
      "记下收据号、付款邮箱或参考代码。",
      "在下方输入参考详情，然后点击'提交'。"
    ],
    otherTitle: "本地移动货币和银行代理 - 步骤指南",
    otherSteps: [
      "复制我们上面显示的本地代理账号或转账详情。",
      "使用您本地的移动货币（如 M-Pesa、EVC）或本地银行应用发送您想要充值的金额。",
      "从您的运营商短信或收据中复制准确的交易参考号或交易 ID。",
      "在下方输入参考号，然后点击'提交'以进行人工审核。"
    ]
  },
  es: {
    cbeTitle: "Banco Comercial de Etiopía (CBE) - Guía Paso a Paso",
    cbeSteps: [
      "Copie nuestro número de cuenta oficial de CBE que se muestra arriba: 1000419524747.",
      "Abra su aplicación de banca móvil de CBE, o marque *889#.",
      "Transfiera el monto de recarga deseado al agente de Etiopía Ethiopia agent-Leykun jemaneh.",
      "Copie el ID de referencia de transacción de 12 dígitos (generalmente comienza con 'FT' o es puramente numérico) de su SMS o recibo de confirmación.",
      "Ingrese ese ID de referencia exacto de 12 dígitos en el campo a continuación y haga clic en 'Enviar'."
    ],
    telebirrTitle: "Telebirr Mobile Money - Guía Paso a Paso",
    telebirrSteps: [
      "Copie nuestro número oficial de Telebirr que se muestra arriba: 0926193920.",
      "Abra su aplicación Telebirr o marque *127# en su teléfono.",
      "Seleccione 'Enviar dinero', elija 'A número móvil' e ingrese nuestro número de agente.",
      "Envíe el monto de recarga deseado al agente de Etiopía Ethiopia agent-Leykun jemaneh.",
      "Copie el ID de transacción de 10 dígitos de su SMS o recibo de confirmación (generalmente comienza con 'PP' o 'TX').",
      "Ingrese el ID exacto de 10 dígitos en el campo a continuación y haga clic en 'Enviar'."
    ],
    binanceTitle: "Binance Pay (USDT) - Guía de Transferencia de Criptomonedas",
    binanceSteps: [
      "Copie nuestra dirección de billetera oficial de USDT-TRC20 que se muestra arriba.",
      "Abra su aplicación de Binance o billetera de criptomonedas preferida, y seleccione 'Retirar' o 'Pagar'.",
      "Envíe el monto de depósito deseado en USDT en la red Tron (TRC-20).",
      "Después de que la transferencia sea exitosa, copie el Hash de Transacción (TxID) de los detalles de su transacción.",
      "Pegue el TxID en el campo de referencia a continuación y haga clic en 'Enviar'."
    ],
    intTitle: "Pasarelas Internacionales - Guía Paso a Paso",
    intSteps: [
      "Emitiremos un enlace de pago seguro o factura para el monto elegido.",
      "Complete el pago utilizando su cuenta Visa, Mastercard o PayPal.",
      "Anote el número de recibo, correo electrónico de pago o código de referencia.",
      "Ingrese los detalles de referencia a continuación y haga clic en 'Enviar'."
    ],
    otherTitle: "Dinero Móvil Local y Agentes Bancarios - Guía Paso a Paso",
    otherSteps: [
      "Copie el número de cuenta de nuestro agente local o los detalles de transferencia mostrados arriba.",
      "Envíe el monto de depósito deseado utilizando su dinero móvil local (por ejemplo, M-Pesa, EVC) o la aplicación de su banco local.",
      "Copie el número de referencia de transacción exacto o el ID de transacción del SMS o recibo de su proveedor.",
      "Ingrese el número de referencia a continuación y haga clic en 'Enviar' para verificación manual."
    ]
  },
  fr: {
    cbeTitle: "Banque Commerciale d'Éthiopie (CBE) - Guide Étape par Étape",
    cbeSteps: [
      "Copiez notre numéro de compte CBE officiel affiché ci-dessus : 1000419524747.",
      "Ouvrez votre application de banque mobile CBE, ou composez le *889#.",
      "Transférez le montant de recharge souhaité à l'agent d'Éthiopie Ethiopia agent-Leykun jemaneh.",
      "Copiez l'ID de référence de transaction à 12 chiffres (commence généralement par 'FT' ou est purement numérique) à partir de votre SMS/reçu de confirmation.",
      "Saisissez cet ID de référence exact à 12 chiffres dans le champ ci-dessous, puis cliquez sur 'Soumettre'."
    ],
    telebirrTitle: "Telebirr Mobile Money - Guide Étape par Étape",
    telebirrSteps: [
      "Copiez notre numéro Telebirr officiel affiché ci-dessus : 0926193920.",
      "Ouvrez votre application Telebirr ou composez le *127# sur votre téléphone.",
      "Sélectionnez 'Envoyer de l'argent', choisissez 'Vers un numéro de mobile', puis saisissez notre numéro d'agent.",
      "Envoyez le montant de recharge souhaité à l'agent d'Éthiopie Ethiopia agent-Leykun jemaneh.",
      "Copiez l'ID de transaction à 10 chiffres de votre SMS/reçu de confirmation (commence généralement par 'PP' ou 'TX').",
      "Saisissez l'ID exact à 10 chiffres dans le champ ci-dessous, puis cliquez sur 'Soumettre'."
    ],
    binanceTitle: "Binance Pay (USDT) - Guide de Transfert Crypto",
    binanceSteps: [
      "Copiez notre adresse de portefeuille USDT-TRC20 officielle affichée ci-dessus.",
      "Ouvrez votre application Binance ou votre portefeuille crypto préféré, puis sélectionnez 'Retirer' ou 'Payer'.",
      "Envoyez le montant de dépôt souhaité en USDT sur le réseau Tron (TRC-20).",
      "Une fois le transfert réussi, copiez le Hash de Transaction (TxID) à partir des détails de votre transaction.",
      "Collez le TxID dans le champ de référence ci-dessous, puis cliquez sur 'Soumettre'."
    ],
    intTitle: "Passerelles Internationales - Guide Étape par Étape",
    intSteps: [
      "Nous émettrons un lien de paiement sécurisé ou une facture pour le montant choisi.",
      "Effectuez le paiement en utilisant votre compte Visa, Mastercard ou PayPal.",
      "Notez le numéro de reçu, l'e-mail de paiement ou le code de référence.",
      "Saisissez les détails de référence ci-dessous, puis cliquez sur 'Soumettre'."
    ],
    otherTitle: "Portefeuilles Mobiles Locaux & Agents Bancaires - Guide Étape par Étape",
    otherSteps: [
      "Copiez le numéro de compte de notre agent local ou les détails de transfert affichés ci-dessus.",
      "Envoyez le montant de dépôt souhaité en utilisant votre portefeuille mobile local (ex. M-Pesa, EVC) ou votre application bancaire locale.",
      "Copiez le numéro de référence de transaction exact ou l'ID de transaction du SMS ou du reçu de votre fournisseur.",
      "Saisissez le numéro de référence ci-dessous, puis cliquez sur 'Soumettre' pour une vérification manuelle."
    ]
  },
  sw: {
    cbeTitle: "Commercial Bank of Ethiopia (CBE) - Mwongozo wa Hatua kwa Hatua",
    cbeSteps: [
      "Nakili Nambari yetu rasmi ya Akaunti ya CBE iliyoonyeshwa hapo juu: 1000419524747.",
      "Fungua programu yako ya CBE Mobile Banking, au piga *889#.",
      "Tuma kiasi chako cha recharge unachotaka kwa msimamizi wa Ethiopia Ethiopia agent-Leykun jemaneh.",
      "Nakili msimbo wa marejeleo wa muamala wa tarakimu 12 (kawaida huanza na 'FT' au huwa nambari tupu) kutoka kwenye SMS au risiti ya uthibitisho.",
      "Weka msimbo huo sahihi wa marejeleo wa tarakimu 12 kwenye sehemu iliyo hapa chini, na bonyeza 'Wasilisha'."
    ],
    telebirrTitle: "Telebirr Mobile Money - Mwongozo wa Hatua kwa Hatua",
    telebirrSteps: [
      "Nakili Nambari yetu rasmi ya Telebirr iliyoonyeshwa hapo juu: 0926193920.",
      "Fungua programu yako ya Telebirr au piga *127# kwenye simu yako.",
      "Chagua 'Tuma Pesa', chagua 'Kwa nambari ya simu', na uweke nambari ya msimamizi wetu.",
      "Tuma kiasi chako cha recharge unachotaka kwa msimamizi wa Ethiopia Ethiopia agent-Leykun jemaneh.",
      "Nakili msimbo wa muamala wa tarakimu 10 kutoka kwenye SMS au risiti ya uthibitisho (kawaida huanza na 'PP' au 'TX').",
      "Weka msimbo huo sahihi wa tarakimu 10 kwenye sehemu iliyo hapa chini, na bonyeza 'Wasilisha'."
    ],
    binanceTitle: "Binance Pay (USDT) - Mwongozo wa Kutuma Crypto",
    binanceSteps: [
      "Nakili anwani yetu rasmi ya mkoba wa USDT-TRC20 iliyoonyeshwa hapo juu.",
      "Fungua programu yako ya Binance au mkoba wa crypto unaopendelea, na uchague 'Toa' au 'Lipa'.",
      "Tuma kiasi unachotaka kuweka katika USDT kwenye mtandao wa Tron (TRC-20).",
      "Baada ya uhamisho kufanikiwa, nakili Hash ya Muamala (TxID) kutoka kwenye maelezo ya muamala wako.",
      "Bandika TxID kwenye sehemu ya marejeleo hapa chini, na bonyeza 'Wasilisha'."
    ],
    intTitle: "Njia za Kimataifa - Mwongozo wa Hatua kwa Hatua",
    intSteps: [
      "Tutatoa kiungo salama cha malipo au ankara ya kiasi ulichochagua.",
      "Kamilisha malipo kwa kutumia akaunti yako ya Visa, Mastercard, au PayPal.",
      "Andika nambari ya risiti, barua pepe ya malipo, au msimbo wa marejeleo.",
      "Weka maelezo ya marejeleo hapa chini, na bonyeza 'Wasilisha'."
    ],
    otherTitle: "Pesa za Simu za Humu Nchini na Mawakala wa Benki - Mwongozo wa Hatua kwa Hatua",
    otherSteps: [
      "Nakili nambari ya akaunti ya msimamizi wetu wa nchini au maelezo ya kutuma pesa yaliyoonyeshwa hapo juu.",
      "Tuma kiasi unachotaka kuweka ukitumia huduma ya pesa kwenye simu ya humu nchini (mfano M-Pesa, EVC) au programu ya benki ya nchini.",
      "Nakili nambari kamili ya marejeleo ya muamala au ID ya muamala kutoka kwenye SMS au risiti ya mtoa huduma wako.",
      "Weka nambari ya marejeleo hapa chini, na bonyeza 'Wasilisha' kwa uthibitishaji wa mikono."
    ]
  },
  so: {
    cbeTitle: "Bangiga Ganacsiga ee Itoobiya (CBE) - Hagaha Tallaabo-Tallaabo ah",
    cbeSteps: [
      "Koobi garee Lambarka rasmiga ah ee CBE ee kor ku xusan: 1000419524747.",
      "Fur app-ka CBE Mobile Banking, ama wac *889#.",
      "U wareeji lacagta aad rabto inaad ku shubato wakiilka Itoobiya Ethiopia agent-Leykun jemaneh.",
      "Koobi garee 12-ka lambar ee tixraaca muamala-ka (badanaa wuxuu ku bilaabmaa 'FT' ama waa lambar kaliya) ee SMS-ka xaqiijinta ama rasiidhkaaga.",
      "Geli 12-kaas lambar ee saxda ah ee tixraaca garoonka hoose, dabadeedna guji 'Gudbi'."
    ],
    telebirrTitle: "Telebirr Mobile Money - Hagaha Tallaabo-Tallaabo ah",
    telebirrSteps: [
      "Koobi garee Lambarkayaga rasmiga ah ee Telebirr ee kor ku xusan: 0926193920.",
      "Fur app-kaaga Telebirr ama wac *127# taleefankaaga.",
      "Dooro 'Send Money', dooro 'To mobile number', kuna qor lambarka wakiilkayaga.",
      "U dir lacagta aad rabto inaad ku shubato wakiilka Itoobiya Ethiopia agent-Leykun jemaneh.",
      "Koobi garee 10-ka lambar ee tixraaca ee SMS-ka xaqiijinta ama rasiidhkaaga (badanaa wuxuu ku bilaabmaa 'PP' ama 'TX').",
      "Geli lambarkaas saxda ah ee 10-ka ah garoonka hoose, dabadeedna guji 'Gudbi'."
    ],
    binanceTitle: "Binance Pay (USDT) - Hagaha Wareejinta Cripto-ga",
    binanceSteps: [
      "Koobi garee ciwaankayaga rasmiga ah ee USDT-TRC20 ee kor ku xusan.",
      "Fur app-kaaga Binance ama boorsada cripto ee aad doorbidayso, doorona 'Withdraw' ama 'Pay'.",
      "Ku dir lacagta aad rabto inaad ku shubato USDT adigoo isticmaalaya shabakada Tron (TRC-20).",
      "Ka dib marka wareejintu guulaysato, koobi garee Hash-ka Muamala-ka (TxID) ee faahfaahinta muamala-kaaga.",
      "Ku dheji TxID garoonka tixraaca ee hoose, dabadeedna guji 'Gudbi'."
    ],
    intTitle: "Albaabada Caalamiga ah - Hagaha Tallaabo-Tallaabo ah",
    intSteps: [
      "Waxaan kuu soo saari doonaa link ammaan ah oo lacag bixinta ama qaansheegad qadarka aad dooratay.",
      "Ku dhammee lacag bixinta adoo isticmaalaya koontadaada Visa, Mastercard, ama PayPal.",
      "Xusuuso lambarka rasiidhka, iimaylka lacag bixinta, ama koodka tixraaca.",
      "Geli faahfaahinta tixraaca hoose, dabadeedna guji 'Gudbi'."
    ],
    otherTitle: "Lacagaha Mobile-ka ee Deegaanka & Wakiilada Bangiyada - Hagaha Tallaabo-Tallaabo ah",
    otherSteps: [
      "Koobi garee lambarka xisaabta wakiilkayaga deegaanka ama faahfaahinta wareejinta ee kor ku xusan.",
      "U dir qadarka aad rabto inaad ku shubato adoo isticmaalaya lacagta mobile-ka ee deegaankaaga (tusaale M-Pesa, EVC) ama app-ka bangigaaga deegaanka.",
      "Koobi garee lambarka tixraaca muamala-ka ee saxda ah ama ID-ga muamala-ka ee ka yimid SMS-ka ama rasiidhka bixiyahaaga.",
      "Geli lambarka tixraaca hoose, dabadeedna guji 'Gudbi' si loo xaqiijiyo gacanta."
    ]
  },
  pt: {
    cbeTitle: "Banco Comercial da Etiópia (CBE) - Guia Passo a Passo",
    cbeSteps: [
      "Copie nosso número de conta CBE oficial exibido acima: 1000419524747.",
      "Abra seu aplicativo de mobile banking do CBE ou disque *889#.",
      "Transfira o valor de recarga desejado para o agente da Etiópia Ethiopia agent-Leykun jemaneh.",
      "Copie o ID de referência da transação de 12 dígitos (geralmente começa com 'FT' ou é puramente numérico) do seu SMS ou recibo de confirmação.",
      "Insira o ID de referência exato de 12 dígitos no campo abaixo e clique em 'Enviar'."
    ],
    telebirrTitle: "Telebirr Mobile Money - Guia Passo a Passo",
    telebirrSteps: [
      "Copie nosso número oficial do Telebirr exibido acima: 0926193920.",
      "Abra seu aplicativo Telebirr ou disque *127# no seu telefone.",
      "Selecione 'Enviar Dinheiro', escolha 'Para número de celular' e insira o número do nosso agente.",
      "Envie o valor de recarga desejado para o agente da Etiópia Ethiopia agent-Leykun jemaneh.",
      "Copie o ID de transação de 10 dígitos do seu SMS ou recibo de confirmação (geralmente começa com 'PP' ou 'TX').",
      "Insira o ID exato de 10 dígitos no campo abaixo e clique em 'Enviar'."
    ],
    binanceTitle: "Binance Pay (USDT) - Guia de Transferência de Criptomoeda",
    binanceSteps: [
      "Copie nosso endereço de carteira oficial de USDT-TRC20 exibido acima.",
      "Abra seu aplicativo Binance ou carteira de criptomoeda de sua preferência e selecione 'Sacar' ou 'Pagar'.",
      "Envie o valor de depósito desejado em USDT na rede Tron (TRC-20).",
      "Após a transferência ser bem-sucedida, copie o Hash da Transação (TxID) dos detalhes da sua transação.",
      "Cole o TxID no campo de referência abaixo e clique em 'Enviar'."
    ],
    intTitle: "Portais Internacionais - Guia Passo a Passo",
    intSteps: [
      "Emitiremos um link de pagamento seguro ou fatura para o valor escolhido.",
      "Conclua o pagamento usando sua conta Visa, Mastercard ou PayPal.",
      "Anote o número do recibo, e-mail de pagamento ou código de referência.",
      "Insira os detalhes de referência abaixo e clique em 'Enviar'."
    ],
    otherTitle: "Carteiras Digitais Locais e Agentes Bancários - Guia Passo a Passo",
    otherSteps: [
      "Copie o número da conta do nosso agente local ou os detalhes de transferência exibidos acima.",
      "Envie o valor de depósito desejado usando sua carteira digital local (ex: M-Pesa, EVC) ou aplicativo do seu banco local.",
      "Copie o número de referência da transação exato ou ID da transação do SMS ou recibo do seu provedor.",
      "Insira o número de referência abaixo e clique em 'Enviar' para verificação manual."
    ]
  }
};

/*
      "የቴሌብር (telebirr) መተግበሪያዎን ይክፈቱ ወይም በስልክዎ ላይ *127# ይደውሉ።",
      "'Send Money' የሚለውን ይምረጡ፣ በመቀጠል 'To mobile number' መርጠው የኛን ወኪል ቁጥር ያስገቡ።",
      "የሚፈልጉትን የገንዘብ መጠን ወደ Ethiopia agent-Leykun jemaneh ያስተላልፉ።",
      "ከክፍያ ማረጋገጫ አጭር መልእክት (SMS) ወይም ከደረሰኙ ላይ ባለ 10-ባህሪ የግብይት መለያውን (በ 'PP' ወይም 'TX' የሚጀምር) ይቅዱ።",
      "ያንን ትክክለኛ ባለ 10-ባህሪ የግብይት መለያ ከታች ያስገቡ እና 'Submit' የሚለውን በመጫን ይላኩ።"
    ],
    binanceTitle: "Binance Pay (USDT) - የክሪፕቶ ማስተላለፊያ መመሪያ",
    binanceSteps: [
      "ከላይ የሚታየውን ይፋዊ የUSDT-TRC20 የክሪፕቶ አድራሻችንን ይቅዱ።",
      "የቢናንስ (Binance) መተግበሪያን ወይም የክሪፕቶ ቦርሳዎን ይክፈቱ እና 'Withdraw' eller 'Pay' የሚለውን ይምረጡ።",
      "በ Tron (TRC-20) ኔትወርክ ላይ የሚፈልጉትን የUSDT መጠን ያስተላልፉ።",
      "የማስተላለፍ ሂደቱ ሲጠናቀቅ የግብይት ሃሽ (TxID) ኮዱን ከግብይት ዝርዝሮችዎ ላይ ይቅዱ።",
      "ያንን የTxID ኮድ ከታች በማጣቀሻ ቦታው ላይ ይለጥፉ፣ ከዚያ 'Submit' የሚለውን ይጫኑ።"
    ],
    intTitle: "አለም አቀፍ የክፍያ አማራጮች - የደረጃ በደረጃ መመሪያ",
    intSteps: [
      "ለገለጹት መጠን አስተማማኝ የክፍያ መጠየቂያ ደረሰኝ ወይም ሊንክ እንሰጥዎታለን።",
      "ቪዛ (Visa)፣ ማስተርካርድ (Mastercard) ወይም ፔይፓል (PayPal) አካውንት በመጠቀም ክፍያውን ይፈጽሙ።",
      "የደረሰኝ ቁጥሩን፣ የከፈሉበትን ኢሜል ወይም የማጣቀሻ ኮዱን ይያዙ።",
      "የማጣቀሻ መረጃውን ከታች ያስገቡ እና 'Submit' የሚለውን ይጫኑ።"
    ],
    otherTitle: "የሀገር ውስጥ ሞባይል ገንዘብ እና ባንኮች - የደረጃ በደረጃ መመሪያ",
    otherSteps: [
      "ከላይ የሚታየውን የሀገር ውስጥ ወኪላችንን ሂሳብ ወይም የማስተላለፊያ መረጃ ይቅዱ።",
      "የአካባቢዎን የሞባይል ገንዘብ (ለምሳሌ M-Pesa, EVC) ወይም ባንክ መተግበሪያ በመጠቀም ገንዘቡን ያስተላልፉ።",
      "ከአቅራቢዎ የክፍያ ማረጋገጫ አጭር መልእክት (SMS) ወይም ደረሰኝ ላይ የማጣቀሻ ቁጥሩን ወይም የግብይት መለያውን ይቅዱ።",
      "የማጣቀሻ ቁጥሩን ከታች ያስገቡ እና በእጅ እንዲረጋገጥ 'Submit' የሚለውን ይጫኑ።"
    ]
  }
};
*/

const COUNTRIES = [
  { code: '+86', name: 'China (+86)', flag: '🇨🇳' },
  { code: '+253', name: 'Djibouti (+253)', flag: '🇩🇯' },
  { code: '+291', name: 'Eritrea (+291)', flag: '🇪🇷' },
  { code: '+251', name: 'Ethiopia (+251)', flag: '🇪🇹' },
  { code: '+254', name: 'Kenya (+254)', flag: '🇰🇪' },
  { code: '+234', name: 'Nigeria (+234)', flag: '🇳🇬' },
  { code: '+966', name: 'Saudi Arabia (+966)', flag: '🇸🇦' },
  { code: '+252', name: 'Somalia (+252)', flag: '🇸🇴' },
  { code: '+211', name: 'South Sudan (+211)', flag: '🇸🇸' },
  { code: '+249', name: 'Sudan (+249)', flag: '🇸🇩' },
  { code: '+971', name: 'UAE (+971)', flag: '🇦🇪' },
  { code: '+44', name: 'UK (+44)', flag: '🇬🇧' },
  { code: '+1', name: 'USA/Canada (+1)', flag: '🇺🇸' },
  { code: '', name: 'Local / Admin', flag: '📱' },
];

interface CountryLocalMethod {
  countryCode: string;
  countryName: string;
  flag: string;
  bank: string;
  accNo: string;
  accName: string;
}

const COUNTRY_LOCAL_METHODS: CountryLocalMethod[] = [
  { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'M-Pesa (Safaricom)', accNo: 'Paybill: 254254', accName: 'GOM Kenya Agent' },
  { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'Airtel Money (Kenya)', accNo: 'Till: 112233', accName: 'GOM Kenya Agent' },
  { countryCode: '+254', countryName: 'Kenya', flag: '🇰🇪', bank: 'Equity Bank (Kenya)', accNo: 'Equity Till: 987654', accName: 'GOM Kenya Agent' },
  { countryCode: '+253', countryName: 'Djibouti', flag: '🇩🇯', bank: 'Waafi Cash (Djibouti)', accNo: 'Merchant: 253253', accName: 'GOM Djibouti Agent' },
  { countryCode: '+253', countryName: 'Djibouti', flag: '🇩🇯', bank: 'CAC Bank Pay', accNo: 'CAC-556677', accName: 'GOM Djibouti Agent' },
  { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'EVC Plus (Somalia)', accNo: 'Merchant: 252252', accName: 'GOM Somalia Agent' },
  { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'Zaad (Somalia)', accNo: 'Merchant: 998877', accName: 'GOM Somalia Agent' },
  { countryCode: '+252', countryName: 'Somalia', flag: '🇸🇴', bank: 'Premier Bank (Somalia)', accNo: 'Premier-112233', accName: 'GOM Somalia Agent' },
  { countryCode: '+291', countryName: 'Eritrea', flag: '🇪🇷', bank: 'Nakfa Mobile Money', accNo: 'N-887766', accName: 'GOM Eritrea Agent' },
  { countryCode: '+291', countryName: 'Eritrea', flag: '🇪🇷', bank: 'Himbol Financial Services', accNo: 'H-554433', accName: 'GOM Eritrea Agent' },
  { countryCode: '+211', countryName: 'South Sudan', flag: '🇸🇸', bank: 'm-Gurush (South Sudan)', accNo: 'Merchant: 211211', accName: 'GOM South Sudan Agent' },
  { countryCode: '+211', countryName: 'South Sudan', flag: '🇸🇸', bank: 'NilePay Mobile Money', accNo: 'Merchant: 445566', accName: 'GOM South Sudan Agent' },
  { countryCode: '+249', countryName: 'Sudan', flag: '🇸🇩', bank: 'Bank of Khartoum (BOK)', accNo: 'BOK-Sudan-223344', accName: 'GOM Sudan Agent' },
  { countryCode: '+249', countryName: 'Sudan', flag: '🇸🇩', bank: 'Sygpay Mobile Wallet', accNo: 'Syg-667788', accName: 'GOM Sudan Agent' },
  { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'e& money (UAE)', accNo: 'Wallet: 971971', accName: 'GOM UAE Agent' },
  { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'STC Pay UAE', accNo: 'Wallet: 556677', accName: 'GOM UAE Agent' },
  { countryCode: '+971', countryName: 'UAE', flag: '🇦🇪', bank: 'Careem Pay (UAE)', accNo: 'Careem-334455', accName: 'GOM UAE Agent' },
  { countryCode: '+966', countryName: 'Saudi Arabia', flag: '🇸🇦', bank: 'STC Pay (KSA)', accNo: 'Wallet: 966966', accName: 'GOM KSA Agent' },
  { countryCode: '+966', countryName: 'Saudi Arabia', flag: '🇸🇦', bank: 'Urpay (KSA)', accNo: 'Ur-778899', accName: 'GOM KSA Agent' },
  { countryCode: '+966', countryName: 'Saudi Arabia', flag: '🇸🇦', bank: 'Al Rajhi Bank (KSA)', accNo: 'Rajhi-334422', accName: 'GOM KSA Agent' },
  { countryCode: '+1', countryName: 'USA/Canada', flag: '🇺🇸', bank: 'Zelle Transfer', accNo: 'zelle@gom-agent.com', accName: 'GOM North America LLC' },
  { countryCode: '+1', countryName: 'USA/Canada', flag: '🇺🇸', bank: 'Venmo Payment', accNo: '@gom-agent-pay', accName: 'GOM North America LLC' },
  { countryCode: '+1', countryName: 'USA/Canada', flag: '🇺🇸', bank: 'Cash App', accNo: '$gomagentpay', accName: 'GOM North America LLC' },
  { countryCode: '+44', countryName: 'UK', flag: '🇬🇧', bank: 'Revolut Pay', accNo: 'revolut@gom-agent.co.uk', accName: 'GOM UK Ltd' },
  { countryCode: '+44', countryName: 'UK', flag: '🇬🇧', bank: 'Faster Payments (UK)', accNo: 'Sort: 04-00-04, Acc: 98765432', accName: 'GOM UK Ltd' },
  { countryCode: '+44', countryName: 'UK', flag: '🇬🇧', bank: 'Monzo Bank Pay', accNo: 'Sort: 04-00-04, Acc: 11223344', accName: 'GOM UK Ltd' },
  { countryCode: '+86', countryName: 'China', flag: '🇨🇳', bank: 'Alipay (支付宝)', accNo: 'alipay@gom-agent.cn', accName: 'GOM China Agent' },
  { countryCode: '+86', countryName: 'China', flag: '🇨🇳', bank: 'WeChat Pay (微信支付)', accNo: 'wechat@gom-agent.cn', accName: 'GOM China Agent' },
];

const getUserCountry = (phone?: string) => {
  if (!phone) return null;
  const trimmed = phone.trim();
  for (const c of COUNTRIES) {
    if (c.code && (trimmed.startsWith(c.code) || trimmed.startsWith(c.code.replace('+', '')))) {
      return c;
    }
  }
  if (trimmed.startsWith('09') || trimmed.startsWith('07') || trimmed.startsWith('9') || trimmed.startsWith('7')) {
    return { code: '+251', name: 'Ethiopia (+251)', flag: '🇪🇹' };
  }
  return null;
};

type UserTab = 'home' | 'orders' | 'my';

function AppContent() {
  const { currentUser, deposit, withdraw, transactions, addSupportTicket, rechargeAccounts, language, setLanguage, currency, setCurrency, formatPrice } = useApp();
  const { t } = useTranslation(language);

  const isEthiopianUser = currentUser && (
    currentUser.phoneNumber?.trim().startsWith('+251') || 
    currentUser.phoneNumber?.trim().startsWith('251') || 
    (!currentUser.phoneNumber?.trim().startsWith('+') && (
      currentUser.phoneNumber?.trim().startsWith('09') || 
      currentUser.phoneNumber?.trim().startsWith('07') || 
      currentUser.phoneNumber?.trim().startsWith('9') || 
      currentUser.phoneNumber?.trim().startsWith('7')
    ))
  );

  const isEth = isEthiopianUser || currency === 'ETB';

  const INT_WITHDRAW_METHODS = [
    'Mastercard',
    'PayPal',
    'Binance (USDT)',
    'Visa Card'
  ];

  const INT_RECHARGE_METHODS = [
    { bank: 'Mastercard', accNo: 'N/A', accName: 'International Card' },
    { bank: 'PayPal', accNo: 'N/A', accName: 'International Wallet' },
    { bank: 'Binance Pay (USDT)', accNo: 'N/A', accName: 'Binance Smart Chain' },
    { bank: 'Visa Card', accNo: 'N/A', accName: 'International Card' }
  ];

  const [activeTab, setActiveTab] = useState<UserTab>('home');
  const [isAdminView, setIsAdminView] = useState(false);

  // PWA & Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  React.useEffect(() => {
    // 1. Check if already running in standalone mode (installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setIsAlreadyInstalled(isStandalone);
    
    if (isStandalone) {
      return;
    }

    // 2. Detect iOS device
    const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOSDevice);

    // 3. Listen for browser install prompt trigger (Chrome/Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Show the custom install helper after 3.5 seconds on mobile if not already installed
    const timer = setTimeout(() => {
      setShowInstallBanner(true);
    }, 3500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation decision: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      // General alert if native prompt is not available
      alert("To install GOM:\n\n1. Tap the browser options/menu button (three dots or share button).\n2. Select 'Add to Home screen' or 'Install'.");
    }
  };

  // Common modal triggers
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [prefillRechargeAmount, setPrefillRechargeAmount] = useState(0);

  const handleOpenRecharge = (amount: number = 0) => {
    setPrefillRechargeAmount(amount);
    setRechargeModalOpen(true);
  };

  // Form states for global modals
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeBank, setRechargeBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [rechargeRef, setRechargeRef] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [lastSubmittedRecharge, setLastSubmittedRecharge] = useState<{ amount: number; bank: string; ref: string } | null>(null);

  // Reset success state and details on modal open
  React.useEffect(() => {
    if (rechargeModalOpen) {
      setRechargeSuccess(false);
      setLastSubmittedRecharge(null);
      setRechargeError('');
      setShowChannelDropdown(false);
      if (isEth) {
        if (rechargeAccounts && rechargeAccounts.length > 0) {
          setRechargeBank(rechargeAccounts[0].bank);
        } else {
          setRechargeBank('Commercial Bank of Ethiopia (CBE)');
        }
      } else {
        setRechargeBank('Mastercard');
      }
    }
  }, [rechargeModalOpen, rechargeAccounts, isEth]);

  // Reset withdrawal success state and set default bank on modal open
  React.useEffect(() => {
    if (withdrawModalOpen) {
      setWithdrawError('');
      setWithdrawSuccess(false);
      setLastWithdrawInfo(null);
      if (currentUser?.withdrawalBank && currentUser?.withdrawalAccNo) {
        setWithdrawBank(currentUser.withdrawalBank);
        setWithdrawAccNo(currentUser.withdrawalAccNo);
        setWithdrawAccName(currentUser.withdrawalAccName || '');
      } else {
        if (isEth) {
          setWithdrawBank('Commercial Bank of Ethiopia (CBE)');
        } else {
          setWithdrawBank('Mastercard');
        }
        setWithdrawAccNo('');
        setWithdrawAccName('');
      }
    }
  }, [withdrawModalOpen, isEth, currentUser]);

  // Auto-close recharge modal when success is triggered
  React.useEffect(() => {
    if (rechargeSuccess) {
      const timer = setTimeout(() => {
        setRechargeModalOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [rechargeSuccess]);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [withdrawAccNo, setWithdrawAccNo] = useState('');
  const [withdrawAccName, setWithdrawAccName] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [lastWithdrawInfo, setLastWithdrawInfo] = useState<{ amount: number; bank: string; accNo: string } | null>(null);

  const [supportSubject, setSupportSubject] = useState('Wallet Recharge Issue');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Sync prefill amount when changes occur
  React.useEffect(() => {
    if (prefillRechargeAmount > 0) {
      const rate = EXCHANGE_RATES[currency] || 1;
      const val = (prefillRechargeAmount / rate).toFixed(2);
      setRechargeAmount(val);
    } else {
      setRechargeAmount('');
    }
  }, [prefillRechargeAmount, currency]);

  // Ethiopian banks list
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

  // Official admin bank details for manual deposit transfers
  const OFFICIAL_ACCOUNTS = rechargeAccounts;

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError('');
    setRechargeSuccess(false);

    // Validate if selected method is a local method of another country and user is from Ethiopia
    const matchedOtherCountryMethod = COUNTRY_LOCAL_METHODS.find(m => m.bank === rechargeBank);
    if (matchedOtherCountryMethod) {
      if (isEth) {
        setRechargeError('This local payment method is unavailable for users in Ethiopia. Ethiopia has its own local methods (CBE/Telebirr).');
        return;
      }
      const userCountry = getUserCountry(currentUser?.phoneNumber);
      if (userCountry?.code !== matchedOtherCountryMethod.countryCode) {
        setRechargeError(`This payment method is restricted to users in ${matchedOtherCountryMethod.countryName}.`);
        return;
      }
    }

    // Validate if non-Ethiopian is selecting Ethiopian local accounts
    const isEthBank = rechargeAccounts && rechargeAccounts.some(acc => acc.bank === rechargeBank);
    if (isEthBank && !isEth) {
      setRechargeError('Ethiopian local bank options are only available to users in Ethiopia.');
      return;
    }

    const isIntMethod = ['Mastercard', 'PayPal', 'Binance Pay (USDT)', 'Visa Card'].includes(rechargeBank);
    if (isEth && isIntMethod) {
      setRechargeError('This payment method is unavailable for users in Ethiopia.');
      return;
    }

    const inputAmt = Number(rechargeAmount);
    if (isNaN(inputAmt) || inputAmt <= 0) {
      setRechargeError('Please enter a valid amount.');
      return;
    }

    if (currency === 'USD') {
      if (inputAmt < 1) {
        setRechargeError('The minimum recharge amount is $1.00 USD.');
        return;
      }
    } else {
      if (inputAmt < 200) {
        setRechargeError('The minimum recharge amount is 200 ETB.');
        return;
      }
    }

    const baseAmt = currency === 'USD' ? inputAmt * 196 : inputAmt;

    if (!rechargeRef.trim()) {
      setRechargeError('Please provide the transaction reference number (TXID) or transfer ID.');
      return;
    }

    deposit(baseAmt, rechargeBank, rechargeRef);
    setLastSubmittedRecharge({ amount: baseAmt, bank: rechargeBank, ref: rechargeRef });
    setRechargeSuccess(true);
    setRechargeRef('');
    setRechargeAmount('');
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess(false);

    // Validate if selected method is a local method of another country and user is from Ethiopia
    const matchedOtherCountryMethod = COUNTRY_LOCAL_METHODS.find(m => m.bank === withdrawBank);
    if (matchedOtherCountryMethod) {
      if (isEth) {
        setWithdrawError('This local payout method is unavailable for users in Ethiopia. Ethiopia has its own local methods (CBE/Telebirr).');
        return;
      }
      const userCountry = getUserCountry(currentUser?.phoneNumber);
      if (userCountry?.code !== matchedOtherCountryMethod.countryCode) {
        setWithdrawError(`This payout method is restricted to users in ${matchedOtherCountryMethod.countryName}.`);
        return;
      }
    }

    // Validate if non-Ethiopian is selecting Ethiopian banks
    if (ETH_BANKS.includes(withdrawBank) && !isEth) {
      setWithdrawError('Ethiopian bank payouts are only available for users registered in Ethiopia.');
      return;
    }

    const isIntMethod = INT_WITHDRAW_METHODS.includes(withdrawBank);
    if (isEth && isIntMethod) {
      setWithdrawError('This withdrawal method is unavailable for users in Ethiopia.');
      return;
    }

    const inputAmt = Number(withdrawAmount);
    if (isNaN(inputAmt) || inputAmt <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }

    const baseAmt = currency === 'USD' ? inputAmt * 196 : inputAmt;
    if (baseAmt < 200) {
      setWithdrawError(currency === 'USD'
        ? 'The minimum withdrawal amount is $1.02 (200 ETB).'
        : 'The minimum withdrawal amount is 200 ETB.'
      );
      return;
    }

    const isTelebirr = withdrawBank.toLowerCase().includes('telebirr');
    const maxWithdraw = isTelebirr ? 75000 : 300000;
    if (baseAmt > maxWithdraw) {
      setWithdrawError(`The maximum withdrawal amount per single order for ${withdrawBank} is ${formatPrice(maxWithdraw)}.`);
      return;
    }

    const dailyLimit = isTelebirr ? 150000 : 300000;
    const withdrawnToday = (transactions || []).filter(t => {
      if (t.userId !== currentUser?.id || t.type !== 'withdraw' || t.status === 'rejected') {
        return false;
      }
      try {
        const txDate = new Date(t.createdAt);
        const today = new Date();
        return txDate.toDateString() === today.toDateString();
      } catch (e) {
        return false;
      }
    }).reduce((sum, t) => sum + t.amount, 0);

    if (withdrawnToday + baseAmt > dailyLimit) {
      const remainingLimit = Math.max(0, dailyLimit - withdrawnToday);
      setWithdrawError(`This request exceeds your remaining daily limit of ${formatPrice(remainingLimit)}.`);
      return;
    }

    if (baseAmt > currentUser.walletBalance) {
      setWithdrawError(`Insufficient balance. Maximum withdrawable is ${formatPrice(currentUser.walletBalance)}.`);
      return;
    }

    if (!withdrawAccName.trim()) {
      setWithdrawError('Please enter the bank account holder name.');
      return;
    }

    if (!withdrawAccNo.trim()) {
      setWithdrawError('Please enter your secure bank account number.');
      return;
    }

    const res = await withdraw(baseAmt, withdrawBank, withdrawAccNo, withdrawAccName);
    if (res.success) {
      setLastWithdrawInfo({ amount: baseAmt, bank: withdrawBank, accNo: withdrawAccNo });
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setWithdrawAccNo('');
      setWithdrawAccName('');
    } else {
      setWithdrawError(res.message);
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSuccess(false);

    if (!supportMessage.trim()) return;

    addSupportTicket(supportSubject, supportMessage);
    setSupportSuccess(true);
    setSupportMessage('');
    setTimeout(() => {
      setSupportSuccess(false);
      setSupportModalOpen(false);
    }, 2500);
  };

  if (!currentUser) {
    return <AuthScreens />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      
      {/* APP TOP HERO UTILITY RAIL */}
      <header className="h-14 bg-deep-forest flex items-center justify-between px-5 text-white shrink-0 shadow-md">
        <h1 className="text-base font-black tracking-widest uppercase text-white">
          GOM
        </h1>
        <div className="flex items-center gap-2">
          <CurrencySelector />
          <LanguageSelector />
        </div>
      </header>

      {/* DYNAMIC SCENE CONTAINER */}
      <div className="flex-1 overflow-y-auto flex flex-col relative">
        <AnimatePresence mode="wait">
          {isAdminView && currentUser.role === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full"
            >
              <AdminConsole onExit={() => setIsAdminView(false)} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col h-full"
            >
              {activeTab === 'home' && (
                <HomeTab 
                  onNavigateToOrders={() => setActiveTab('orders')}
                  onOpenRechargeModal={() => handleOpenRecharge(0)}
                  onOpenWithdrawModal={() => setWithdrawModalOpen(true)}
                  onOpenSupportModal={() => setSupportModalOpen(true)}
                />
              )}
              {activeTab === 'orders' && (
                <OrdersTab onOpenRechargeModal={(amount) => handleOpenRecharge(amount)} />
              )}
              {activeTab === 'my' && (
                <MyTab 
                  rechargeModalOpen={rechargeModalOpen}
                  setRechargeModalOpen={setRechargeModalOpen}
                  withdrawModalOpen={withdrawModalOpen}
                  setWithdrawModalOpen={setWithdrawModalOpen}
                  supportModalOpen={supportModalOpen}
                  setSupportModalOpen={setSupportModalOpen}
                  prefillRechargeAmount={prefillRechargeAmount}
                  onToggleAdminView={setIsAdminView}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MOBILE PERSISTENT BOTTOM TAB NAVIGATION */}
      {!isAdminView && (
        <div id="mobile_bottom_navigation_bar" className="bg-white border-t border-slate-200/80 px-6 py-2.5 flex items-center justify-around shrink-0 z-40 shadow-lg">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'home' ? 'text-bronze scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HomeIcon size={18} />
            <span className="text-[10px] tracking-wide font-extrabold">{t('home')}</span>
            {activeTab === 'home' && (
              <motion.div layoutId="nav_indicator" className="absolute -bottom-1 w-8 h-1 bg-bronze rounded-full" />
            )}
          </button>
 
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'orders' ? 'text-bronze scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShoppingBag size={18} />
            <span className="text-[10px] tracking-wide font-extrabold">{t('orders')}</span>
            {activeTab === 'orders' && (
              <motion.div layoutId="nav_indicator" className="absolute -bottom-1 w-8 h-1 bg-bronze rounded-full" />
            )}
          </button>
 
          <button
            onClick={() => setActiveTab('my')}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'my' ? 'text-bronze scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon size={18} />
            <span className="text-[10px] tracking-wide font-extrabold">{t('my')}</span>
            {activeTab === 'my' && (
              <motion.div layoutId="nav_indicator" className="absolute -bottom-1 w-8 h-1 bg-bronze rounded-full" />
            )}
          </button>
        </div>
      )}

      {/* --- RECHARGE POPUP MODAL --- */}
      <AnimatePresence>
        {rechargeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              {!rechargeSuccess && (
                <button
                  onClick={() => setRechargeModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 bg-slate-100 rounded-full cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              {rechargeSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={36} className="animate-[pulse_1s_infinite]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">{t('rechargeRequestSubmitted')}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal px-4">
                      {t('rechargeRequestSubmittedDesc')}
                    </p>
                  </div>
                  <div className="text-[10px] bg-slate-50 text-slate-400 py-1.5 px-3 rounded-full font-mono font-medium">
                    {t('payoutStatus')} {t('pendingVerification')}
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-bronze flex items-center justify-center shrink-0 border border-amber-500/10">
                      <ArrowUpRight size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 tracking-tight">{t('ethiopianBankDeposit')}</h3>
                    </div>
                  </div>

                  {/* Choose Channel Selector (Combines all bank accounts into one button dropdown) */}
                  <div className="relative">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                      {t('chooseDepositChannel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-800 font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span>{rechargeBank || t('selectBankAccount')}</span>
                      </div>
                      {showChannelDropdown ? (
                        <ChevronUp size={16} className="text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-500 shrink-0" />
                      )}
                    </button>

                    {showChannelDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-1.5 space-y-2.5"
                      >
                        {/* LOCAL METHODS GROUP */}
                        <div className="space-y-1">
                          <div className="px-2.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg">
                            📍 Local Payment Methods
                          </div>
                          
                          {/* Ethiopia Local Accounts */}
                          {rechargeAccounts && rechargeAccounts.map((acc, index) => {
                            const isAvailable = isEth;
                            return (
                              <button
                                key={`eth-local-${acc.id || index}`}
                                type="button"
                                onClick={() => {
                                  if (!isAvailable) {
                                    alert('Ethiopian local accounts are only available to users in Ethiopia.');
                                    return;
                                  }
                                  setRechargeBank(acc.bank);
                                  setShowChannelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                  rechargeBank === acc.bank ? 'text-bronze bg-amber-50/40 font-black' : 'text-slate-600'
                                } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>🇪🇹 {acc.bank}</span>
                                  {!isAvailable && (
                                    <span className="text-[7px] font-extrabold bg-red-50 text-red-600 border border-red-200/50 px-1 py-0.5 rounded">
                                      Restricted
                                    </span>
                                  )}
                                </div>
                                {rechargeBank === acc.bank && <Check size={13} className="text-bronze shrink-0" />}
                              </button>
                            );
                          })}

                          {/* Other Country Local Accounts */}
                          {COUNTRY_LOCAL_METHODS.map((method, index) => {
                            const userCountry = getUserCountry(currentUser?.phoneNumber);
                            const isAvailable = userCountry?.code === method.countryCode;
                            const isUnavailableForEth = isEth;

                            return (
                              <button
                                key={`other-local-${index}`}
                                type="button"
                                onClick={() => {
                                  if (isEth) {
                                    alert('Unavailable for Ethiopia. Ethiopia has its own local payment methods (CBE/Telebirr).');
                                    return;
                                  }
                                  if (!isAvailable) {
                                    alert(`This method is restricted to users in ${method.countryName}.`);
                                    return;
                                  }
                                  setRechargeBank(method.bank);
                                  setShowChannelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                  rechargeBank === method.bank ? 'text-bronze bg-amber-50/40 font-black' : 'text-slate-600'
                                } ${isUnavailableForEth || !isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{method.flag} {method.bank}</span>
                                  {isUnavailableForEth ? (
                                    <span className="text-[7px] font-extrabold bg-red-50 text-red-600 border border-red-200/50 px-1 py-0.5 rounded">
                                      Unavailable for Ethiopia
                                    </span>
                                  ) : !isAvailable ? (
                                    <span className="text-[7px] font-extrabold bg-slate-50 text-slate-500 border border-slate-200/50 px-1 py-0.5 rounded">
                                      Restricted
                                    </span>
                                  ) : (
                                    <span className="text-[7px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200/50 px-1 py-0.5 rounded">
                                      Local
                                    </span>
                                  )}
                                </div>
                                {rechargeBank === method.bank && <Check size={13} className="text-bronze shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* INTERNATIONAL METHODS GROUP */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                          <div className="px-2.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg">
                            🌐 International Payment Methods
                          </div>
                          {INT_RECHARGE_METHODS.map((method, index) => {
                            const isAvailable = !isEth;
                            return (
                              <button
                                key={`int-${index}`}
                                type="button"
                                onClick={() => {
                                  if (!isAvailable) {
                                    alert('International payment methods are unavailable for users in Ethiopia. Ethiopia has its own local payment options (CBE/Telebirr).');
                                    return;
                                  }
                                  setRechargeBank(method.bank);
                                  setShowChannelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 ${
                                  rechargeBank === method.bank ? 'text-bronze bg-amber-50/40 font-black' : 'text-slate-600'
                                } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>💳 {method.bank}</span>
                                  {!isAvailable && (
                                    <span className="text-[7px] font-extrabold bg-red-50 text-red-600 border border-red-200/50 px-1 py-0.5 rounded">
                                      Unavailable for Ethiopia
                                    </span>
                                  )}
                                </div>
                                {rechargeBank === method.bank && <Check size={13} className="text-bronze shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Active selected account details shown in a simplified layout */}
                  {rechargeAccounts && rechargeAccounts.find(acc => acc.bank === rechargeBank) && (() => {
                    const selectedAccount = rechargeAccounts.find(acc => acc.bank === rechargeBank)!;
                    return (
                      <motion.div
                        key={selectedAccount.bank}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white p-4.5 rounded-2xl border border-emerald-950/20 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="space-y-0.5">
                              <span className="block text-[11px] font-black tracking-tight text-amber-400 uppercase">
                                {selectedAccount.bank}
                              </span>
                              <span className="block text-lg font-mono font-bold tracking-wider text-white select-all">
                                {selectedAccount.accNo}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedAccount.accNo);
                              alert(`${selectedAccount.bank} Account number copied: ${selectedAccount.accNo}`);
                            }}
                            className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-3 py-2 rounded-xl font-extrabold cursor-pointer active:scale-95 transition-all text-[10px] flex items-center gap-1.5 shrink-0 shadow-xs"
                          >
                            <Copy size={11} />
                            <span>Copy</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Active selected international method details */}
                  {INT_RECHARGE_METHODS.some(method => method.bank === rechargeBank) && (() => {
                    const selectedMethod = INT_RECHARGE_METHODS.find(method => method.bank === rechargeBank)!;
                    return (
                      <motion.div
                        key={selectedMethod.bank}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border ${
                          isEth 
                            ? 'bg-red-50/75 border-red-200/80 text-red-950' 
                            : 'bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white border-emerald-950/20'
                        } shadow-sm relative overflow-hidden`}
                      >
                        {isEth ? (
                          <div className="space-y-1">
                            <span className="block text-[11px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
                              ⚠️ {selectedMethod.bank} Unavailable
                            </span>
                            <p className="text-[10px] text-red-800 leading-relaxed font-semibold">
                              This payment method is unavailable for users in Ethiopia. Please select local payment options like Commercial Bank of Ethiopia (CBE) or Telebirr.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="block text-[11px] font-black tracking-tight text-amber-400 uppercase">
                              🌐 {selectedMethod.bank} Gateway
                            </span>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-bold">
                              {selectedMethod.bank === 'Binance Pay (USDT)' 
                                ? 'Transfer USDT directly to USDT-TRC20 Wallet Address. Verification is automated.' 
                                : `Process via international merchant invoice. Enter your desired deposit amount below.`}
                            </p>
                            
                            {selectedMethod.bank === 'Binance Pay (USDT)' && (
                              <div className="flex justify-between items-center gap-4 mt-2.5 pt-2 border-t border-white/5">
                                <div className="space-y-0.5">
                                  <span className="block text-[8px] uppercase font-bold text-slate-400">USDT Address</span>
                                  <span className="block text-xs font-mono font-bold text-amber-300 select-all">TQ7xM8yJ2r9zPqN1vK5eW4sT3dG6hB8vX2a</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('TQ7xM8yJ2r9zPqN1vK5eW4sT3dG6hB8vX2a');
                                    alert('USDT-TRC20 address copied!');
                                  }}
                                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded-lg font-bold cursor-pointer transition-all text-[9px] flex items-center gap-1 shrink-0"
                                >
                                  <Copy size={10} />
                                  <span>Copy</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}

                  {/* Active selected other country local method details */}
                  {COUNTRY_LOCAL_METHODS.some(method => method.bank === rechargeBank) && (() => {
                    const selectedMethod = COUNTRY_LOCAL_METHODS.find(method => method.bank === rechargeBank)!;
                    const userCountry = getUserCountry(currentUser?.phoneNumber);
                    const isAvailable = userCountry?.code === selectedMethod.countryCode;
                    const isUnavailableForEth = isEth;

                    return (
                      <motion.div
                        key={selectedMethod.bank}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border ${
                          isUnavailableForEth
                            ? 'bg-red-50/75 border-red-200/80 text-red-950'
                            : !isAvailable
                            ? 'bg-slate-50 border-slate-200 text-slate-800'
                            : 'bg-gradient-to-br from-[#0F2022] via-[#162E30] to-[#0C1A1C] text-white border-emerald-950/20 shadow-lg'
                        } relative overflow-hidden`}
                      >
                        {isUnavailableForEth ? (
                          <div className="space-y-1">
                            <span className="block text-[11px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
                              ⚠️ {selectedMethod.bank} Unavailable
                            </span>
                            <p className="text-[10px] text-red-800 leading-relaxed font-semibold font-mono">
                              Unavailable for Ethiopia. Ethiopia has its own local method.
                            </p>
                          </div>
                        ) : !isAvailable ? (
                          <div className="space-y-1">
                            <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                              ⚠️ {selectedMethod.bank} Restricted
                            </span>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                              This local method is restricted to users in {selectedMethod.countryName}. Please select your own country's local method or an international payment option.
                            </p>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center gap-4">
                            <div className="space-y-1 flex-1">
                              <span className="block text-[11px] font-black tracking-tight text-amber-400 uppercase">
                                {selectedMethod.flag} {selectedMethod.bank} (Local Agent)
                              </span>
                              <div className="space-y-0.5">
                                <span className="block text-[8px] uppercase text-slate-400 font-bold">Transfer Account / Details</span>
                                <span className="block text-sm font-mono font-bold text-white select-all">
                                  {selectedMethod.accNo}
                                </span>
                              </div>
                              <span className="block text-[9px] text-slate-300 font-medium mt-1">
                                Beneficiary: {selectedMethod.accName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedMethod.accNo);
                                alert(`${selectedMethod.bank} transfer details copied: ${selectedMethod.accNo}`);
                              }}
                              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-3 py-2 rounded-xl font-bold cursor-pointer transition-all text-[10px] flex items-center gap-1 shrink-0"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}

                  {/* Dynamic Payment Method Guide */}
                  {(() => {
                    const g = paymentGuideTranslations[language] || paymentGuideTranslations.en;
                    let title = "";
                    let steps: string[] = [];

                    if (rechargeBank === 'Commercial Bank of Ethiopia (CBE)' || rechargeBank.includes('CBE') || rechargeBank.toLowerCase().includes('commercial bank')) {
                      title = g.cbeTitle;
                      steps = g.cbeSteps;
                    } else if (rechargeBank === 'Telebirr' || rechargeBank.toLowerCase().includes('telebirr')) {
                      title = g.telebirrTitle;
                      steps = g.telebirrSteps;
                    } else if (rechargeBank === 'Binance Pay (USDT)') {
                      title = g.binanceTitle;
                      steps = g.binanceSteps;
                    } else if (INT_RECHARGE_METHODS.some(method => method.bank === rechargeBank)) {
                      title = g.intTitle;
                      steps = g.intSteps;
                    } else {
                      title = g.otherTitle;
                      steps = g.otherSteps;
                    }

                    return (
                      <motion.div
                        key={`guide-${rechargeBank}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                          <div className="w-5 h-5 rounded-full bg-bronze/10 flex items-center justify-center text-bronze text-xs font-bold shrink-0">
                            💡
                          </div>
                          <span className="text-xs font-extrabold text-slate-800 tracking-tight">
                            {title}
                          </span>
                        </div>
                        
                        <div className="space-y-2.5">
                          {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start text-[10.5px] leading-relaxed text-slate-600 font-medium">
                              <span className="w-4 h-4 rounded-full bg-slate-200/80 text-slate-700 font-bold text-[8.5px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                {idx + 1}
                              </span>
                              <p className="flex-1">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-200/40 text-[9px] text-slate-400 font-semibold flex items-center gap-1.5">
                          <span>✨</span>
                          <span>
                            {t('depositCreditedNotice')}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Recharge Form */}
                  <form onSubmit={handleRechargeSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                    {rechargeError && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100 flex items-center gap-2"
                      >
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{rechargeError}</span>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                          {currency === 'USD' ? 'Amount (USD)' : t('amountEtb')}
                        </label>
                        <input
                          type="number"
                          required
                          step="any"
                          min={currency === 'USD' ? "1" : "200"}
                          placeholder={currency === 'USD' ? "Min $1.00" : t('min200')}
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all shadow-xs"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block font-semibold">
                          {currency === 'USD' ? 'Min: $1.00 USD (196 ETB)' : t('minimum200Etb')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{t('transferTxidRef')}</label>
                        <input
                          type="text"
                          required
                          placeholder="FTxxxxxxxxx"
                          value={rechargeRef}
                          onChange={(e) => setRechargeRef(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-bronze/40 focus:border-bronze focus:bg-white transition-all shadow-xs"
                        />
                        {(() => {
                          const tg = txidGuideTranslations[language] || txidGuideTranslations.en;
                          let tip = tg.other;
                          let isSpecial = false;

                          if (rechargeBank === 'Commercial Bank of Ethiopia (CBE)' || rechargeBank.includes('CBE') || rechargeBank.toLowerCase().includes('commercial bank')) {
                            tip = tg.cbe;
                            isSpecial = true;
                          } else if (rechargeBank === 'Telebirr' || rechargeBank.toLowerCase().includes('telebirr')) {
                            tip = tg.telebirr;
                            isSpecial = true;
                          } else if (rechargeBank === 'Binance Pay (USDT)') {
                            tip = tg.binance;
                            isSpecial = true;
                          }

                          return (
                            <div className="mt-1.5 space-y-1.5">
                              <span className="text-[9px] text-slate-400 block font-semibold">{t('referenceCodeOrTxid')}</span>
                              {isSpecial && (
                                <motion.div
                                  initial={{ opacity: 0, y: -2 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-[9.5px] text-amber-900 font-semibold leading-relaxed bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl space-y-1"
                                >
                                  <div className="flex items-center gap-1 text-amber-950 font-bold uppercase tracking-wider text-[8px]">
                                    <span>💡 Suggestion</span>
                                  </div>
                                  <p>{tip}</p>
                                </motion.div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {(() => {
                      const currentAmountNum = parseFloat(rechargeAmount);
                      const isDecimal = !isNaN(currentAmountNum) && currentAmountNum > 0 && (currentAmountNum % 1 !== 0);
                      const roundedUp = isDecimal ? Math.ceil(currentAmountNum) : 0;
                      const stSuggestion = rechargeSuggestionTranslations[language] || rechargeSuggestionTranslations.en;
                      if (!isDecimal) return null;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[10px] text-amber-900 leading-relaxed font-semibold space-y-2"
                        >
                          <div className="flex items-center gap-1.5 text-amber-950 font-black uppercase tracking-wider text-[9px]">
                            <Info size={12} className="text-amber-600 shrink-0" />
                            <span>{stSuggestion.suggestTitle}</span>
                          </div>
                          <p>
                            {stSuggestion.suggestDesc
                              .replace("{exact}", rechargeAmount)
                              .replace("{rounded}", roundedUp.toString())
                              .replace(/{currency}/g, currency === 'USD' ? 'USD' : 'ETB')}
                          </p>
                          <button
                            type="button"
                            onClick={() => setRechargeAmount(roundedUp.toString())}
                            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-xs inline-flex items-center gap-1"
                          >
                            <Coins size={10} />
                            {stSuggestion.useAmountBtn
                              .replace("{rounded}", roundedUp.toString())
                              .replace("{currency}", currency === 'USD' ? 'USD' : 'ETB')}
                          </button>
                        </motion.div>
                      );
                    })()}

                    {/* No screenshot upload required as per user feedback */}

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-bronze to-bronze-hover hover:from-bronze-hover hover:to-bronze text-white font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_rgba(212,163,89,0.3)] hover:shadow-[0_6px_20px_rgba(212,163,89,0.4)] active:scale-[0.98] transition-all flex items-center justify-center text-sm gap-2 mt-2 cursor-pointer"
                    >
                      {t('submitRechargeRequest')}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- WITHDRAW POPUP MODAL --- */}
      <AnimatePresence>
        {withdrawModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>

              {withdrawSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                    className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"
                  >
                    <CheckCircle2 size={36} className="text-emerald-600 animate-pulse" />
                  </motion.div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-800">
                      {t('withdrawalSuccessTitle')}
                    </h3>
                    <p className="text-[11px] text-slate-500 px-4">
                      {t('withdrawalSuccessMsg')}
                    </p>
                  </div>

                  {lastWithdrawInfo && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 max-w-xs mx-auto">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{t('amountLabel')}</span>
                        <span className="text-sm font-black text-emerald-600">
                          {lastWithdrawInfo.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">{t('bankLabel')}</span>
                        <span className="text-slate-700 font-extrabold text-right max-w-[150px] truncate">{lastWithdrawInfo.bank}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">{t('accountNoLabelShort')}</span>
                        <span className="text-slate-700 font-mono font-bold">{lastWithdrawInfo.accNo}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">{t('statusLabel')}</span>
                        <span className="bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                          {t('pendingApproval')}
                        </span>
                      </div>
                      <div className="pt-1 text-[9px] text-slate-400 text-center italic">
                        {t('payout24hNotice')}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setWithdrawSuccess(false);
                      setWithdrawModalOpen(false);
                      setLastWithdrawInfo(null);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow cursor-pointer mt-2"
                  >
                    {t('done')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-bronze flex items-center justify-center">
                      <ArrowDownLeft size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{t('withdrawalPayout')}</h3>
                      <p className="text-[10px] text-slate-400">{t('withdrawalToEthiopianAccounts')}</p>
                    </div>
                  </div>

                  {/* Withdraw Form */}
                  <form onSubmit={handleWithdrawSubmit} className="space-y-3.5 pt-2">
                    {withdrawError && (
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                        {withdrawError}
                      </div>
                    )}

                    {(() => {
                      const completedCount = currentUser?.completedOrderIds ? currentUser.completedOrderIds.length : 0;
                      const isLocked = completedCount < 15;

                      // Daily and single-order limit calculation
                      const isTelebirr = withdrawBank.toLowerCase().includes('telebirr');
                      const dailyLimitETB = isTelebirr ? 150000 : 300000;
                      const dailyLimit = currency === 'USD' ? dailyLimitETB / 196 : dailyLimitETB;
                      const singleOrderLimitETB = isTelebirr ? 75000 : 300000;
                      const singleOrderLimit = currency === 'USD' ? singleOrderLimitETB / 196 : singleOrderLimitETB;

                      // sum of today's withdrawals (excluding rejected ones)
                      const withdrawnToday = (transactions || []).filter(t => {
                        if (t.userId !== currentUser?.id || t.type !== 'withdraw' || t.status === 'rejected') {
                          return false;
                        }
                        try {
                          const txDate = new Date(t.createdAt);
                          const today = new Date();
                          return txDate.toDateString() === today.toDateString();
                        } catch (e) {
                          return false;
                        }
                      }).reduce((sum, t) => sum + t.amount, 0);

                      const withdrawnTodayConverted = currency === 'USD' ? withdrawnToday / 196 : withdrawnToday;
                      const attemptedAmount = Number(withdrawAmount) || 0;
                      const totalProjected = withdrawnTodayConverted + attemptedAmount;
                      const remainingLimit = Math.max(0, dailyLimit - withdrawnTodayConverted);
                      const exceedsSingleOrder = attemptedAmount > singleOrderLimit;

                      return (
                        <>
                          {isLocked && (
                            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3 text-[10px] text-amber-800 leading-relaxed space-y-1">
                              <span className="font-black text-amber-900 block uppercase tracking-wider text-[9px]">⚠️ {t('withdrawalLocked')}</span>
                              <p>{t('withdrawalLockedDesc', { completedCount })}</p>
                            </div>
                          )}



                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('selectPayoutBank')}</label>
                            <select
                              value={withdrawBank}
                              disabled={isLocked}
                              onChange={(e) => setWithdrawBank(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                            >
                              <optgroup label="📍 Local Payment Methods">
                                {/* First show Ethiopian banks if user is Eth, or tag them as restricted otherwise */}
                                {ETH_BANKS.map((bank, index) => {
                                  const isComingSoon = ['United Bank (Hibret Bank)', 'Nib International Bank', 'Wegagen Bank'].includes(bank);
                                  return (
                                    <option key={`eth-${index}`} value={bank} disabled={isComingSoon}>
                                      🇪🇹 {bank} {isComingSoon ? '(Coming Soon)' : !isEth ? '(Unavailable for your region)' : ''}
                                    </option>
                                  );
                                })}
                                {/* Next show other countries' local methods */}
                                {COUNTRY_LOCAL_METHODS.map((method, index) => {
                                  const userCountry = getUserCountry(currentUser?.phoneNumber);
                                  const isAvailable = userCountry?.code === method.countryCode;
                                  return (
                                    <option key={`other-local-${index}`} value={method.bank}>
                                      {method.flag} {method.bank} {isEth ? '(Unavailable for Ethiopia)' : !isAvailable ? '(Unavailable for your region)' : '(Local)'}
                                    </option>
                                  );
                                })}
                              </optgroup>
                              <optgroup label="🌐 International / Crypto Methods">
                                {INT_WITHDRAW_METHODS.map((bank, index) => (
                                  <option key={`int-${index}`} value={bank} disabled>
                                    💳 {bank} (Coming Soon)
                                  </option>
                                ))}
                              </optgroup>
                            </select>

                            {INT_WITHDRAW_METHODS.includes(withdrawBank) && isEth && (
                              <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                ⚠️ This withdrawal method is unavailable for users in Ethiopia. Please select local options like Commercial Bank of Ethiopia (CBE) or Telebirr.
                              </div>
                            )}

                            {INT_WITHDRAW_METHODS.includes(withdrawBank) && !isEth && (
                              <div className="mt-1.5 p-2 bg-emerald-50 text-emerald-800 text-[9px] font-bold rounded-xl border border-emerald-100 leading-normal">
                                🌐 Processing international payout via {withdrawBank}. Processing timeframe is 24 hours.
                              </div>
                            )}

                            {/* If selected is a local bank for another country and user is from Ethiopia */}
                            {COUNTRY_LOCAL_METHODS.some(m => m.bank === withdrawBank) && isEth && (
                              <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                ⚠️ This local payout method is unavailable for users in Ethiopia. Ethiopia has its own local methods (CBE/Telebirr). Please select an Ethiopian Bank option.
                              </div>
                            )}

                            {/* If selected is a local bank for another country and user is from a different non-matching country */}
                            {(() => {
                              const method = COUNTRY_LOCAL_METHODS.find(m => m.bank === withdrawBank);
                              if (method && !isEth) {
                                const userCountry = getUserCountry(currentUser?.phoneNumber);
                                const isAvailable = userCountry?.code === method.countryCode;
                                if (!isAvailable) {
                                  return (
                                    <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                      ⚠️ This method is restricted to users in {method.countryName}. Please select local methods for your region or international options.
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="mt-1.5 p-2 bg-emerald-50 text-emerald-800 text-[9px] font-bold rounded-xl border border-emerald-100 leading-normal">
                                      📍 Processing local payout to your {method.bank} account. Processing timeframe is 24 hours.
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}

                            {/* If selected is an Ethiopian bank but user is from outside Ethiopia */}
                            {ETH_BANKS.includes(withdrawBank) && !isEth && (
                              <div className="mt-1.5 p-2 bg-red-50 text-red-700 text-[9px] font-bold rounded-xl border border-red-100 leading-normal">
                                ⚠️ Ethiopian Bank payouts are only available for users registered in Ethiopia. Please select your own country's local method or international options.
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('accountHolder') || 'Account Holder Name'}</label>
                            <input
                              type="text"
                              required
                              disabled={isLocked}
                              placeholder="e.g. John Doe"
                              value={withdrawAccName}
                              onChange={(e) => setWithdrawAccName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('yourAccountNumberLabel')}</label>
                              <input
                                type="text"
                                required
                                disabled={isLocked}
                                placeholder="e.g. 1000xxxxxxxxx"
                                value={withdrawAccNo}
                                onChange={(e) => setWithdrawAccNo(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('withdrawAmountLabel')}</label>
                              <input
                                type="number"
                                required
                                min={currency === 'USD' ? "1.02" : "200"}
                                max={currency === 'USD' 
                                  ? (withdrawBank.toLowerCase().includes('telebirr') ? (75000 / 196).toFixed(2) : (300000 / 196).toFixed(2)) 
                                  : (withdrawBank.toLowerCase().includes('telebirr') ? "75000" : "300000")
                                }
                                disabled={isLocked}
                                placeholder={currency === 'USD' 
                                  ? `Min 1.02 - Max ${(withdrawBank.toLowerCase().includes('telebirr') ? 75000 / 196 : 300000 / 196).toFixed(1)}` 
                                  : (withdrawBank.toLowerCase().includes('telebirr') ? "Min 200 - Max 75k" : "Min 200 - Max 300k")
                                }
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze disabled:opacity-50"
                              />
                              <span className="text-[9px] text-slate-400 mt-1 block leading-normal">
                                {currency === 'USD' 
                                  ? `Min: $1.02 | Max: $${(withdrawBank.toLowerCase().includes('telebirr') ? 75000 / 196 : 300000 / 196).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`
                                  : `Min: 200 | Max: ${withdrawBank.toLowerCase().includes('telebirr') ? "75,000" : "300,000"} ETB`
                                }
                              </span>
                            </div>
                          </div>

                          {/* Limit Violation Alerts */}
                          {totalProjected > dailyLimit && (
                            <div className="bg-red-50 text-red-700 border border-red-100 rounded-lg p-2 text-[9px] font-black flex items-center gap-1.5 leading-relaxed mb-2.5 animate-pulse">
                              <AlertCircle size={12} className="shrink-0" />
                              <span>This request exceeds your remaining daily limit of {formatPrice(currency === 'USD' ? remainingLimit * 196 : remainingLimit)}.</span>
                            </div>
                          )}
                          {exceedsSingleOrder && !isLocked && (
                            <div className="bg-red-50 text-red-700 border border-red-100 rounded-lg p-2 text-[9px] font-black flex items-center gap-1.5 leading-relaxed mb-2.5 animate-pulse">
                              <AlertCircle size={12} className="shrink-0" />
                              <span>Single order limit for {withdrawBank} is {formatPrice(singleOrderLimitETB)}.</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isLocked || totalProjected > dailyLimit || exceedsSingleOrder}
                            className={`w-full font-bold py-3 rounded-xl shadow transition-all text-xs cursor-pointer ${
                              isLocked || totalProjected > dailyLimit || exceedsSingleOrder
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/50' 
                                : 'bg-bronze hover:bg-bronze-hover active:opacity-90 text-white'
                            }`}
                          >
                            {isLocked 
                              ? t('complete10TasksToWithdraw', { completedCount }) 
                              : totalProjected > dailyLimit 
                                ? 'Daily Limit Exceeded' 
                                : exceedsSingleOrder
                                  ? 'Single Order Limit Exceeded'
                                  : t('submitPayoutRequest')
                            }
                          </button>
                        </>
                      );
                    })()}
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LIVE SUPPORT SUBMIT POPUP MODAL --- */}
      <AnimatePresence>
        {supportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setSupportModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-bronze flex items-center justify-center">
                  <Headphones size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{t('contactOfficialSupport')}</h3>
                  <p className="text-[10px] text-slate-400">{t('supportResponseTime')}</p>
                </div>
              </div>

              {/* Support Form */}
              <form onSubmit={handleSupportSubmit} className="space-y-3.5 pt-2">
                {supportSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold border border-emerald-100">
                    {t('supportSuccessMsg')}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('ticketSubject')}</label>
                  <select
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze"
                  >
                    <option value="Wallet Recharge Issue">{t('rechargeIssue')}</option>
                    <option value="Withdrawal Delay / Lock">{t('subjectDelay')}</option>
                    <option value="Order Match Error">{t('orderIssue')}</option>
                    <option value="Verify CBE Transfer Receipt">{t('subjectCbe')}</option>
                    <option value="Other Technical Questions">{t('subjectTech')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{t('ticketMessage')}</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={t('messagePlaceholder')}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bronze resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-bronze hover:bg-bronze-hover active:opacity-90 text-white font-bold py-3 rounded-xl shadow transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} /> {t('sendMessageToAgent')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PWA INSTALLATION PROMPT / POPUP MODAL --- */}
      <AnimatePresence>
        {showInstallBanner && !isAlreadyInstalled && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full space-y-5 border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setShowInstallBanner(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>

              {/* App Identity Row */}
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 p-0.5 shadow-md flex items-center justify-center shrink-0">
                  <img src="/gom-logo.svg" alt="GOM" className="w-full h-full object-contain rounded-[14px]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('installGomApp')}</h3>
                  <p className="text-[10px] text-amber-600 font-extrabold tracking-wide uppercase mt-0.5">GOM</p>
                </div>
              </div>

              {/* Conditional Install CTA or Guide */}
              {isIOS ? (
                // iOS Installation Guide
                <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-4 text-[11px] text-amber-950 space-y-2.5">
                  <div className="font-extrabold uppercase tracking-wider text-[9px] text-amber-800 flex items-center gap-1">
                    <span className="animate-pulse">📱</span> {t('iosSafariGuide')}
                  </div>
                  <div className="leading-relaxed space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">1.</span>
                      <span>{t('iosStep1')}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">2.</span>
                      <span>{t('iosStep2')}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-black text-amber-900">3.</span>
                      <span>{t('iosStep3')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Android / Desktop / Chrome installation CTA
                <div className="space-y-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-blue-900 to-slate-900 hover:from-blue-850 hover:to-slate-850 text-white font-extrabold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} className="animate-bounce" /> {t('installAppBtn')}
                  </button>
                  
                  {!deferredPrompt && (
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                      {t('pwaManualGuide')}
                    </p>
                  )}
                </div>
              )}

              {/* Close / Dismiss */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg text-[10px] cursor-pointer transition-colors text-center"
                >
                  {t('continueInBrowser')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MobileFrame>
        <AppContent />
      </MobileFrame>
    </AppProvider>
  );
}
