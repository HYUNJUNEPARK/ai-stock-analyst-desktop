import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSettings } from 'react-icons/fi'
import { useApp } from '../../context/AppContext'
import gptImg from '../../assets/gpt.jpg'
import claudeImg from '../../assets/claude.png'
import RecentReportModal, { RecentReport } from './components/RecentReportModal'
import PromptInput from './components/PromptInput'
import { ROUTES } from '../../routes'

const MAX_CHARS = 100

export default function PromptPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, currentPrompt, setCurrentPrompt } = useApp()
  const [text, setText] = useState(currentPrompt)
  const [recentReport, setRecentReport] = useState<RecentReport | null>(null)

  useEffect(() => {
    console.log('[Page] PromptPage 렌더링')
  }, [])

  function handleChange(value: string): void {
    if (value.length > MAX_CHARS) return
    setText(value)
  }

  async function handleSubmit(): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return

    if (selectedModel === 'gpt') {
      const files = await window.api.listGptReportFiles()
      const now = Date.now()
      const keyword = trimmed.toLowerCase()
      const found = files
        .filter((f) => {
          // 이름 또는 티커에 키워드 포함 여부 + 2주 이내 생성된 보고서만
          const matchName = f.company.toLowerCase().includes(keyword) || f.ticker.toLowerCase().includes(keyword)
          const withinTwoWeeks = now - new Date(f.createdAt).getTime() < (14 * 24 * 60 * 60 * 1000)
          return matchName && withinTwoWeeks
        })
        // 가장 최근 보고서 하나만 남기기
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

      if (found) {
        const daysAgo = Math.floor((now - new Date(found.createdAt).getTime()) / (24 * 60 * 60 * 1000))
        setRecentReport({ ...found, daysAgo })
        return
      }
    }

    setCurrentPrompt(trimmed)
    navigate(ROUTES.RESPONSE)
  }

  function handleConfirmAnalysis(): void {
    setRecentReport(null)
    setCurrentPrompt(text.trim())
    navigate(ROUTES.RESPONSE)
  }

  function handleViewReport(): void {
    if (recentReport) {
      window.api.openReportDetailWindow(recentReport.name)
      setRecentReport(null)
    }
  }

  const modelLabel = selectedModel === 'gpt' ? 'GPT' : 'Claude'
  const modelImg = selectedModel === 'gpt' ? gptImg : claudeImg

  return (
    <div className="page">
      {/* 2주 이내 보고서 중복 경고 팝업 */}
      {recentReport && (
        <RecentReportModal
          report={recentReport}
          onConfirmAnalysis={handleConfirmAnalysis}
          onViewReport={handleViewReport}
          onCancel={() => setRecentReport(null)}
        />
      )}

      {/* 내비게이션 바 */}
      <nav className="nav-bar">
        <div className="model-badge">
          <img
            src={modelImg}
            alt={modelLabel}
            style={{ width: 16, height: 16, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
          />
          {modelLabel}
        </div>
        <div className="nav-right">
          <button
            onClick={() => navigate(ROUTES.SETTINGS)}
            aria-label="설정"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 8,
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <FiSettings size={22} />
          </button>
        </div>
      </nav>

      {/* 콘텐츠 — 수직 중앙 정렬 */}
      <div
        className="page-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: 400, padding: '0 8px' }}>
          <PromptInput value={text} onChange={handleChange} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  )
}


