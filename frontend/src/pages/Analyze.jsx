import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Eye, FileImage, LoaderCircle, ScanSearch, Sparkles, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'
import ResultPanel from '../components/ResultPanel'
import { useToast } from '../components/Toast'
import UploadZone from '../components/UploadZone'
import { ACCEPTED_TYPES, getHealth, MAX_UPLOAD_MB, predictXray } from '../services/api'
import { formatBytes } from '../utils/format'

// Real images from the dataset's held-out test set (never used for training).
const SAMPLES = [
  { src: '/samples/normal-1.jpg', label: 'Normal', name: 'sample-normal-1.jpg' },
  { src: '/samples/normal-2.jpg', label: 'Normal', name: 'sample-normal-2.jpg' },
  { src: '/samples/pneumonia-1.jpg', label: 'Pneumonia', name: 'sample-pneumonia-1.jpg' },
  { src: '/samples/pneumonia-2.jpg', label: 'Pneumonia', name: 'sample-pneumonia-2.jpg' },
]

const LOADING_STEPS = ['Uploading image', 'Preprocessing image', 'Running CNN inference', 'Computing Grad-CAM']

const VIEWS = [
  { id: 'overlay', label: 'Grad-CAM overlay' },
  { id: 'original', label: 'Original' },
  { id: 'heatmap', label: 'Heatmap' },
]

/** Client-side checks so obviously wrong files never leave the browser. */
function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a JPEG or PNG image.'
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `This file is ${formatBytes(file.size)}. The maximum size is ${MAX_UPLOAD_MB} MB.`
  }
  if (file.size === 0) return 'This file is empty.'
  return null
}

function ApiStatus() {
  const [status, setStatus] = useState('checking') // checking | online | offline

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then((h) => !cancelled && setStatus(h.model_loaded ? 'online' : 'offline'))
      .catch(() => !cancelled && setStatus('offline'))
    return () => {
      cancelled = true
    }
  }, [])

  const map = {
    checking: { dot: 'bg-amber-300 animate-pulse', text: 'Connecting to the model server…' },
    online: { dot: 'bg-teal-300', text: 'Model server online' },
    offline: { dot: 'bg-rose-400', text: 'Model server unreachable' },
  }[status]

  return (
    <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300" role="status">
      <span className={`size-2 rounded-full ${map.dot}`} />
      {map.text}
    </p>
  )
}

