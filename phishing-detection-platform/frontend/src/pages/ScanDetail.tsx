import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage } from '../services/api'
import type { ScanDetail as ScanDetailType } from '../types/api'
import ScanResult from '../components/ScanResult'

export default function ScanDetail() {
  const { id = '' } = useParams()
  const [scan, setScan] = useState<ScanDetailType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getScan(id).then(setScan).catch(err => setError(errorMessage(err)))
  }, [id])

  if (error) return (
    <div className="space-y-3">
      <p role="alert" className="text-red-400">{error}</p>
      <Link to="/history" className="text-accent hover:underline">Back to history</Link>
    </div>
  )
  if (!scan) return <p className="text-sm text-muted">Loading report…</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Scan report</h1>
          <p className="text-xs text-muted">{scan.id} · {new Date(scan.created_at).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href={api.reportJsonUrl(scan.id)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-white/5">Export JSON</a>
          <a href={api.reportPdfUrl(scan.id)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-white/5">Export PDF</a>
          <Link to="/history" className="rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-white/5">Back to history</Link>
          <Link to="/" className="rounded-lg bg-accent-2 px-3 py-2 text-white">Dashboard</Link>
        </div>
      </div>
      <ScanResult scan={scan} />
    </div>
  )
}
