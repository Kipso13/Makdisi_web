import React from "react";

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ name, avatarUrl, size = "md" }: AvatarProps) {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-base"
        : "h-10 w-10 text-sm";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${sizeClass} rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} rounded-full bg-[#101C35] text-white dark:bg-[#2563EB] flex items-center justify-center font-semibold tracking-tight shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}
