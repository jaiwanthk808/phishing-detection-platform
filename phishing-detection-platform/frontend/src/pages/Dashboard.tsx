import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { Link2, QrCode, Image as ImageIcon, ShieldAlert } from 'lucide-react'
import { api, errorMessage } from '../services/api'
import type { ScanSummary, Stats } from '../types/api'
import { CLASS_COLOR, TYPE_LABEL } from '../services/classify'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<ScanSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.stats(), api.listScans({ page: 1, page_size: 5 })])
      .then(([s, list]) => { setStats(s); setRecent(list.items) })
      .catch(err => setError(errorMessage(err)))
  }, [])

  const classData = stats ? [
    { name: 'Low Risk', value: stats.low }, { name: 'Caution', value: stats.caution },
    { name: 'Suspicious', value: stats.suspicious }, { name: 'High Risk', value: stats.high },
  ] : []
  const typeData = stats ? (['url', 'qr', 'screenshot'] as const).map(t => ({ name: TYPE_LABEL[t], value: stats.by_type[t] })) : []
  const pieColors = ['var(--color-low)', 'var(--color-caution)', 'var(--color-suspicious)', 'var(--color-high)']

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Understand threats before you trust them.</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Analyze suspicious links, QR codes, and website screenshots with explainable cybersecurity detection.
        </p>
        <button onClick={() => navigate('/scan/url')}
          className="mt-5 rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-white hover:brightness-110">
          Start New Scan
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { to: '/scan/url', label: 'Analyze URL', icon: Link2, desc: 'Check a link’s structure and indicators.' },
          { to: '/scan/qr', label: 'Scan QR Code', icon: QrCode, desc: 'Decode a QR image and analyze its link.' },
          { to: '/scan/screenshot', label: 'Analyze Screenshot', icon: ImageIcon, desc: 'Extract text and flag phishing wording.' },
        ].map(({ to, label, icon: Icon, desc }) => (
          <Link key={to} to={to} className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-colors hover:border-accent-2">
            <Icon className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-3 font-medium">{label}</p>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </Link>
        ))}
      </section>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {stats && (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard label="Total scans" value={stats.total} />
            <StatCard label="Low risk" value={stats.low} />
            <StatCard label="Caution" value={stats.caution} />
            <StatCard label="Suspicious" value={stats.suspicious} />
            <StatCard label="High risk" value={stats.high} />
            <StatCard label="Scans today" value={stats.today} />
          </section>

          {stats.total === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center">
              <ShieldAlert className="mx-auto text-muted" size={32} aria-hidden="true" />
              <p className="mt-3 font-medium">No scans yet</p>
              <p className="mt-1 text-sm text-muted">Charts will appear here after your first scan.</p>
            </div>
          ) : (
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <h2 className="mb-3 font-medium">Scan activity (last 14 days)</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-accent-2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <h2 className="mb-3 font-medium">Risk category distribution</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={classData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                        {classData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <h2 className="mb-3 font-medium">Scan-type distribution</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="var(--color-highlight)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <h2 className="mb-3 font-medium">Recent scans</h2>
                <ul className="divide-y divide-[var(--color-border)] text-sm">
                  {recent.map(s => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                      <Link to={`/scans/${s.id}`} className="truncate hover:underline">{s.input_label}</Link>
                      <span className="shrink-0 text-xs" style={{ color: CLASS_COLOR[s.classification] }}>
                        {s.risk_score} · {s.classification}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