export default function Analyze() {
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle | ready | loading | done
  const [result, setResult] = useState(null)
  const [view, setView] = useState('overlay')
  const [step, setStep] = useState(0)
  const requestId = useRef(0)

  // Create/revoke the temporary preview URL for the chosen file.
  useEffect(() => {
    if (!file) return setPreviewUrl(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Cycle the status caption while waiting for the server.
  useEffect(() => {
    if (status !== 'loading') return
    setStep(0)
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 900)
    return () => clearInterval(timer)
  }, [status])

  const selectFile = useCallback(
    (candidate) => {
      const problem = validateFile(candidate)
      if (problem) {
        toast.error('Upload rejected', problem)
        return
      }
      requestId.current++ // ignore any response still in flight
      setFile(candidate)
      setResult(null)
      setView('overlay')
      setStatus('ready')
    },
    [toast],
  )

  const reset = () => {
    requestId.current++
    setFile(null)
    setResult(null)
    setStatus('idle')
  }

  const loadSample = async (sample) => {
    try {
      const response = await fetch(sample.src)
      if (!response.ok) throw new Error('missing')
      const blob = await response.blob()
      selectFile(new File([blob], sample.name, { type: 'image/jpeg' }))
    } catch {
      toast.error('Sample unavailable', 'Could not load the sample image.')
    }
  }

  const analyze = async () => {
    if (!file || status === 'loading') return
    const id = ++requestId.current
    setStatus('loading')
    try {
      const data = await predictXray(file)
      if (id !== requestId.current) return // user picked another file meanwhile
      setResult(data)
      setView('overlay')
      setStatus('done')
      toast.success('Analysis complete', `Classified as ${data.prediction === 'PNEUMONIA' ? 'Pneumonia' : 'Normal'}.`)
    } catch (err) {
      if (id !== requestId.current) return
      setStatus('ready')
      toast.error('Analysis failed', err.message)
    }
  }

  const shownImage =
    status === 'done' && result ? { overlay: result.gradcam.overlay, heatmap: result.gradcam.heatmap, original: previewUrl }[view] : previewUrl

  return (
    <>
      <PageHeader
        eyebrow="AI Analysis"
        title="Analyse a chest X-ray"
        description="Upload a frontal chest X-ray to get the model's classification, confidence and a Grad-CAM heatmap of the regions that influenced it."
      >
        <ApiStatus />
      </PageHeader>

      <section className="container-page -mt-px py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* ------------------------- left: image ------------------------- */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <FileImage className="size-4 text-teal-700" aria-hidden /> X-ray image
              </h2>
              {file && status !== 'loading' && (
                <button onClick={reset} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-rose-50 hover:text-rose-700">
                  <Trash2 className="size-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="mt-4">
              {!file ? (
                <UploadZone onFile={selectFile} />
              ) : (
                <>
                  {status === 'done' && (
                    <div className="mb-3 flex gap-1 rounded-lg bg-surface p-1 ring-1 ring-line" role="tablist" aria-label="Image view">
                      {VIEWS.map((v) => (
                        <button
                          key={v.id}
                          role="tab"
                          aria-selected={view === v.id}
                          onClick={() => setView(v.id)}
                          className={`relative flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                            view === v.id ? 'text-ink' : 'text-muted hover:text-ink'
                          }`}
                        >
                          {view === v.id && (
                            <motion.span layoutId="view-pill" className="absolute inset-0 rounded-md bg-white shadow-sm ring-1 ring-line" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                          )}
                          <span className="relative">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[#05080f]">
                    {shownImage && (
                      <motion.img
                        key={view + (result ? 'r' : 'p')}
                        src={shownImage}
                        alt={status === 'done' ? `Chest X-ray - ${view} view` : 'Selected chest X-ray preview'}
                        className="absolute inset-0 size-full object-contain"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {status === 'loading' && (
                      <div className="absolute inset-0 bg-navy-950/50">
                        <div className="absolute inset-x-0 h-28 -translate-y-full animate-scan bg-gradient-to-b from-transparent via-cyan-300/10 to-cyan-300/35">
                          <div className="absolute inset-x-0 bottom-0 h-px bg-cyan-200 shadow-[0_0_18px_2px_rgb(34_211_238/0.85)]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {status === 'done' && view !== 'original' && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#30123b,#466be3,#28bbec,#32f197,#a4fc3c,#eecf3a,#fb8022,#d13405,#7a0403)' }} />
                      <div className="mt-1 flex justify-between text-[11px] text-muted">
                        <span>Low influence</span>
                        <span>High influence on “{result.gradcam.target_class === 'PNEUMONIA' ? 'Pneumonia' : 'Normal'}”</span>
                      </div>
                    </div>
                  )}

                  <p className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                    <span className="truncate font-mono" title={file.name}>{file.name}</span>
                    <span className="shrink-0 font-mono">{formatBytes(file.size)}</span>
                  </p>

                  {status !== 'done' && (
                    <button onClick={analyze} disabled={status === 'loading'} className="btn btn-dark mt-4 w-full !py-3">
                      {status === 'loading' ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" /> Analyzing…
                        </>
                      ) : (
                        <>
                          <ScanSearch className="size-4" /> Analyze X-ray
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {!file && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4 text-teal-700" aria-hidden /> No X-ray at hand? Try a sample
                </p>
                <p className="mt-1 text-xs text-muted">Images from the held-out test set, with their expert label.</p>
                <div className="mt-3 grid grid-cols-4 gap-2.5">
                  {SAMPLES.map((sample) => (
                    <button
                      key={sample.src}
                      onClick={() => loadSample(sample)}
                      className="group overflow-hidden rounded-lg bg-[#05080f] ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lift hover:ring-teal-500"
                      aria-label={`Use sample X-ray labelled ${sample.label}`}
                    >
                      <img src={sample.src} alt="" loading="lazy" className="aspect-square w-full object-cover opacity-90 transition group-hover:opacity-100" />
                      <span className="block bg-white py-1 text-[11px] font-medium text-slate-700">{sample.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ------------------------ right: results ----------------------- */}
          <div className="card min-h-[420px] p-5 sm:p-6" aria-live="polite">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Activity className="size-4 text-teal-700" aria-hidden /> Analysis result
            </h2>

            <div className="mt-5 h-[calc(100%-2.75rem)]">
              <AnimatePresence mode="wait">
                {status === 'loading' ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingSkeleton caption={LOADING_STEPS[step]} />
                  </motion.div>
                ) : status === 'done' && result ? (
                  <motion.div key="result" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResultPanel result={result} onReset={reset} />
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EmptyState ready={status === 'ready'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function EmptyState({ ready }) {
  const points = [
    { icon: ScanSearch, title: 'Classification', text: 'Normal or Pneumonia, with the model’s confidence.' },
    { icon: Activity, title: 'Probability breakdown', text: 'The estimated probability of each class.' },
    { icon: Eye, title: 'Grad-CAM heatmap', text: 'The image regions that influenced the prediction.' },
  ]
  return (
    <div>
      <p className="text-sm text-muted">
        {ready ? 'Image ready. Press “Analyze X-ray” to run the model.' : 'Upload an image to begin. You will get:'}
      </p>
      <ul className="mt-5 divide-y divide-line rounded-lg ring-1 ring-line">
        {points.map((p) => (
          <li key={p.title} className="flex items-start gap-3.5 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-teal-700 ring-1 ring-line">
              <p.icon className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="mt-0.5 text-sm text-muted">{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-muted">
        Images are sent to the model server for analysis and are not stored. Do not upload images containing personal
        identifiers.
      </p>
    </div>
  )
}

function LoadingSkeleton({ caption }) {
  return (
    <div role="status" aria-label="Analyzing image">
      <p className="flex items-center gap-2 text-sm font-medium text-teal-700">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.span key={caption} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {caption}…
          </motion.span>
        </AnimatePresence>
      </p>
      <div className="mt-6 flex items-center gap-6">
        <div className="skeleton size-32 !rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-8 w-44" />
          <div className="skeleton h-3 w-full max-w-64" />
        </div>
      </div>
      <div className="mt-8 space-y-5 border-t border-line pt-6">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-2 w-full" />
        <div className="skeleton h-2 w-full" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-9" />
        ))}
      </div>
    </div>
  )
}
