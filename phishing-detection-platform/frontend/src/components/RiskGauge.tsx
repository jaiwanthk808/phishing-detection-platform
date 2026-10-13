import { useEffect, useState } from 'react'
import type { Classification } from '../types/api'
import { CLASS_COLOR } from '../services/classify'

interface Props {
  score: number
  classification: Classification
}

/** Semicircular gauge with an animated sweep and accessible text labels. */
export default function RiskGauge({ score, classification }: Props) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => setDisplay(score))
    return () => cancelAnimationFrame(t)
  }, [score])

  const r = 80
  const circumference = Math.PI * r
  const offset = circumference * (1 - display / 100)
  const color = CLASS_COLOR[classification]

  return (
    <div className="flex flex-col items-center" role="img"
         aria-label={`Risk score ${score} out of 100, ${classification}`}>
      <svg viewBox="0 0 200 120" className="w-64 max-w-full" aria-hidden="true">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--color-border)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 900ms ease-out' }} />
        <text x="100" y="92" textAnchor="middle" className="fill-current" fontSize="32" fontWeight="600">{score}</text>
        <text x="100" y="112" textAnchor="middle" fontSize="11" fill="var(--color-muted)">out of 100</text>
      </svg>
      <p className="mt-1 font-semibold" style={{ color }}>{classification}</p>
      <p className="mt-2 max-w-sm text-center text-xs text-muted">
        Risk scores are estimates based on available evidence. A low score does not guarantee that a website or QR code is safe.
      </p>
      <p className="mt-2 max-w-sm text-center text-[11px] text-muted">
        Prototype thresholds: 0–24 Low, 25–49 Caution, 50–74 Suspicious, 75–100 High. Not calibrated probabilities.
      </p>
    </div>
  )
}
