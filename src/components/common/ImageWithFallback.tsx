import React, { useState } from "react";
import { GraduationCap } from "lucide-react";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackTitle,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#101C35] via-[#172a52] to-[#2563EB]/70 text-white p-4 text-center ${className}`}
      >
        <GraduationCap className="h-7 w-7 text-[#60A5FA] mb-2" />
        <span className="text-xs font-medium text-blue-100 line-clamp-2">
          {fallbackTitle || alt}
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
    />
  );
}
