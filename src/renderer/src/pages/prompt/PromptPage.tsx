import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCircleInfo } from 'react-icons/fa6'
import { useApp } from '../../context/AppContext'
import { gptIcon as gptImg, claudeIcon as claudeImg } from '../../assets'
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
    if (import.meta.env.DEV) console.log('[Page] PromptPage 렌더링')
  }, [])

  function handleChange(value: string): void {
    if (value.length > MAX_CHARS) return
    setText(value)
  }

  async function handleSubmit(): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return

    if (selectedModel === 'gpt') {
      let files: Awaited<ReturnType<typeof window.api.listGptReportFiles>>
      try {
        files = await window.api.listGptReportFiles()
      } catch (error) {
        console.error('[prompt] 보고서 목록 조회 실패:', error instanceof Error ? error.message : String(error))
        setCurrentPrompt(trimmed)
        navigate(ROUTES.RESPONSE)
        return
      }
      const keyword = trimmed.toLowerCase()
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const found = files
        .filter((f) => {
          // 이름 또는 티커에 키워드 포함 여부
          const matchName = f.company.toLowerCase().includes(keyword) || f.ticker.toLowerCase().includes(keyword)
          // 날짜 비교: asOfDate(JSON 내용) 우선, 없으면 폴더명(name = "YYYYMMDD/stockFolder")에서 파싱
          // 파일 시스템 stat(createdAt)은 복사·git 작업 등으로 변경될 수 있어 사용하지 않음
          const dateFolder = f.name.split('/')[0]
          const reportDate = f.asOfDate || `${dateFolder.slice(0, 4)}-${dateFolder.slice(4, 6)}-${dateFolder.slice(6, 8)}`
          return matchName && reportDate === todayStr
        })
        // 가장 최근 보고서 하나만 남기기
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

      if (found) {
        setRecentReport({ ...found, daysAgo: 0 })
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
      window.api.openReportDetailWindow(recentReport.name, recentReport.model ?? 'gpt')
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
            onClick={() => navigate(ROUTES.INFO)}
            aria-label="정보"
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
            <FaCircleInfo size={22} />
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


