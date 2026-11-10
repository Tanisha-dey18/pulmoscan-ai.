/** PulmoScan brand mark: a pair of lungs crossed by a scan line. */
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#0a1428" stroke="rgba(255,255,255,0.12)" />
      <path
        d="M14 8v6.500c0 1.200-.5 2.200-1.600 3L9.500 19.600C8.600 20.300 8 21.400 8 22.600V23a2 2 0 0 0 2 2h1.500a2.500 2.500 0 0 0 2.500-2.500V8Zm4 0v14.500a2.500 2.500 0 0 0 2.500 2.500H22a2 2 0 0 0 2-2v-.4c0-1.200-.6-2.300-1.500-3l-2.900-2.100c-1.100-.8-1.600-1.800-1.600-3V8Z"
        fill="none"
        stroke="url(#logo-gradient)"
        strokeWidth="1.800"
        strokeLinejoin="round"
      />
      <path d="M5 15h22" stroke="#22d3ee" strokeWidth="1.400" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-white">
        PulmoScan <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">AI</span>
      </span>
    </span>
  )
}
