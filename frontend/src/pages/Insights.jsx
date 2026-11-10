import { CircleAlert, Database, Layers, RefreshCw, Settings2, Target } from 'lucide-react'
import Architecture from '../components/insights/Architecture'
import { ClassMetricsChart, HistoryChart, RocChart } from '../components/insights/Charts'
import ConfusionMatrix from '../components/insights/ConfusionMatrix'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import { useInsights } from '../hooks/useInsights'
import { formatInt, formatPercent } from '../utils/format'

function Card({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <Reveal className={`card p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />}
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Reveal>
  )
}

function Kpi({ label, value, note }) {
  return (
    <div className="bg-white p-5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl font-medium tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  )
}

function SplitBar({ name, counts }) {
  const total = counts.NORMAL + counts.PNEUMONIA
  const normalShare = counts.NORMAL / total
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium capitalize">{name}</span>
        <span className="font-mono text-xs text-muted">{formatInt(total)} images</span>
      </div>
      <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-teal-500" style={{ width: `${normalShare * 100}%` }} />
        <div className="bg-rose-500" style={{ width: `${(1 - normalShare) * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
        <span>{formatInt(counts.NORMAL)} normal</span>
        <span>{formatInt(counts.PNEUMONIA)} pneumonia</span>
      </div>
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading model insights">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 bg-white p-5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-28" />
            <div className="skeleton h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-4 p-6">
            <div className="skeleton h-4 w-44" />
            <div className="skeleton h-64 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Insights() {
  const { data, loading, error, retry } = useInsights()

  return (
    <>
      <PageHeader
        eyebrow="Model Insights"
        title="How the model was built and how well it performs"
        description="Every figure on this page is read from the evaluation report generated after training. Nothing is hard-coded."
      />

      <section className="container-page py-8 sm:py-10">
        {loading && <InsightsSkeleton />}

        {error && !loading && (
          <div className="card mx-auto flex max-w-lg flex-col items-center p-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600">
              <CircleAlert className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Could not load model insights</h2>
            <p className="mt-2 text-sm text-muted">{error.message}</p>
            <button onClick={retry} className="btn btn-dark mt-6">
              <RefreshCw className="size-4" /> Try again
            </button>
          </div>
        )}

        {data && !loading && <InsightsContent m={data} />}
      </section>
    </>
  )
}

function InsightsContent({ m }) {
  const { model, dataset, training, history, test, validation } = m
  const [[tn, fp], [fn, tp]] = test.confusion_matrix

  return (
    <div className="space-y-6">
      {/* headline numbers */}
      <Reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-card lg:grid-cols-4">
        <Kpi label="Test accuracy" value={formatPercent(test.accuracy)} note={`${formatInt(test.samples)} unseen X-rays`} />
        <Kpi label="ROC-AUC (test)" value={test.roc_auc.toFixed(3)} note="Threshold-independent" />
        <Kpi label="Validation accuracy" value={formatPercent(training.val_accuracy)} note={`Best epoch (${training.best_epoch} of ${training.epochs_run})`} />
        <Kpi label="Training accuracy" value={formatPercent(training.train_accuracy)} note="Same epoch, with augmentation" />
      </Reveal>

      {/* training curves */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Accuracy per epoch" subtitle="Training vs validation">
          <HistoryChart history={history} metric="accuracy" bestEpoch={training.best_epoch} />
        </Card>
        <Card title="Loss per epoch" subtitle="Binary cross-entropy - lower is better">
          <HistoryChart history={history} metric="loss" bestEpoch={training.best_epoch} />
        </Card>
      </div>

      {/* confusion matrix + class metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Confusion matrix" subtitle="Test set · rows are the true label" icon={Target}>
          <ConfusionMatrix matrix={test.confusion_matrix} />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Of {formatInt(fn + tp)} pneumonia X-rays, the model caught <strong className="text-ink">{formatInt(tp)}</strong> and
            missed <strong className="text-ink">{formatInt(fn)}</strong>. Of {formatInt(tn + fp)} normal X-rays,{' '}
            <strong className="text-ink">{formatInt(fp)}</strong> were wrongly flagged as pneumonia.
          </p>
        </Card>

        <Card title="Precision, recall and F1-score" subtitle={`Test set · decision threshold ${test.threshold}`}>
          <ClassMetricsChart perClass={test.per_class} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 font-medium">Class</th>
                  <th className="py-2 text-right font-medium">Precision</th>
                  <th className="py-2 text-right font-medium">Recall</th>
                  <th className="py-2 text-right font-medium">F1</th>
                  <th className="py-2 text-right font-medium">Support</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px] tabular-nums">
                {[
                  ['Normal', test.per_class.NORMAL],
                  ['Pneumonia', test.per_class.PNEUMONIA],
                  ['Macro average', test.macro_avg],
                  ['Weighted average', test.weighted_avg],
                ].map(([name, row], i) => (
                  <tr key={name} className={`border-b border-line last:border-0 ${i >= 2 ? 'text-muted' : ''}`}>
                    <td className="py-2 font-sans">{name}</td>
                    <td className="py-2 text-right">{formatPercent(row.precision)}</td>
                    <td className="py-2 text-right">{formatPercent(row.recall)}</td>
                    <td className="py-2 text-right">{formatPercent(row.f1)}</td>
                    <td className="py-2 text-right">{formatInt(row.support)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ROC + dataset */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="ROC curve" subtitle={`Test set · area under the curve = ${test.roc_auc.toFixed(3)}`}>
          <RocChart roc={test.roc_curve} />
        </Card>

        <Card title="Dataset" subtitle={dataset.name} icon={Database}>
          <p className="text-sm leading-relaxed text-muted">{dataset.description}</p>
          <div className="mt-5 space-y-4">
            {['train', 'val', 'test'].map((split) => (
              <SplitBar key={split} name={{ train: 'Training', val: 'Validation', test: 'Test' }[split]} counts={dataset.splits[split]} />
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted">{dataset.split_strategy}</p>
          <a href={dataset.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-teal-700 hover:underline">
            Source: Mendeley Data (CC BY 4.0) ↗
          </a>
        </Card>
      </div>

      {/* architecture + training setup */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card
          title="Model architecture"
          subtitle={`${model.name} · ${formatInt(model.total_params)} parameters · ${model.file_size_mb} MB`}
          icon={Layers}
        >
          <Architecture model={model} />
        </Card>

        <Card title="Training setup" icon={Settings2}>
          <dl className="divide-y divide-line text-sm">
            {[
              ['Optimizer', `${training.optimizer} (lr ${training.initial_learning_rate})`],
              ['Loss', training.loss],
              ['Batch size', training.batch_size],
              ['Epochs run', `${training.epochs_run} of max ${training.max_epochs}`],
              ['Early stopping', `patience ${training.early_stopping_patience}, best epoch ${training.best_epoch}`],
              ['Class weights', Object.entries(training.class_weight).map(([k, v]) => `${k[0] + k.slice(1).toLowerCase()} ${v.toFixed(2)}`).join(' · ')],
              ['Training time', `${(training.duration_seconds / 60).toFixed(1)} min on ${training.hardware}`],
              ['Framework', `TensorFlow ${training.tensorflow_version}`],
              ['Validation (clean)', `${formatPercent(validation.accuracy)} accuracy · AUC ${validation.roc_auc.toFixed(3)}`],
            ].map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-muted">{key}</dt>
                <dd className="text-right font-mono text-[13px]">{value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-sm font-semibold">Data augmentation</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {training.augmentation.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-teal-600" />
                {line}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="text-center text-xs text-muted">
        Evaluation report generated {new Date(m.generated_at).toLocaleString()} by <span className="font-mono">ml/evaluate.py</span>
      </p>
    </div>
  )
}
