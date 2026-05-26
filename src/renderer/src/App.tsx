import { Routes, Route, Navigate } from 'react-router-dom'
import ModelSelectionPage from './pages/ai-model/ModelSelectionPage'
import LandingPage from './pages/landing/LandingPage'
import CliDownloadPage from './pages/download/CliDownloadPage'
import AuthPage from './pages/auth/AuthPage'
import PromptPage from './pages/prompt/PromptPage'
import ResponsePage from './pages/response/ResponsePage'
import InfoPage from './pages/info/InfoPage'
import RecentReportPage from './pages/report/RecentReportPage'
import ReportDetailPage from './pages/report/ReportDetailPage'
import { ROUTES } from './routes'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path={ROUTES.ROOT} element={<ModelSelectionPage />} />
      <Route path={ROUTES.LANDING} element={<LandingPage />} />
      <Route path={ROUTES.DOWNLOAD} element={<CliDownloadPage />} />
      <Route path={ROUTES.AUTH} element={<AuthPage />} />
      <Route path={ROUTES.INFO} element={<InfoPage />} />
      <Route path={ROUTES.REPORTS_LATEST} element={<RecentReportPage />} />
      <Route path={ROUTES.REPORT_DETAIL(':name')} element={<ReportDetailPage />} />
      <Route path={ROUTES.PROMPT} element={<PromptPage />} />
      <Route path={ROUTES.RESPONSE} element={<ResponsePage />} />
      <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
    </Routes>
  )
}

export default App
