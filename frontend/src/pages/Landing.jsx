import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  ChartLine,
  Cpu,
  Eye,
  Gauge,
  Layers,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroVisual from '../components/HeroVisual'
import Reveal from '../components/Reveal'
import { useInsights } from '../hooks/useInsights'
import { formatInt, formatPercent } from '../utils/format'

const STEPS = [
  {
    icon: Upload,
    title: 'Upload an X-ray',
    text: 'Drag and drop a frontal chest X-ray (JPEG or PNG). The file is validated before it is analysed.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Preprocessing',
    text: 'The image is converted to grayscale, resized to 160 × 160 and normalised - exactly like the training data.',
  },
  {
    icon: Brain,
    title: 'CNN inference',
    text: 'Four convolutional blocks extract features and a sigmoid output estimates the probability of pneumonia.',
  },
  {
    icon: Eye,
    title: 'Visual explanation',
    text: 'Grad-CAM highlights the regions of the image that pushed the model towards its prediction.',
  },
]

const FEATURES = [
  {
    icon: ScanSearch,
    title: 'Real model, real predictions',
    text: 'Every result comes from a CNN trained on thousands of labelled X-rays and served by a FastAPI backend - nothing is mocked.',
  },
  {
    icon: Eye,
    title: 'Explainable by design',
    text: 'A Grad-CAM heatmap accompanies each prediction so you can see what the network focused on.',
  },
  {
    icon: Gauge,
    title: 'Honest confidence',
    text: 'Confidence scores and a full probability breakdown for both classes, with low-confidence results flagged.',
  },
  {
    icon: ChartLine,
    title: 'Measured, not claimed',
    text: 'Accuracy, precision, recall, F1 and the confusion matrix are computed on a held-out test set and shown as-is.',
  },
  {
    icon: ShieldCheck,
    title: 'Leak-free evaluation',
    text: 'Validation data is split by patient, so the same person never appears in both training and validation.',
  },
  {
    icon: Zap,
    title: 'Fast on plain CPUs',
    text: 'A compact architecture keeps inference quick on free-tier hosting - no GPU needed.',
  },
]

const STACK = [
  { group: 'Machine learning', icon: Brain, items: ['TensorFlow / Keras', 'Custom CNN', 'Grad-CAM', 'scikit-learn', 'Matplotlib + Seaborn'] },
  { group: 'Backend', icon: Cpu, items: ['Python', 'FastAPI', 'Pillow', 'NumPy', 'Uvicorn'] },
  { group: 'Frontend', icon: Layers, items: ['React + Vite', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'Lucide icons'] },
]

function HeroStats() {
  const { data, loading, error } = useInsights()
  if (error) return null // never show placeholder numbers

  const stats = data
    ? [
        { label: 'Test accuracy', value: formatPercent(data.test.accuracy) },
        { label: 'ROC-AUC', value: data.test.roc_auc.toFixed(3) },
        { label: 'Pneumonia recall', value: formatPercent(data.test.per_class.PNEUMONIA.recall) },
        { label: 'Test X-rays', value: formatInt(data.test.samples) },
      ]
    : Array.from({ length: 4 }, () => null)

  return (
    <div className="mt-14 border-t border-white/10 pt-8">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i}>
            {loading || !stat ? (
              <>
                <div className="skeleton-dark h-8 w-20" />
                <div className="skeleton-dark mt-2 h-3 w-24" />
              </>
            ) : (
              <>
                <dd className="font-mono text-2xl font-medium tracking-tight text-white sm:text-3xl">{stat.value}</dd>
                <dt className="mt-1 text-xs text-slate-400">{stat.label}</dt>
              </>
            )}
          </div>
        ))}
      </dl>
      {data && (
        <p className="mt-5 text-xs text-slate-500">
          Measured on the held-out test set. <Link to="/insights" className="text-cyan-300 underline-offset-4 hover:underline">See the full evaluation</Link>
        </p>
      )}
    </div>
  )
}

