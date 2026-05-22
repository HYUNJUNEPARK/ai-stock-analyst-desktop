import { Routes, Route, Navigate } from 'react-router-dom'
import ModelSelectionPage from './pages/ai-model/ModelSelectionPage'
import LandingPage from './pages/landing/LandingPage'
import CliDownloadPage from './pages/download/CliDownloadPage'
import AuthPage from './pages/auth/AuthPage'
import PromptPage from './pages/prompt/PromptPage'
import ResponsePage from './pages/response/ResponsePage'
import SettingsPage from './pages/setting/SettingsPage'
import RecentReportPage from './pages/report/RecentReportPage'
import ReportDetailPage from './pages/report/ReportDetailPage'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<ModelSelectionPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/download" element={<CliDownloadPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/reports/latest" element={<RecentReportPage />} />
      <Route path="/reports/:name" element={<ReportDetailPage />} />
      <Route path="/prompt" element={<PromptPage />} />
      <Route path="/response" element={<ResponsePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
