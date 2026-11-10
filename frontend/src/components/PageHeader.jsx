import { motion } from 'framer-motion'

/** Dark banner at the top of the inner pages (sits behind the navbar). */
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 pt-16 text-white">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div
        className="absolute -top-40 right-[-10%] size-[420px] animate-drift rounded-full bg-cyan-500/20 blur-[110px]"
        aria-hidden
      />
      <div className="container-page relative py-12 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="eyebrow text-cyan-300">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">{description}</p>}
          {children}
        </motion.div>
      </div>
    </section>
  )
}
