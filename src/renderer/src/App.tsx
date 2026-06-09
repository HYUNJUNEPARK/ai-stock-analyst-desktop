import { Routes, Route, Navigate } from 'react-router-dom'
import ModelSelectionPage from './pages/ai-model/ModelSelectionPage'
import StatusCheckPage from './pages/status-check/StatusCheckPage'
import CliDownloadPage from './pages/download/CliDownloadPage'
import AuthPage from './pages/auth/AuthPage'
import PromptPage from './pages/prompt/PromptPage'
import ResponsePage from './pages/response/ResponsePage'
import InfoPage from './pages/info/InfoPage'
import RecentReportPage from './pages/report/RecentReportPage'
import ReportDetailPage from './pages/report/ReportDetailPage'
import InvestmentTypePage from './pages/guide/investment/InvestmentTypePage'
import ValuationTermsPage from './pages/guide/valuation/ValuationTermsPage'
import TechnicalAnalysisTermsPage from './pages/guide/technical-analysis/TechnicalAnalysisTermsPage'
import { ROUTES } from './routes'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path={ROUTES.ROOT} element={<ModelSelectionPage />} />
      <Route path={ROUTES.STATUS_CHECK} element={<StatusCheckPage />} />
      <Route path={ROUTES.DOWNLOAD} element={<CliDownloadPage />} />
      <Route path={ROUTES.AUTH} element={<AuthPage />} />
      <Route path={ROUTES.INFO} element={<InfoPage />} />
      <Route path={ROUTES.REPORTS_LATEST} element={<RecentReportPage />} />
      <Route path={ROUTES.REPORT_DETAIL(':name')} element={<ReportDetailPage />} />
      <Route path={ROUTES.GUIDE_INVESTMENT} element={<InvestmentTypePage />} />
      <Route path={ROUTES.GUIDE_VALUATION} element={<ValuationTermsPage />} />
      <Route path={ROUTES.GUIDE_TECHNICAL_ANALYSIS} element={<TechnicalAnalysisTermsPage />} />
      <Route path={ROUTES.PROMPT} element={<PromptPage />} />
      <Route path={ROUTES.RESPONSE} element={<ResponsePage />} />
      <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
    </Routes>
  )
}

export default App
