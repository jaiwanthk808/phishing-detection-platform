export type ScanType = 'url' | 'qr' | 'screenshot'
export type Classification = 'Low Risk' | 'Caution' | 'Suspicious' | 'High Risk'

export interface FindingOut {
  indicator_id: string
  name: string
  evidence: string
  severity: 'info' | 'low' | 'medium' | 'high'
  weight: number
  contribution: number
  explanation: string
  recommendation: string
  source: string
  benign: boolean
}

export interface CheckOut {
  name: string
  status: 'completed' | 'unavailable' | 'not_applicable'
  note: string
}

export interface Coverage {
  applicable: number
  completed: number
  unavailable: number
  percent: number
}

export interface ScanDetail {
  id: string
  scan_type: ScanType
  input_label: string
  input_value: string | null
  extracted: string | null
  risk_score: number
  classification: Classification
  findings: FindingOut[]
  checks: CheckOut[]
  limitations: string[]
  features: Record<string, unknown>
  coverage: Coverage
  created_at: string
  qr_urls: { content: string; score: number; classification: string; findings: string[] }[] | null
}

export interface ScanSummary {
  id: string
  scan_type: ScanType
  input_label: string
  risk_score: number
  classification: Classification
  created_at: string
}

export interface ScanPage {
  items: ScanSummary[]
  total: number
  page: number
  page_size: number
}

export interface Stats {
  total: number
  low: number
  caution: number
  suspicious: number
  high: number
  today: number
  by_type: Record<ScanType, number>
  activity: { date: string; count: number }[]
}

export interface Settings {
  risk_thresholds: { caution_min: number; suspicious_min: number; high_min: number }
  max_upload_mb: number
  retention_days: number
  detection_engine: string
  providers: { name: string; configured: boolean; status: string; setup: string }[]
}
