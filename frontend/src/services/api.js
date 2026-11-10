// All communication with the FastAPI backend lives in this file.
//
// Development : VITE_API_URL is empty -> requests go to /api/... and the Vite
//               dev server proxies them to the local backend (vite.config.js).
// Production  : VITE_API_URL is set in Netlify to the deployed backend URL,
//               e.g. https://pulmoscan-api-xxxx.onrender.com

const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

export const MAX_UPLOAD_MB = 10
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { timeoutMs = 60000, ...options } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. It may be waking up - please try again in a moment.')
    }
    throw new ApiError('Cannot reach the analysis server. Check your connection or try again shortly.')
  } finally {
    clearTimeout(timer)
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json')
  if (!isJson) {
    // e.g. the SPA fallback page was returned because VITE_API_URL is not set
    throw new ApiError(
      import.meta.env.PROD && !API_BASE
        ? 'The API URL is not configured. Set VITE_API_URL in the Netlify environment variables and redeploy.'
        : `Unexpected response from the server (HTTP ${response.status}).`,
      response.status,
    )
  }

  const body = await response.json()
  if (!response.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : 'The server could not process this request.'
    throw new ApiError(detail, response.status)
  }
  return body
}

/** Is the backend up and is the model loaded? */
export function getHealth() {
  return request('/api/health', { timeoutMs: 45000 })
}

/** Send one X-ray image and get prediction + Grad-CAM back. */
export function predictXray(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/api/predict', { method: 'POST', body: form, timeoutMs: 90000 })
}

// The insights never change while the page is open, so fetch them once and
// share the same promise between the landing page and the insights page.
let insightsPromise = null
export function getInsights({ force = false } = {}) {
  if (!insightsPromise || force) {
    insightsPromise = request('/api/model/insights').catch((err) => {
      insightsPromise = null // allow a retry later
      throw err
    })
  }
  return insightsPromise
}
