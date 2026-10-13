import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import FileDropzone from '../components/FileDropzone'
import ScanResult from '../components/ScanResult'
import type { ScanDetail } from '../types/api'

export default function QrScanner() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ScanDetail | null>(null)
  const { loading, error, run } = useAsync(api.scanQr)

  async function analyze() {
    if (!file) return
    const data = await run(file)
    if (data) setResult(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">QR Scanner</h1>
        <p className="text-sm text-muted">Decodes the QR code, then analyzes any URL it contains. Decoded links are never opened.</p>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <FileDropzone file={file} onFile={setFile} label="Upload a QR code image" />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={analyze} disabled={!file || loading}
            className="flex items-center gap-2 rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />} Analyze QR Code
          </button>
          {loading && <span className="text-sm text-muted" aria-live="polite">Decoding and analyzing…</span>}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
      {result && (
        <>
          {result.extracted === null && (
            <p className="text-sm text-muted">No QR code was found in this image. Try a sharper, well-lit image.</p>
          )}
          {result.extracted && !result.qr_urls?.length && (
            <p className="text-sm text-muted">The QR code does not contain a web link, so URL reputation rules do not apply.</p>
          )}
          <ScanResult scan={result} />
        </>
      )}
    </div>
  )
}
