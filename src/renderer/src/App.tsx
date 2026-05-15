import { Routes, Route, Navigate } from 'react-router-dom'
import ModelSelectionPage from './pages/ModelSelectionPage'
import CliDownloadPage from './pages/CliDownloadPage'
import AuthPage from './pages/auth/AuthPage'
import PromptPage from './pages/PromptPage'
import ResponsePage from './pages/ResponsePage'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<ModelSelectionPage />} />
      <Route path="/download" element={<CliDownloadPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/prompt" element={<PromptPage />} />
      <Route path="/response" element={<ResponsePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
