import { useEffect, useState } from 'react'
import { api, errorMessage } from '../services/api'
import { useTheme } from '../hooks/theme'
import type { Settings as SettingsType } from '../types/api'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { api.settings().then(setSettings).catch(err => setError(errorMessage(err))) }, [])

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="font-medium">Theme</h2>
        <p className="mb-3 text-xs text-muted">Saved in this browser.</p>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map(t => (
            <button key={t} onClick={() => setTheme(t)}
              className={`rounded-lg border px-4 py-2 text-sm capitalize ${theme === t ? 'border-accent text-accent' : 'border-[var(--color-border)]'}`}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {settings && (
        <>
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <h2 className="font-medium">Risk thresholds</h2>
            <p className="mb-3 text-xs text-muted">
              Read-only in this build. They are set in the backend scoring configuration and are not saved from this page.
            </p>
            <ul className="grid gap-1 text-sm sm:grid-cols-3">
              <li>Caution from {settings.risk_thresholds.caution_min}</li>
              <li>Suspicious from {settings.risk_thresholds.suspicious_min}</li>
              <li>High risk from {settings.risk_thresholds.high_min}</li>
            </ul>
          </section>
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-sm">
            <h2 className="mb-2 font-medium">Upload limits and retention</h2>
            <p>Maximum upload: {settings.max_upload_mb} MB (PNG, JPG, JPEG, WebP).</p>
            <p>Scan records older than {settings.retention_days} days are deleted when the server starts. Uploaded image bytes are never stored.</p>
          </section>
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-sm">
            <h2 className="mb-2 font-medium">Detection engine</h2>
            <p>{settings.detection_engine}</p>
          </section>
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-sm">
            <h2 className="mb-2 font-medium">Optional providers</h2>
            <p className="text-muted">Add API keys to backend/.env, then restart the server. Keys are never sent to the browser.</p>
          </section>
        </>
      )}
    </div>
  )
}
