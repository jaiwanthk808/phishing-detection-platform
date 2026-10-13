import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { ThemeProvider } from './hooks/theme'
import Dashboard from './pages/Dashboard'
import UrlScanner from './pages/UrlScanner'
import QrScanner from './pages/QrScanner'
import ScreenshotAnalyzer from './pages/ScreenshotAnalyzer'
import History from './pages/History'
import ScanDetail from './pages/ScanDetail'
import ThreatIntel from './pages/ThreatIntel'
import ModelEvaluation from './pages/ModelEvaluation'
import About from './pages/About'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="scan/url" element={<UrlScanner />} />
          <Route path="scan/qr" element={<QrScanner />} />
          <Route path="scan/screenshot" element={<ScreenshotAnalyzer />} />
          <Route path="history" element={<History />} />
          <Route path="scans/:id" element={<ScanDetail />} />
          <Route path="threat-intel" element={<ThreatIntel />} />
          <Route path="evaluation" element={<ModelEvaluation />} />
          <Route path="about" element={<About />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}
