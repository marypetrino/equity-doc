export function LuminaiLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Luminai"
      role="img"
    >
      <rect x="2" y="8" width="18" height="18" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="6" y="5" width="18" height="18" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="10" y="2" width="18" height="18" rx="2" fill="currentColor" opacity="1" />
    </svg>
  );
}
