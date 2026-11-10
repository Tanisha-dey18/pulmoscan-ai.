import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/Toast'
import About from './pages/About'
import Analyze from './pages/Analyze'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'

// The insights page pulls in the charting library, so load it only when needed.
const Insights = lazy(() => import('./pages/Insights'))

/** Routes wrapped in a fade/slide animation that runs on every page change. */
function AnimatedRoutes() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="min-h-screen"
      >
        <Suspense
          fallback={
            <div className="grid min-h-screen place-items-center bg-navy-950" role="status" aria-label="Loading page">
              <span className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300" />
            </div>
          }
        >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />
        <AnimatedRoutes />
        <Footer />
      </ToastProvider>
    </BrowserRouter>
  )
}
