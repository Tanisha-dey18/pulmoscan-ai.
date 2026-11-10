import { motion } from 'framer-motion'
import { Flame, ScanLine } from 'lucide-react'

/**
 * Decorative hero illustration: a stylised chest X-ray being scanned, with a
 * glowing "attention" region to hint at Grad-CAM. Purely illustrative - it
 * shows no prediction and no numbers.
 */
export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[440px]" aria-hidden>
      {/* soft glow behind the panel */}
      <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-cyan-400/25 via-transparent to-teal-400/20 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl backdrop-blur-md"
      >
        {/* window chrome */}
        <div className="flex items-center justify-between px-2 pt-1 pb-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <ScanLine className="size-3.5 text-cyan-300" />
            chest_xray.jpeg
          </div>
          <span className="eyebrow rounded-full border border-white/10 px-2 py-0.5 !text-[9px] text-slate-400">
            Illustration
          </span>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-b from-[#0b1220] to-[#05080f]">
          <svg viewBox="0 0 320 400" className="absolute inset-0 size-full">
            <defs>
              <radialGradient id="lung-fill" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="#1e293b" stopOpacity="0.9" />
                <stop offset="1" stopColor="#0b1220" stopOpacity="0.2" />
              </radialGradient>
              <radialGradient id="heat" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#f97316" stopOpacity="0.95" />
                <stop offset="0.35" stopColor="#facc15" stopOpacity="0.65" />
                <stop offset="0.7" stopColor="#22d3ee" stopOpacity="0.28" />
                <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* shoulders / torso outline */}
            <path
              d="M20 110 C60 70 110 62 160 60 C210 62 260 70 300 110 L300 400 L20 400 Z"
              fill="#0f172a"
              opacity="0.55"
            />
            {/* spine + trachea */}
            <path d="M160 40 V380" stroke="#cbd5e1" strokeOpacity="0.28" strokeWidth="14" strokeLinecap="round" />
            <path d="M160 40 V130" stroke="#e2e8f0" strokeOpacity="0.3" strokeWidth="7" strokeLinecap="round" />

            {/* lungs */}
            <path
              d="M146 96 C112 100 74 140 62 210 C54 262 56 318 70 334 C92 350 132 330 144 300 C150 250 148 150 146 96 Z"
              fill="url(#lung-fill)"
              stroke="#94a3b8"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
            <path
              d="M174 96 C208 100 246 140 258 210 C266 262 264 318 250 334 C228 350 196 336 184 306 C174 280 172 150 174 96 Z"
              fill="url(#lung-fill)"
              stroke="#94a3b8"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
            {/* heart shadow */}
            <ellipse cx="182" cy="262" rx="38" ry="50" fill="#cbd5e1" opacity="0.12" />

            {/* ribs */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <g key={i} stroke="#e2e8f0" strokeOpacity={0.16} strokeWidth="5" fill="none" strokeLinecap="round">
                <path d={`M154 ${112 + i * 32} C118 ${104 + i * 32} 78 ${118 + i * 32} 56 ${150 + i * 32}`} />
                <path d={`M166 ${112 + i * 32} C202 ${104 + i * 32} 242 ${118 + i * 32} 264 ${150 + i * 32}`} />
              </g>
            ))}
            {/* clavicles */}
            <path d="M150 92 C110 78 70 80 36 96" stroke="#e2e8f0" strokeOpacity="0.3" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M170 92 C210 78 250 80 284 96" stroke="#e2e8f0" strokeOpacity="0.3" strokeWidth="6" fill="none" strokeLinecap="round" />

            {/* Grad-CAM style attention blob */}
            <motion.ellipse
              cx="104"
              cy="250"
              rx="58"
              ry="66"
              fill="url(#heat)"
              style={{ mixBlendMode: 'screen' }}
              animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.94, 1.04, 0.94] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>

          {/* scan line */}
          <div className="absolute inset-x-0 h-24 -translate-y-full animate-scan bg-gradient-to-b from-transparent via-cyan-300/10 to-cyan-300/30">
            <div className="absolute inset-x-0 bottom-0 h-px bg-cyan-200 shadow-[0_0_18px_2px_rgb(34_211_238/0.8)]" />
          </div>

          {/* corner brackets */}
          {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map(
            (pos) => (
              <span key={pos} className={`absolute size-5 border-cyan-300/60 ${pos}`} />
            ),
          )}
        </div>
      </motion.div>

      {/* floating glass chip */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
        transition={{ opacity: { delay: 0.9, duration: 0.5 }, x: { delay: 0.9, duration: 0.5 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="absolute -left-3 bottom-16 flex items-center gap-2.5 rounded-xl border border-white/15 bg-navy-900/80 px-3.5 py-2.5 shadow-xl backdrop-blur-md sm:-left-10"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-orange-400/15 text-orange-300">
          <Flame className="size-4" />
        </span>
        <span>
          <span className="block text-xs font-semibold text-white">Grad-CAM</span>
          <span className="block text-[11px] text-slate-400">Shows where the model looked</span>
        </span>
      </motion.div>
    </div>
  )
}
