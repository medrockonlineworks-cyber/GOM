/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useRemoteImage } from '../context/RemoteImagesContext';

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