export default function Landing() {
  return (
    <>
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden bg-navy-950 pt-16 text-white">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="absolute -top-48 -left-40 size-[560px] animate-drift rounded-full bg-cyan-500/20 blur-[130px]" aria-hidden />
        <div className="absolute top-1/3 -right-48 size-[520px] animate-drift-slow rounded-full bg-teal-400/15 blur-[130px]" aria-hidden />
        <div className="absolute -bottom-64 left-1/3 size-[480px] animate-drift rounded-full bg-blue-600/20 blur-[140px]" aria-hidden />

        <div className="container-page relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-1.5 text-xs text-slate-300 backdrop-blur"
            >
              <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 font-medium text-cyan-200">Prototype</span>
              Deep learning for chest X-rays
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]"
            >
              Pneumonia detection you can{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                see the reasoning
              </span>{' '}
              behind.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
            >
              PulmoScan AI analyses chest X-ray images with a convolutional neural network, returns a confidence score
              for <em className="text-white not-italic">Normal</em> vs{' '}
              <em className="text-white not-italic">Pneumonia</em>, and shows a Grad-CAM heatmap of the regions that
              influenced the result.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/analyze" className="btn btn-accent group !px-5 !py-3">
                Start Analysis
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/insights" className="btn btn-ghost-dark !px-5 !py-3">
                View model insights
              </Link>
            </motion.div>

            <p className="mt-5 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="size-3.5 text-teal-300" aria-hidden />
              Educational prototype - not for clinical use.
            </p>

            <HeroStats />
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* -------------------------- Introduction -------------------------- */}
      <section className="border-b border-line bg-white">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow text-teal-700">The project</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
              An end-to-end deep learning system, from raw pixels to an explained prediction.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-4 text-base leading-relaxed text-muted">
            <p>
              Pneumonia is one of the leading infectious causes of death in young children worldwide, and chest
              radiography is a standard tool for assessing it. Reading X-rays takes training and time.
            </p>
            <p>
              PulmoScan AI explores how a CNN can learn the visual patterns associated with pneumonia directly from
              labelled images. It covers the full pipeline: data preparation, model training, honest evaluation, an
              inference API, and an interface that explains each prediction instead of presenting a black box.
            </p>
          </Reveal>
        </div>
      </section>

      {/* -------------------------- How it works -------------------------- */}
      <section className="bg-surface">
        <div className="container-page py-16 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-teal-700">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">From upload to explanation in four steps</h2>
          </Reveal>

          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 0.08} className="group relative bg-white p-6 transition-colors hover:bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-lg bg-navy-900 text-cyan-300 transition-transform duration-300 group-hover:-translate-y-0.5">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-xs text-slate-400">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------- Features ---------------------------- */}
      <section className="border-y border-line bg-white">
        <div className="container-page py-16 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-teal-700">Features</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built like a product, documented like research</h2>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 3) * 0.08} className="group">
                <span className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-teal-700 transition-colors duration-300 group-hover:border-teal-200 group-hover:bg-teal-50">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Technology --------------------------- */}
      <section className="bg-surface">
        <div className="container-page py-16 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-teal-700">Technology</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">A modern, fully open stack</h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STACK.map((col, i) => (
              <Reveal key={col.group} delay={i * 0.08} className="card p-6 transition-shadow duration-300 hover:shadow-lift">
                <div className="flex items-center gap-3">
                  <col.icon className="size-5 text-teal-700" aria-hidden />
                  <h3 className="text-base font-semibold">{col.group}</h3>
                </div>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {col.items.map((item) => (
                    <li key={item} className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- CTA ------------------------------ */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[120px]" aria-hidden />
        <Reveal className="container-page relative flex flex-col items-center py-20 text-center">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Try it with a chest X-ray - or one of the built-in samples.
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Upload an image and get a prediction, confidence score and Grad-CAM explanation in a few seconds.
          </p>
          <Link to="/analyze" className="btn btn-accent group mt-8 !px-6 !py-3">
            Start Analysis
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>
    </>
  )
}
