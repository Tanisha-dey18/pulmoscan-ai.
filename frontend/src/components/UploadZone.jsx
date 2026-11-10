import { motion } from 'framer-motion'
import { FileImage, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { MAX_UPLOAD_MB } from '../services/api'

/** Drag-and-drop area. Calls onFile(file) with the first dropped/selected file. */
export default function UploadZone({ onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a chest X-ray image"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center transition-all duration-200 sm:aspect-[4/3] lg:aspect-square ${
        dragging
          ? 'scale-[1.01] border-cyan-400 bg-cyan-50'
          : 'border-slate-300 bg-surface hover:border-teal-500 hover:bg-teal-50/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = '' // allow choosing the same file again
        }}
      />

      <motion.span
        animate={dragging ? { y: -6, scale: 1.08 } : { y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="grid size-14 place-items-center rounded-xl bg-navy-900 text-cyan-300 shadow-lift"
      >
        {dragging ? <FileImage className="size-6" /> : <Upload className="size-6" />}
      </motion.span>

      <p className="mt-5 text-base font-semibold">{dragging ? 'Drop the image to upload' : 'Drag and drop a chest X-ray'}</p>
      <p className="mt-1 text-sm text-muted">
        or <span className="font-medium text-teal-700 underline-offset-4 group-hover:underline">browse your files</span>
      </p>
      <p className="mt-4 font-mono text-[11px] tracking-wide text-slate-500 uppercase">JPEG or PNG · up to {MAX_UPLOAD_MB} MB</p>
    </div>
  )
}
