import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { useApp } from '../../context/AppContext'
import NavBar from '../../components/NavBar'
import gptImg from '../../assets/gpt.jpg'
import claudeImg from '../../assets/claude.png'
import { ROUTES } from '../../routes'

const DEV_PREVIEW_PROMPT = '삼성전자'

export default function SettingsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, currentPrompt, setCurrentPrompt } = useApp()

  useEffect(() => {
    console.log('[Page] SettingsPage 렌더링')
  }, [])

  useEffect(() => {
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
    }
  }, [navigate, selectedModel])

  if (!selectedModel) return <></>

  function handleDevPreview(): void {
    const previewPrompt = currentPrompt.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate(ROUTES.RESPONSE, {
      state: {
        previewOnly: true,
        previewStatus: 'done',
        model: selectedModel,
        prompt: previewPrompt
      }
    })
  }

  function handleDevProcessingPreview(): void {
    const previewPrompt = currentPrompt.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate(ROUTES.RESPONSE, {
      state: {
        previewOnly: true,
        previewStatus: 'streaming',
        model: selectedModel,
        prompt: previewPrompt
      }
    })
  }

  const isGpt = selectedModel === 'gpt'
  const modelLabel = isGpt ? 'GPT' : 'Claude'
  const modelDescription = isGpt
    ? 'Codex CLI 기반으로 분석을 실행합니다.'
    : 'Claude Code CLI 기반으로 분석을 실행합니다.'
  const modelImage = isGpt ? gptImg : claudeImg

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.PROMPT)} title="설정" />

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 24, paddingBottom: 24 }}>

          <section className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              현재 모델
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={modelImage}
                alt={modelLabel}
                style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 4 }}>
                  {modelLabel}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {modelDescription}
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              빠른 작업
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={() => navigate(ROUTES.REPORTS_LATEST)} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>이전 보고서 확인</div>
                  <div style={settingsRowDescStyle}>저장된 분석 보고서 목록을 확인합니다.</div>
                </div>
                <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </button>
            </div>
          </section>

          {import.meta.env.DEV && (
            <section className="card" style={{ padding: 18, marginTop: 14 }}>
              <div
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}
              >
                개발용 미리보기
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <button onClick={handleDevPreview} style={settingsRowButtonStyle}>
                  <div>
                    <div style={settingsRowTitleStyle}>응답 화면 미리보기</div>
                    <div style={settingsRowDescStyle}>
                      응답 완료 상태의 화면을 개발용 데이터로 바로 확인합니다.
                    </div>
                  </div>
                  <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </button>
                <button onClick={handleDevProcessingPreview} style={settingsRowButtonStyle}>
                  <div>
                    <div style={settingsRowTitleStyle}>처리 중 화면 미리보기</div>
                    <div style={settingsRowDescStyle}>
                      스트리밍 진행 중 상태의 응답 화면을 개발용으로 확인합니다.
                    </div>
                  </div>
                  <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}


const settingsRowButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  width: '100%',
  textAlign: 'left',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  fontFamily: 'inherit'
}

const settingsRowTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 4
}

const settingsRowDescStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--text-secondary)',
  lineHeight: 1.5
}
