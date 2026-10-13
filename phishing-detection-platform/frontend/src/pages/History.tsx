import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { api, errorMessage } from '../services/api'
import type { ScanPage } from '../types/api'
import { CLASS_TEXT, TYPE_LABEL } from '../services/classify'

const PAGE_SIZE = 10

export default function History() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [cls, setCls] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ScanPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(() => {
    const params: Record<string, string | number> = { page, page_size: PAGE_SIZE, sort }
    if (search) params.q = search
    if (type) params.scan_type = type
    if (cls) params.classification = cls
    api.listScans(params).then(setData).catch(err => setError(errorMessage(err)))
  }, [page, search, type, cls, sort])

  useEffect(() => { load() }, [load])

  async function remove(id: string) {
    try {
      await api.deleteScan(id)
      setConfirmId(null)
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const select = 'rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Scan History</h1>

      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(q.trim()) }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search URL or filename"
          aria-label="Search scans" className={`${select} min-w-56 flex-1`} />
        <select value={type} onChange={e => { setType(e.target.value); setPage(1) }} className={select} aria-label="Filter by type">
          <option value="">All types</option><option value="url">URL</option><option value="qr">QR code</option><option value="screenshot">Screenshot</option>
        </select>
        <select value={cls} onChange={e => { setCls(e.target.value); setPage(1) }} className={select} aria-label="Filter by classification">
          <option value="">All classifications</option><option>Low Risk</option><option>Caution</option><option>Suspicious</option><option>High Risk</option>
        </select>
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} className={select} aria-label="Sort">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
          <option value="score_high">Highest score</option><option value="score_low">Lowest score</option>
        </select>
        <button type="submit" className="rounded-lg bg-accent-2 px-4 py-2 text-sm text-white">Search</button>
      </form>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs text-muted">
            <tr>
              <th className="px-4 py-3">Type</th><th className="px-4 py-3">URL or filename</th>
              <th className="px-4 py-3">Score</th><th className="px-4 py-3">Classification</th>
              <th className="px-4 py-3">Timestamp</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {data?.items.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-3">{TYPE_LABEL[s.scan_type]}</td>
                <td className="max-w-xs truncate px-4 py-3" title={s.input_label}>{s.input_label}</td>
                <td className="px-4 py-3">{s.risk_score}</td>
                <td className={`px-4 py-3 ${CLASS_TEXT[s.classification]}`}>{s.classification}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/scans/${s.id}`} className="text-accent hover:underline">Details</Link>
                  {confirmId === s.id ? (
                    <span className="ml-3 inline-flex gap-2">
                      <button onClick={() => remove(s.id)} className="text-red-400 hover:underline">Confirm delete</button>
                      <button onClick={() => setConfirmId(null)} className="text-muted hover:underline">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(s.id)} aria-label="Delete scan" className="ml-3 text-muted hover:text-red-400">
                      <Trash2 size={14} className="inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.items.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">No scans match these filters.</p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{data?.total ?? 0} scans</span>
        <div className="flex items-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40">Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}
