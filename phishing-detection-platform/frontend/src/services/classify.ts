import type { Classification } from '../types/api'

export const CLASS_COLOR: Record<Classification, string> = {
  'Low Risk': 'var(--color-low)',
  Caution: 'var(--color-caution)',
  Suspicious: 'var(--color-suspicious)',
  'High Risk': 'var(--color-high)',
}

export const CLASS_TEXT: Record<Classification, string> = {
  'Low Risk': 'text-green-400',
  Caution: 'text-yellow-400',
  Suspicious: 'text-orange-400',
  'High Risk': 'text-red-400',
}

export function classify(score: number): Classification {
  if (score >= 75) return 'High Risk'
  if (score >= 50) return 'Suspicious'
  if (score >= 25) return 'Caution'
  return 'Low Risk'
}

export const TYPE_LABEL = { url: 'URL', qr: 'QR code', screenshot: 'Screenshot' } as const
