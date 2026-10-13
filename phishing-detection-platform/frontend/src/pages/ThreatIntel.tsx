import { useEffect, useState } from 'react'
import { api, errorMessage } from '../services/api'
import type { Settings } from '../types/api'

export default function ThreatIntel() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { api.settings().then(setSettings).catch(err => setError(errorMessage(err))) }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Threat Intelligence</h1>
        <p className="text-sm text-muted">Optional reputation providers. The core scanner works without any of them.</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {settings?.providers.map(p => (
        <section key={p.name} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{p.name}</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs ${p.configured ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-muted'}`}>
              {p.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">{p.setup}</p>
          <p className="mt-2 text-xs text-muted">Last successful lookup: none. Lookup failures: none recorded.</p>
        </section>
      ))}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-sm text-muted">
        <h2 className="mb-2 font-medium text-current">Limitations</h2>
        <p>Provider lookups are not yet integrated into the scanner. Unavailable providers are never treated as clean results.</p>
      </section>
    </div>
  )
}
