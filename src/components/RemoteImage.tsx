/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CreditCard, Landmark } from 'lucide-react';
import { useRemoteImage, useRemoteImages } from '../context/RemoteImagesContext';
import { useApp } from '../context/AppContext';

interface RemoteImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Logical image name (e.g. "logo", "banner1") or path (e.g. "public/remote-images/banner1.jpg"). */
  name: string;
  /** Optional fallback image URL if the remote image is not yet cached or available. */
  fallbackSrc?: string;
}

export const RemoteImage: React.FC<RemoteImageProps> = ({
  name,
  fallbackSrc = '',
  alt = '',
  onError,
  ...rest
}) => {
  const { src } = useRemoteImage(name, fallbackSrc);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  const effectiveSrc = failedSrc === src && fallbackSrc && fallbackSrc !== src ? fallbackSrc : src;

  if (!effectiveSrc) {
    return null;
  }

  return (
    <img
      {...rest}
      src={effectiveSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (failedSrc !== src) {
          setFailedSrc(src);
        }
        onError?.(e);
      }}
    />
  );
};

interface RemoteIconProps {
  /** Primary logical image name in public/remote-images/ (e.g. "icon-recharge", "icon-withdraw"). */
  name: string;
  /** Optional alternate logical names to check in priority order. */
  aliases?: string[];
  alt?: string;
  className?: string;
  /** Rendered whenever no remote icon has been uploaded yet or if loading fails. */
  fallback: React.ReactNode;
}

export const RemoteIcon: React.FC<RemoteIconProps> = ({
  name,
  aliases,
  alt = '',
  className = 'w-5 h-5 object-contain',
  fallback,
}) => {
  const { getImageEntry } = useRemoteImages();
  const candidates = aliases && aliases.length > 0 ? [name, ...aliases] : [name];

  let resolvedUrl = '';
  for (const candidate of candidates) {
    const entry = getImageEntry(candidate);
    if (entry?.url) {
      resolvedUrl = entry.url;
      break;
    }
  }

  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    setFailedUrl(null);
  }, [resolvedUrl]);

  if (!resolvedUrl || failedUrl === resolvedUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(resolvedUrl)}
    />
  );
};

const BANK_MATCHERS: Array<{ key: string; patterns: string[] }> = [
  { key: 'cbe', patterns: ['commercial bank of ethiopia', 'cbe'] },
  { key: 'telebirr', patterns: ['telebirr'] },
  { key: 'dashen', patterns: ['dashen'] },
  { key: 'abyssinia', patterns: ['abyssinia', '(boa)', 'boa'] },
  { key: 'awash', patterns: ['awash'] },
  { key: 'hibret', patterns: ['hibret', 'united bank'] },
  { key: 'nib', patterns: ['nib international', 'nib bank', 'nib'] },
  { key: 'wegagen', patterns: ['wegagen'] },
  { key: 'siinqee', patterns: ['siinqee', 'sinqee', 'siinqe'] },
  { key: 'oromia', patterns: ['cooperative bank of oromia', 'oromia', 'coopbank'] },
  { key: 'cbebirr', patterns: ['cbe birr', 'cbebirr'] },
  { key: 'zemen', patterns: ['zemen'] },
  { key: 'bunna', patterns: ['bunna'] },
  { key: 'berhan', patterns: ['berhan'] },
  { key: 'abay', patterns: ['abay'] },
  { key: 'enat', patterns: ['enat'] },
  { key: 'lion', patterns: ['lion', 'anbessa'] },
  { key: 'amhara', patterns: ['amhara'] },
  { key: 'hijra', patterns: ['hijra'] },
  { key: 'zamzam', patterns: ['zamzam'] },
  { key: 'tsedey', patterns: ['tsedey'] },
  { key: 'mpesa', patterns: ['m-pesa', 'mpesa', 'safaricom'] },
  { key: 'airtel', patterns: ['airtel'] },
  { key: 'equity', patterns: ['equity'] },
  { key: 'waafi', patterns: ['waafi'] },
  { key: 'cac', patterns: ['cac bank', 'cac'] },
  { key: 'evc', patterns: ['evc'] },
  { key: 'zaad', patterns: ['zaad'] },
  { key: 'premier', patterns: ['premier'] },
  { key: 'mgurush', patterns: ['m-gurush', 'mgurush'] },
  { key: 'nilepay', patterns: ['nilepay'] },
  { key: 'bok', patterns: ['bank of khartoum', 'bok'] },
  { key: 'sygpay', patterns: ['sygpay'] },
  { key: 'emoney', patterns: ['e& money', 'emoney'] },
  { key: 'stcpay', patterns: ['stc pay', 'stcpay'] },
  { key: 'careem', patterns: ['careem'] },
  { key: 'urpay', patterns: ['urpay'] },
  { key: 'alrajhi', patterns: ['al rajhi', 'rajhi'] },
  { key: 'zelle', patterns: ['zelle'] },
  { key: 'venmo', patterns: ['venmo'] },
  { key: 'cashapp', patterns: ['cash app', 'cashapp'] },
  { key: 'revolut', patterns: ['revolut'] },
  { key: 'fasterpayments', patterns: ['faster payments'] },
  { key: 'monzo', patterns: ['monzo'] },
  { key: 'unitel', patterns: ['unitel'] },
  { key: 'multicaixa', patterns: ['multicaixa'] },
  { key: 'alipay', patterns: ['alipay'] },
  { key: 'wechat', patterns: ['wechat'] },
  { key: 'mastercard', patterns: ['mastercard'] },
  { key: 'visa', patterns: ['visa'] },
  { key: 'paypal', patterns: ['paypal'] },
  { key: 'binance', patterns: ['binance', 'usdt'] },
];

