/** Luminai stacked-layers mark. `variant="badge"` wraps it in the brand blue circle. */
export function LuminaiLogo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "badge";
}) {
  const layers = (color: string) => (
    <g>
      {/* bottom layer */}
      <path d="M8 22 L20 17 L32 22 L20 27 Z" fill={color} opacity="0.4" />
      {/* middle layer */}
      <path d="M8 16.5 L20 11.5 L32 16.5 L20 21.5 Z" fill={color} opacity="0.7" />
      {/* top layer */}
      <path d="M8 11 L20 6 L32 11 L20 16 Z" fill={color} />
    </g>
  );

  if (variant === "badge") {
    return (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Luminai" role="img">
        <circle cx="20" cy="20" r="20" fill="#3b52f6" />
        <g transform="translate(0 3)">{layers("white")}</g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 33" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Luminai" role="img">
      {layers("currentColor")}
    </svg>
  );
}
