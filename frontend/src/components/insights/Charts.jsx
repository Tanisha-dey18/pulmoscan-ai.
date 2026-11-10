import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const TRAIN = '#2563eb'
const VAL = '#0d9488'
const AXIS = { fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono Variable, monospace' }
const GRID = '#e8edf4'

function ChartTooltip({ active, payload, label, labelPrefix = '', format }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-xs text-white shadow-lift">
      <p className="mb-1 font-mono text-slate-400">
        {labelPrefix}
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: entry.color || entry.fill }} />
          <span className="text-slate-300">{entry.name}</span>
          <span className="ml-auto pl-4 font-mono">{format(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

/** Training vs validation curve for one metric ("accuracy" or "loss"). */
export function HistoryChart({ history, metric, bestEpoch }) {
  const data = history[metric].map((value, i) => ({
    epoch: i + 1,
    train: value,
    val: history[`val_${metric}`][i],
  }))
  const isAccuracy = metric === 'accuracy'
  const format = (v) => (isAccuracy ? `${(v * 100).toFixed(1)}%` : v.toFixed(3))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="epoch" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={52}
          domain={isAccuracy ? [(min) => Math.max(0, Math.floor(min * 10) / 10), 1] : [0, (max) => Math.ceil(max * 2) / 2]}
          tickCount={6}
          tickFormatter={(v) => (isAccuracy ? `${+(v * 100).toFixed(1)}%` : +v.toFixed(2))}
        />
        <Tooltip content={<ChartTooltip labelPrefix="Epoch " format={format} />} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <ReferenceLine
          x={bestEpoch}
          stroke="#94a3b8"
          strokeDasharray="4 4"
          label={{ value: 'best', position: 'insideTopRight', fontSize: 10, fill: '#64748b' }}
        />
        <Line name="Training" type="linear" dataKey="train" stroke={TRAIN} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line name="Validation" type="linear" dataKey="val" stroke={VAL} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

/** ROC curve: true-positive rate vs false-positive rate over all thresholds. */
export function RocChart({ roc }) {
  const data = roc.fpr.map((fpr, i) => ({ fpr, tpr: roc.tpr[i] }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 14 }}>
        <defs>
          <linearGradient id="roc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={VAL} stopOpacity={0.25} />
            <stop offset="1" stopColor={VAL} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} />
        <XAxis
          dataKey="fpr"
          type="number"
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tick={AXIS}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          label={{ value: 'False positive rate', position: 'insideBottom', offset: -8, fontSize: 11, fill: '#64748b' }}
        />
        <YAxis type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="rounded-lg border border-white/10 bg-navy-900 px-3 py-2 font-mono text-xs text-white shadow-lift">
                <p>TPR {(payload[0].payload.tpr * 100).toFixed(1)}%</p>
                <p className="text-slate-400">FPR {(payload[0].payload.fpr * 100).toFixed(1)}%</p>
              </div>
            ) : null
          }
        />
        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#94a3b8" strokeDasharray="4 4" />
        <Area type="linear" dataKey="tpr" stroke={VAL} strokeWidth={2} fill="url(#roc-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Precision / recall / F1 for each class, side by side. */
export function ClassMetricsChart({ perClass }) {
  const data = ['precision', 'recall', 'f1'].map((key) => ({
    metric: key === 'f1' ? 'F1-score' : key[0].toUpperCase() + key.slice(1),
    Normal: perClass.NORMAL[key],
    Pneumonia: perClass.PNEUMONIA[key],
  }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} barCategoryGap="28%" barGap={4}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="metric" tick={{ ...AXIS, fontFamily: 'inherit', fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis domain={[0, 1]} tick={AXIS} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip format={(v) => `${(v * 100).toFixed(1)}%`} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="Normal" fill={VAL} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Pneumonia" fill="#e11d48" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
