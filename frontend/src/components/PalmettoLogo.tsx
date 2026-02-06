export interface PalmettoLogoProps {
  className?: string
}

export default function PalmettoLogo({ className = 'h-8 w-8' }: PalmettoLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Palmetto AI logo"
      role="img"
    >
      {/* Crescent moon */}
      <path d="M14 18a14 14 0 1 1 0 20 11 11 0 1 0 0-20z" />
      {/* Trunk */}
      <rect x="29" y="30" width="6" height="24" rx="2" />
      {/* Center frond */}
      <path d="M32 8c0 0-1 12-1 22h2C33 20 32 8 32 8z" />
      {/* Left fronds */}
      <path d="M32 18c-8-6-20-6-20-6s8 6 14 14c2 2 4 2 5 0z" />
      <path d="M32 22c-6-2-18 2-18 2s10 1 15 7c1 2 3 1 3-1z" />
      {/* Right fronds */}
      <path d="M32 18c8-6 20-6 20-6s-8 6-14 14c-2 2-4 2-5 0z" />
      <path d="M32 22c6-2 18 2 18 2s-10 1-15 7c-1 2-3 1-3-1z" />
    </svg>
  )
}
