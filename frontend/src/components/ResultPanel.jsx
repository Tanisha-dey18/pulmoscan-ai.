import { motion } from 'framer-motion'
import { CircleCheck, Info, RotateCcw, ShieldAlert, TriangleAlert } from 'lucide-react'
import { formatPercent } from '../utils/format'

const TONE = {
  PNEUMONIA: {
    title: 'Pneumonia',
    subtitle: 'The model found patterns it associates with pneumonia.',
    icon: TriangleAlert,
    text: 'text-rose-700',
    chip: 'bg-rose-50 text-rose-700 ring-rose-200',
    stroke: '#e11d48',
    bar: 'bg-rose-500',
  },
  NORMAL: {
    title: 'Normal',
    subtitle: 'The model did not find patterns it associates with pneumonia.',
    icon: CircleCheck,
    text: 'text-teal-700',
    chip: 'bg-teal-50 text-teal-700 ring-teal-200',
    stroke: '#0d9488',
    bar: 'bg-teal-500',
  },
}

/** Animated circular gauge showing the confidence of the predicted class. */
function ConfidenceRing({ value, color }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e8edf4" strokeWidth="9" />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold tracking-tight">{formatPercent(value)}</span>
        <span className="text-[10px] font-medium tracking-wider text-muted uppercase">confidence</span>
      </div>
    </div>
  )
}

function ProbabilityBar({ label, value, barClass, highlighted, delay }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className={highlighted ? 'font-semibold' : 'text-muted'}>{label}</span>
        <span className="font-mono tabular-nums">{formatPercent(value, 2)}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${label} probability ${formatPercent(value, 2)}`}>
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(value * 100, 0.8)}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
    </div>
  )
}

export default function ResultPanel({ result, onReset }) {
  const tone = TONE[result.prediction]
  const lowConfidence = result.confidence < 0.7

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="flex h-full flex-col"
    >
      {/* headline */}
      <motion.div variants={item} className="flex items-center gap-6">
        <ConfidenceRing value={result.confidence} color={tone.stroke} />
        <div className="min-w-0">
          <p className="eyebrow text-muted">Predicted classification</p>
          <p className={`mt-1.5 flex items-center gap-2 text-3xl font-semibold tracking-tight ${tone.text}`}>
            <tone.icon className="size-7 shrink-0" aria-hidden />
            {tone.title}
          </p>
          <p className="mt-1.5 text-sm text-muted">{tone.subtitle}</p>
        </div>
      </motion.div>

      {/* probability breakdown */}
      <motion.div variants={item} className="mt-7 border-t border-line pt-6">
        <h3 className="text-sm font-semibold">Probability breakdown</h3>
        <div className="mt-4 space-y-4">
          <ProbabilityBar
            label="Pneumonia"
            value={result.probabilities.PNEUMONIA}
            barClass={TONE.PNEUMONIA.bar}
            highlighted={result.prediction === 'PNEUMONIA'}
            delay={0.25}
          />
          <ProbabilityBar
            label="Normal"
            value={result.probabilities.NORMAL}
            barClass={TONE.NORMAL.bar}
            highlighted={result.prediction === 'NORMAL'}
            delay={0.35}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          Decision threshold: P(pneumonia) ≥ {result.threshold.toFixed(2)} is classified as Pneumonia.
        </p>
      </motion.div>

      {/* notices */}
      {(lowConfidence || result.warnings.length > 0) && (
        <motion.div variants={item} className="mt-5 space-y-2">
          {lowConfidence && (
            <Notice icon={Info} tone="amber">
              Low confidence - the model is uncertain about this image. Treat the result with extra caution.
            </Notice>
          )}
          {result.warnings.map((warning) => (
            <Notice key={warning} icon={TriangleAlert} tone="amber">
              {warning}
            </Notice>
          ))}
        </motion.div>
      )}

      {/* technical details */}
      <motion.dl variants={item} className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-5 text-sm">
        <Detail label="File" value={result.image.filename} />
        <Detail label="Original size" value={`${result.image.width} × ${result.image.height}px`} />
        <Detail label="Inference time" value={`${Math.round(result.inference_ms)} ms`} />
        <Detail label="Grad-CAM layer" value={result.gradcam.layer} />
      </motion.dl>

      <motion.div variants={item} className="mt-6 flex items-start gap-2.5 rounded-lg bg-slate-50 text-xs leading-relaxed text-muted ring-1 ring-line p-3.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
        <p>{result.disclaimer}</p>
      </motion.div>

      <motion.div variants={item} className="mt-6 lg:mt-auto lg:pt-6">
        <button onClick={onReset} className="btn btn-dark w-full sm:w-auto">
          <RotateCcw className="size-4" /> Analyze another image
        </button>
      </motion.div>
    </motion.div>
  )
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-[13px]" title={value}>
        {value}
      </dd>
    </div>
  )
}

function Notice({ icon: Icon, children }) {
  return (
    <p className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <Icon className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
      {children}
    </p>
  )
}
