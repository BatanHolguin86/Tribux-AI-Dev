/**
 * Tribux AI logo — "T" inside a circle with orbital dots.
 * Supports dark/light mode via className overrides.
 */

type TribuxLogoProps = {
  size?: number
  className?: string
}

export function TribuxLogo({ size = 32, className = '' }: TribuxLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tribux AI"
    >
      {/* Orbital ring */}
      <circle
        cx="32"
        cy="32"
        r="26"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 4"
        className="text-brand-teal/40"
      />

      {/* Orbital dots */}
      <circle cx="32" cy="5" r="2.5" className="fill-[#0EA5A3]" />
      <circle cx="51" cy="11" r="2" className="fill-[#0EA5A3]/80" />
      <circle cx="57" cy="28" r="2.5" className="fill-[#0EA5A3]" />
      <circle cx="53" cy="48" r="2" className="fill-[#0EA5A3]/70" />
      <circle cx="38" cy="58" r="2.5" className="fill-[#0EA5A3]" />
      <circle cx="18" cy="55" r="2" className="fill-[#0EA5A3]/60" />
      <circle cx="8" cy="40" r="2.5" className="fill-[#0EA5A3]/80" />
      <circle cx="10" cy="18" r="2" className="fill-[#0EA5A3]/70" />

      {/* Center circle */}
      <circle cx="32" cy="32" r="14" className="fill-[#0F2B46] dark:fill-[#0F2B46]" />

      {/* Letter T */}
      <text
        x="32"
        y="38"
        textAnchor="middle"
        className="fill-[#0EA5A3]"
        style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display, DM Sans, sans-serif)' }}
      >
        T
      </text>
    </svg>
  )
}

/**
 * Compact icon version (no orbital dots) for tight spaces like tabs.
 */
export function TribuxIcon({ size = 20, className = '' }: TribuxLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tribux AI"
    >
      <circle cx="16" cy="16" r="14" className="fill-[#0F2B46]" />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        className="fill-[#0EA5A3]"
        style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display, DM Sans, sans-serif)' }}
      >
        T
      </text>
    </svg>
  )
}
