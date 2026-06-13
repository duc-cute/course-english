type MascotAvatarProps = {
  className?: string;
};

export function MascotAvatar({ className = "" }: MascotAvatarProps) {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-hidden className={className}>
      <ellipse cx="80" cy="148" rx="46" ry="8" fill="rgba(45,75,215,0.12)" />
      <rect x="36" y="44" width="88" height="88" rx="28" fill="#dee0ff" stroke="#2d4bd7" strokeWidth="4" />
      <circle cx="58" cy="78" r="10" fill="#1a1b23" />
      <circle cx="102" cy="78" r="10" fill="#1a1b23" />
      <circle cx="61" cy="75" r="3" fill="#fff" />
      <circle cx="105" cy="75" r="3" fill="#fff" />
      <path d="M58 102 Q80 118 102 102" fill="none" stroke="#2d4bd7" strokeWidth="4" strokeLinecap="round" />
      <rect x="68" y="24" width="24" height="16" rx="8" fill="#87fe45" stroke="#368400" strokeWidth="3" />
      <circle cx="80" cy="20" r="6" fill="#9547f7" />
    </svg>
  );
}
