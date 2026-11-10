import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatInt } from '../../utils/format'

const shape = (s) => (s ? s.join(' × ') : '-')

/** Collapse the raw Keras layer list into readable stages (one per conv block). */
function toStages(layers) {
  const stages = []
  for (const layer of layers) {
    const block = layer.name.match(/^block(\d+)_/)
    if (block) {
      const key = `block${block[1]}`
      let stage = stages.find((s) => s.key === key)
      if (!stage) {
        stage = { key, kind: 'conv', title: `Conv block ${block[1]}`, layers: [], params: 0 }
        stages.push(stage)
      }
      stage.layers.push(layer)
      stage.params += layer.params
      stage.output = layer.output_shape
      if (layer.type === 'Conv2D') {
        stage.filters = layer.output_shape.at(-1)
        stage.convs = (stage.convs || 0) + 1
      }
    } else {
      stages.push({ key: layer.name, kind: 'single', title: SINGLE_TITLES[layer.type] || layer.type, layers: [layer], params: layer.params, output: layer.output_shape, type: layer.type })
    }
  }
  return stages
}

const SINGLE_TITLES = {
  InputLayer: 'Input',
  Rescaling: 'Normalisation',
  GlobalAveragePooling2D: 'Global average pooling',
  Dropout: 'Dropout',
  Dense: 'Dense',
}

const DESCRIPTIONS = {
  InputLayer: 'Grayscale chest X-ray',
  Rescaling: 'Pixel values scaled from 0-255 to 0-1',
  GlobalAveragePooling2D: 'Each feature map averaged to a single number',
  Dropout: 'Randomly drops units during training to reduce overfitting',
}

export default function Architecture({ model }) {
  const stages = useMemo(() => toStages(model.layers), [model.layers])
  const [showAll, setShowAll] = useState(false)

  return (
    <div>
      <ol className="relative space-y-2 before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-line">
        {stages.map((stage, i) => {
          const isOutput = i === stages.length - 1
          const description =
            stage.kind === 'conv'
              ? `${stage.convs > 1 ? `${stage.convs} × (` : ''}Conv 3×3, ${stage.filters} filters → BatchNorm → ReLU${stage.convs > 1 ? ')' : ''} → MaxPool 2×2`
              : stage.type === 'Dense'
                ? isOutput
                  ? 'Sigmoid output: probability of pneumonia'
                  : `${stage.output?.at(-1)} units, ReLU`
                : DESCRIPTIONS[stage.type] || ''
          return (
            <li key={stage.key} className="relative flex items-start gap-4">
              <span
                className={`relative z-10 mt-2 grid size-[31px] shrink-0 place-items-center rounded-full font-mono text-[11px] font-medium ring-4 ring-white ${
                  stage.kind === 'conv' ? 'bg-navy-900 text-cyan-300' : isOutput ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {i + 1}
              </span>
              <div className={`flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg px-4 py-2.5 ring-1 ring-line ${stage.kind === 'conv' ? 'bg-surface' : 'bg-white'}`}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{isOutput ? 'Output' : stage.title}</p>
                  <p className="text-xs text-muted">{description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4 font-mono text-xs">
                  <span className="text-slate-700">{shape(stage.output)}</span>
                  <span className="w-24 text-right text-muted">{stage.params ? `${formatInt(stage.params)} params` : 'no params'}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <button
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        className="mt-5 flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline"
      >
        <ChevronDown className={`size-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        {showAll ? 'Hide' : 'Show'} all {model.layers.length} Keras layers
      </button>

      {showAll && (
        <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-line">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Layer</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Output shape</th>
                <th className="px-3 py-2 text-right font-medium">Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono">
              {model.layers.map((layer) => (
                <tr key={layer.name} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5">{layer.name}</td>
                  <td className="px-3 py-1.5 text-muted">{layer.type}</td>
                  <td className="px-3 py-1.5">{shape(layer.output_shape)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatInt(layer.params)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
