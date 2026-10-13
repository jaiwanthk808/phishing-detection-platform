import { CheckCircle2, CircleSlash, MinusCircle, Copy } from 'lucide-react'
import { useState } from 'react'
import type { ScanDetail } from '../types/api'
import RiskGauge from './RiskGauge'
import { CLASS_TEXT } from '../services/classify'

const SEV: Record<string, string> = {
  high: 'bg-red-500/15 text-red-300', medium: 'bg-orange-500/15 text-orange-300',
  low: 'bg-yellow-500/15 text-yellow-300', info: 'bg-blue-500/15 text-blue-300',
}

/** Shared results view for all three scan types. */
export default function ScanResult({ scan }: { scan: ScanDetail }) {
  const [copied, setCopied] = useState(false)
  const risks = scan.findings.filter(f => !f.benign)
  const benign = scan.findings.filter(f => f.benign)

  function copySummary() {
    const text = `Scan ${scan.id} (${scan.scan_type}) of "${scan.input_label}": ${scan.risk_score}/100, ${scan.classification}. ${risks.length} indicator(s).`
    navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => setCopied(false))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 lg:col-span-1">
        <RiskGauge score={scan.risk_score} classification={scan.classification} />
        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Analysis coverage</span>
            <span>{scan.coverage.percent}%</span></div>
          <div className="flex justify-between"><span className="text-muted">Applicable checks</span>
            <span>{scan.coverage.applicable}</span></div>
          <div className="flex justify-between"><span className="text-muted">Completed</span>
            <span>{scan.coverage.completed}</span></div>
          <div className="flex justify-between"><span className="text-muted">Unavailable</span>
            <span>{scan.coverage.unavailable}</span></div>
        </div>
        <button onClick={copySummary} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-white/5">
          <Copy size={14} /> {copied ? 'Summary copied' : 'Copy report summary'}
        </button>
      </section>

      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-3 font-semibold">Input</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-[120px_1fr]">
            <dt className="text-muted">Type</dt><dd>{scan.scan_type}</dd>
            <dt className="text-muted">Label</dt><dd className="break-all">{scan.input_label}</dd>
            {typeof scan.features.hostname === 'string' && <><dt className="text-muted">Hostname</dt><dd className="break-all">{scan.features.hostname}</dd></>}
            {scan.extracted && <><dt className="text-muted">Extracted</dt><dd className="whitespace-pre-wrap break-all font-mono text-xs">{scan.extracted}</dd></>}
            <dt className="text-muted">Verdict</dt><dd className={CLASS_TEXT[scan.classification]}>{scan.classification}</dd>
          </dl>
        </section>

        {scan.qr_urls && scan.qr_urls.length > 0 && (
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <h2 className="mb-3 font-semibold">URLs decoded from the QR code</h2>
            <ul className="space-y-2 text-sm">
              {scan.qr_urls.map(u => (
                <li key={u.content} className="break-all">
                  <span className="font-mono text-xs">{u.content}</span>
                  <span className="ml-2 text-muted">· {u.classification} ({u.score}/100)</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">The decoded link was analyzed, not opened.</p>
          </section>
        )}

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-3 font-semibold">Suspicious indicators</h2>
          {risks.length === 0 ? (
            <p className="text-sm text-muted">No risk indicators were recorded. This is not a guarantee that the item is safe.</p>
          ) : (
            <ul className="space-y-4">
              {risks.map(f => (
                <li key={f.indicator_id} className="rounded-lg border border-[var(--color-border)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{f.name}</span>
                    <span className="flex items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 ${SEV[f.severity]}`}>{f.severity}</span>
                      <span className="text-muted">+{Math.round(f.contribution * 100)} weight</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm"><span className="text-muted">Evidence: </span>{f.evidence}</p>
                  <p className="mt-1 text-sm text-muted">{f.explanation}</p>
                  <p className="mt-1 text-sm"><span className="text-muted">Recommended action: </span>{f.recommendation}</p>
                  <p className="mt-1 text-[11px] text-muted">Source: {f.source}</p>
                </li>
              ))}
            </ul>
          )}
          {benign.length > 0 && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <h3 className="mb-2 text-sm font-medium">Benign or mitigating observations</h3>
              <ul className="space-y-2 text-sm">
                {benign.map(f => (
                  <li key={f.indicator_id} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-400" />
                    <span><span className="font-medium">{f.name}:</span> {f.evidence} <span className="text-muted">Contributes 0 to the score.</span></span></li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-3 font-semibold">Analysis checks</h2>
          <ul className="space-y-2 text-sm">
            {scan.checks.map(c => (
              <li key={c.name} className="flex items-start gap-2">
                {c.status === 'completed' ? <CheckCircle2 size={16} className="mt-0.5 text-green-400" />
                  : c.status === 'unavailable' ? <CircleSlash size={16} className="mt-0.5 text-yellow-400" />
                  : <MinusCircle size={16} className="mt-0.5 text-muted" />}
                <span>
                  <span className="font-medium">{c.name}</span>{' '}
                  <span className="text-muted">— {c.status.replace('_', ' ')}{c.note ? `: ${c.note}` : ''}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-3 font-semibold">Limitations</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            {scan.limitations.map(l => <li key={l}>{l}</li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
