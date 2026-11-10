import { formatInt, formatPercent } from '../../utils/format'

const CELLS = [
  { row: 0, col: 0, tag: 'TN', name: 'True negative', hint: 'Normal correctly identified' },
  { row: 0, col: 1, tag: 'FP', name: 'False positive', hint: 'Normal flagged as pneumonia' },
  { row: 1, col: 0, tag: 'FN', name: 'False negative', hint: 'Pneumonia missed' },
  { row: 1, col: 1, tag: 'TP', name: 'True positive', hint: 'Pneumonia correctly identified' },
]

/**
 * 2 x 2 confusion matrix. Rows = actual class, columns = predicted class.
 * Colour intensity = share of that actual class (row-normalised).
 */
export default function ConfusionMatrix({ matrix }) {
  const rowTotals = matrix.map((row) => row[0] + row[1])

  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
      <div />
      <p className="pb-1 text-center text-xs font-medium text-muted">Predicted Normal</p>
      <p className="pb-1 text-center text-xs font-medium text-muted">Predicted Pneumonia</p>

      {[0, 1].map((row) => (
        <Row key={row} label={row === 0 ? 'Actual Normal' : 'Actual Pneumonia'}>
          {CELLS.filter((c) => c.row === row).map((cell) => {
            const count = matrix[cell.row][cell.col]
            const share = rowTotals[row] ? count / rowTotals[row] : 0
            const correct = cell.row === cell.col
            const strong = share > 0.55
            return (
              <div
                key={cell.tag}
                title={`${cell.name}: ${cell.hint}`}
                className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg ring-1 ring-black/5 transition-transform duration-200 hover:scale-[1.02]"
                style={{
                  background: correct
                    ? `rgb(13 148 136 / ${0.08 + share * 0.82})`
                    : `rgb(225 29 72 / ${0.06 + share * 0.8})`,
                  color: strong ? '#fff' : '#0b1730',
                }}
              >
                <span className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl">{formatInt(count)}</span>
                <span className="mt-0.5 text-xs opacity-90">
                  {cell.tag} · {formatPercent(share)}
                </span>
              </div>
            )
          })}
        </Row>
      ))}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <>
      <p className="flex items-center pr-1 text-xs font-medium text-muted [writing-mode:vertical-rl] rotate-180 justify-center">
        {label}
      </p>
      {children}
    </>
  )
}
