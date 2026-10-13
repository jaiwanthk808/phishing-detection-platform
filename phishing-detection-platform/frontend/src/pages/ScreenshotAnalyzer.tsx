import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import FileDropzone from '../components/FileDropzone'
import ScanResult from '../components/ScanResult'
import type { ScanDetail } from '../types/api'

export default function ScreenshotAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ScanDetail | null>(null)
  const { loading, error, run } = useAsync(api.scanScreenshot)

  async function analyze() {
    if (!file) return
    const data = await run(file)
    if (data) setResult(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Screenshot Analyzer</h1>
        <p className="text-sm text-muted">
          Uses OCR to read visible text and flags wording common in phishing pages. A screenshot cannot show the real destination URL.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <FileDropzone file={file} onFile={setFile} label="Upload a website screenshot" />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={analyze} disabled={!file || loading}
            className="flex items-center gap-2 rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />} Analyze Screenshot
          </button>
          {loading && <span className="text-sm text-muted" aria-live="polite">Running OCR…</span>}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
      {result && <ScanResult scan={result} />}
    </div>
  )
}
