/** 0.9234 -> "92.3%" */
export const formatPercent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`

/** 1234567 -> "1,234,567" */
export const formatInt = (value) => Number(value).toLocaleString('en-US')

/** 1536000 -> "1.5 MB" */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
