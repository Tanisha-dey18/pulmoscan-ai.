import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-400">
      <div className="container-page py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed">
              Intelligent pneumonia detection from chest X-rays using a convolutional neural network with Grad-CAM
              explanations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="eyebrow text-slate-500">Product</p>
              <ul className="mt-4 space-y-2.5">
                <li><Link className="transition hover:text-white" to="/analyze">AI Analysis</Link></li>
                <li><Link className="transition hover:text-white" to="/insights">Model Insights</Link></li>
                <li><Link className="transition hover:text-white" to="/about">About the project</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-slate-500">Built with</p>
              <ul className="mt-4 space-y-2.5">
                <li>TensorFlow / Keras</li>
                <li>FastAPI</li>
                <li>React + Vite</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100/90">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
          <p>
            <strong className="font-semibold text-amber-200">Educational prototype - not a medical device.</strong>{' '}
            PulmoScan AI has not been clinically validated. Its output must never be used to diagnose, treat or rule
            out any condition, and it does not replace evaluation by a qualified healthcare professional.
          </p>
        </div>

        <p className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} PulmoScan AI · B.Tech Data Science project · Dataset: Kermany et al., 2018 (CC BY 4.0)
        </p>
      </div>
    </footer>
  )
}