export function resolveBankLogoInfo(bankName: string): {
  canonicalKey: string;
  remoteNames: string[];
} {
  const raw = String(bankName || '').trim().toLowerCase();
  if (!raw) {
    return { canonicalKey: '', remoteNames: [] };
  }

  const slug = raw
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const compactSlug = slug.replace(/-+/g, '');

  let canonicalKey = '';
  for (const matcher of BANK_MATCHERS) {
    if (matcher.patterns.some((p) => raw.includes(p))) {
      canonicalKey = matcher.key;
      break;
    }
  }

  const names = new Set<string>();
  if (canonicalKey) {
    names.add(`bank-${canonicalKey}`);
    names.add(canonicalKey);
  }
  if (slug) {
    names.add(`bank-${slug}`);
    names.add(slug);
  }
  if (compactSlug && compactSlug !== slug) {
    names.add(`bank-${compactSlug}`);
    names.add(compactSlug);
  }

  return {
    canonicalKey: canonicalKey || slug,
    remoteNames: Array.from(names),
  };
}

interface BankLogoBadgeProps {
  bankName: string;
  fallbackFlag?: string;
  fallbackIcon?: 'bank' | 'card';
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'light';
  className?: string;
}

export const BankLogoBadge: React.FC<BankLogoBadgeProps> = ({
  bankName,
  fallbackFlag,
  fallbackIcon = 'bank',
  size = 'sm',
  variant = 'default',
  className = '',
}) => {
  const { getImageEntry } = useRemoteImages();
  const { bankLogos } = useApp();

  const { canonicalKey, remoteNames } = resolveBankLogoInfo(bankName);

  let remoteUrl = '';
  for (const candidate of remoteNames) {
    const entry = getImageEntry(candidate);
    if (entry?.url) {
      remoteUrl = entry.url;
      break;
    }
  }

  const adminLogoUrl = canonicalKey && bankLogos?.[canonicalKey] ? bankLogos[canonicalKey] : '';
  const primarySrc = remoteUrl || adminLogoUrl;

  const [failedUrls, setFailedUrls] = useState<string[]>([]);

  useEffect(() => {
    setFailedUrls([]);
  }, [bankName, remoteUrl, adminLogoUrl]);

  const effectiveSrc =
    remoteUrl && !failedUrls.includes(remoteUrl)
      ? remoteUrl
      : adminLogoUrl && !failedUrls.includes(adminLogoUrl)
        ? adminLogoUrl
        : '';

  const sizeClass =
    size === 'xs'
      ? 'w-5 h-5 rounded-md p-0.5'
      : size === 'md'
        ? 'w-9 h-9 rounded-xl p-1'
        : 'w-6 h-6 rounded-lg p-0.5';

  const containerClass =
    variant === 'light'
      ? 'bg-white border border-white/25 shadow-xs'
      : 'bg-white border border-slate-200/80 shadow-2xs';

  if (effectiveSrc) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${sizeClass} ${containerClass} ${className}`}
      >
        <img
          src={effectiveSrc}
          alt={bankName}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          onError={() => {
            setFailedUrls((prev) => (prev.includes(effectiveSrc) ? prev : [...prev, effectiveSrc]));
          }}
        />
      </span>
    );
  }

  if (fallbackFlag) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 text-sm leading-none ${
          size === 'md' ? 'w-9 h-9 rounded-xl bg-white/10 text-base' : 'w-6 h-6'
        } ${className}`}
      >
        {fallbackFlag}
      </span>
    );
  }

  const iconSize = size === 'xs' ? 11 : size === 'md' ? 16 : 13;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${sizeClass} ${
        variant === 'light'
          ? 'bg-white/10 text-amber-300 border border-white/15'
          : 'bg-slate-100 text-slate-500 border border-slate-200/70'
      } ${className}`}
    >
      {fallbackIcon === 'card' || primarySrc === '' && /visa|mastercard|paypal|binance/i.test(bankName) ? (
        <CreditCard size={iconSize} />
      ) : (
        <Landmark size={iconSize} />
      )}
    </span>
  );
};
