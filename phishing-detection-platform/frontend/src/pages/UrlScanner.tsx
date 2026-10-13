import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, X } from 'lucide-react'
import { api } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import ScanResult from '../components/ScanResult'
import type { ScanDetail } from '../types/api'

const SAMPLE = 'http://192.168.1.5/paypal/login'

export default function UrlScanner() {
  const [url, setUrl] = useState('')
  const [validation, setValidation] = useState<string | null>(null)
  const [result, setResult] = useState<ScanDetail | null>(null)
  const navigate = useNavigate()
  const { loading, error, run, setError } = useAsync(api.scanUrl)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return setValidation('Enter a URL to analyze.')
    if (/\s/.test(trimmed)) return setValidation('A URL cannot contain spaces.')
    setValidation(null)
    const data = await run(trimmed)
    if (data) setResult(data)
  }

  function clear() {
    setUrl(''); setResult(null); setValidation(null); setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">URL Scanner</h1>
        <p className="text-sm text-muted">The link is analyzed as text only. It is never opened or fetched.</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <label htmlFor="url" className="mb-2 block text-sm font-medium">Website URL</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-accent-2"
            aria-invalid={!!validation} aria-describedby={validation ? 'url-error' : undefined} autoComplete="off" />
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />} Analyze
            </button>
            <button type="button" onClick={clear} className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-white/5">
              <X size={14} /> Clear
            </button>
          </div>
        </div>
        <button type="button" onClick={() => setUrl(SAMPLE)} className="mt-3 text-xs text-accent hover:underline">
          Load a harmless sample (a private IP address link)
        </button>
        {validation && <p id="url-error" role="alert" className="mt-3 text-sm text-red-400">{validation}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      </form>

      {loading && <p className="text-sm text-muted" aria-live="polite">Analyzing the URL…</p>}
      {result && (
        <>
          <ScanResult scan={result} />
          <div className="flex gap-3 text-sm">
            <button onClick={() => navigate(`/scans/${result.id}`)} className="text-accent hover:underline">Open full report</button>
            <button onClick={() => navigate('/')} className="text-accent hover:underline">Back to dashboard</button>
          </div>
        </>
      )}
    </div>
  )
}
