import axios from 'axios'
import type { ScanDetail, ScanPage, Settings, Stats } from '../types/api'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

/** Converts API errors into short, user-facing messages. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
    if (!err.response) return 'The backend is unreachable. Check that the API server is running.'
  }
  return 'Something went wrong. Please try again.'
}

export const api = {
  scanUrl: (url: string) => http.post<ScanDetail>('/api/scan/url', { url }).then(r => r.data),
  scanQr: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<ScanDetail>('/api/scan/qr', form).then(r => r.data)
  },
  scanScreenshot: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<ScanDetail>('/api/scan/screenshot', form).then(r => r.data)
  },
  listScans: (params: Record<string, string | number>) =>
    http.get<ScanPage>('/api/scans', { params }).then(r => r.data),
  getScan: (id: string) => http.get<ScanDetail>(`/api/scans/${id}`).then(r => r.data),
  deleteScan: (id: string) => http.delete(`/api/scans/${id}`),
  stats: () => http.get<Stats>('/api/stats').then(r => r.data),
  settings: () => http.get<Settings>('/api/settings').then(r => r.data),
  reportPdfUrl: (id: string) => `${http.defaults.baseURL ?? ''}/api/scans/${id}/report.pdf`,
  reportJsonUrl: (id: string) => `${http.defaults.baseURL ?? ''}/api/scans/${id}/report.json`,
}
