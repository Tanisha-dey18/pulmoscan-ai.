import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-navy-950 text-white">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="container-page relative text-center">
        <p className="font-mono text-sm text-cyan-300">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-slate-300">The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-accent mt-8">
          Back to home <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
