import React, { useState } from 'react';
import { Home } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackLabel = 'THIKANO Accommodation',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3F5EF] via-[#E8EDE2] to-[#DCE5D5] text-[#174C3A] p-4 text-center ${className}`}
      >
        <Home className="w-8 h-8 mb-2 opacity-75" aria-hidden="true" />
        <span className="text-xs font-medium text-[#202820]/70 line-clamp-2 max-w-[180px]">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );
}
