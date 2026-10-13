import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../hooks/theme'
import {
  Activity, BarChart3, BookOpen, History, Menu, Moon, QrCode, Radar,
  Settings as SettingsIcon, ShieldCheck, Sun, X, Link2, Image as ImageIcon, LayoutDashboard,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/scan/url', label: 'URL Scanner', icon: Link2 },
  { to: '/scan/qr', label: 'QR Scanner', icon: QrCode },
  { to: '/scan/screenshot', label: 'Screenshot Analyzer', icon: ImageIcon },
  { to: '/history', label: 'Scan History', icon: History },
  { to: '/threat-intel', label: 'Threat Intelligence', icon: Radar },
  { to: '/evaluation', label: 'Model Evaluation', icon: BarChart3 },
  { to: '/about', label: 'About Project', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive ? 'bg-accent-2/15 text-accent' : 'text-muted hover:bg-white/5 hover:text-current'
            }`}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  const brand = (
    <div className="flex items-center gap-2 px-3 pb-6 pt-2">
      <ShieldCheck className="text-accent" size={24} aria-hidden="true" />
      <span className="font-semibold">PhishGuard</span>
    </div>
  )

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] p-4 lg:block">
        {brand}
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/60" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between">
              {brand}
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2"><X size={18} /></button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)]/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button className="p-2 lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="flex items-center gap-2 text-sm text-muted">
              <Activity size={16} aria-hidden="true" /> Local analysis service
            </span>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg border border-[var(--color-border)] p-2 hover:bg-white/5"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

