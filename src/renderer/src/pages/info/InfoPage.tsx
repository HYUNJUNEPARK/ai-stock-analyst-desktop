import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { useApp } from '../../context/AppContext'
import NavBar from '../../components/NavBar'
import ReportSidePanel from '../../components/ReportSidePanel'
import { ROUTES } from '../../routes'
import developerInfo from '../../data/developer-info.json'

const DEV_PREVIEW_PROMPT = '삼성전자'

export default function InfoPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, currentPrompt, setCurrentPrompt } = useApp()
  const [modelName, setModelName] = useState<string | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] SettingsPage 렌더링')
  }, [])

  useEffect(() => {
    if (!selectedModel) return
    setModelLoading(true)
    setModelName(null)
    window.api.getModelInfo(selectedModel)
      .then((result) => setModelName(result.modelName))
      .finally(() => setModelLoading(false))
  }, [selectedModel])

  useEffect(() => {
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
    }
  }, [navigate, selectedModel])

  function openPanel(): void {
    setIsPanelOpen(true)
  }

  function closePanel(): void {
    setIsPanelOpen(false)
  }

  if (!selectedModel) return <></>

  function handleOpenInvestmentGuide(): void {
    void window.api.openGuideWindow('investment')
  }

  function handleOpenValuationGuide(): void {
    void window.api.openGuideWindow('valuation')
  }

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

  const modelNameBadgeStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '2px 7px',
    fontFamily: "'SF Mono', 'Menlo', monospace",
    verticalAlign: 'middle'
  }

  const modelLabel = isGpt ? 'GPT' : 'Claude'
  const modelDescription = modelLoading ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={spinnerStyle} />
      모델 정보를 확인하고 있습니다...
    </span>
  ) : modelName ? (
    <span>
      <span style={modelNameBadgeStyle}>{modelName}</span>
      {' 기반으로 분석을 실행합니다.'}
    </span>
  ) : (
    `${modelLabel} 기반으로 분석을 실행합니다.`
  )

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.PROMPT)} />

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <section className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 12
              }}
            >
              현재 모델
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {modelDescription}
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18 }}>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 12
              }}
            >
              빠른 작업
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={openPanel} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>이전 보고서 확인</div>
                  <div style={settingsRowDescStyle}>저장된 분석 보고서 목록을 확인합니다.</div>
                </div>
                <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </button>
            </div>
          </section>

          <section className="card" style={{ padding: 18, marginTop: 14 }}>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 12
              }}
            >
              투자 가이드
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={handleOpenValuationGuide} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>투자 지표 용어 사전</div>
                  <div style={settingsRowDescStyle}>
                    PER·PBR·ROE·부채비율 등 핵심 지표의 개념과 해석 기준을 확인합니다.
                  </div>
                </div>
                <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </button>
              <button onClick={handleOpenInvestmentGuide} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>투자 유형 분류 기준</div>
                  <div style={settingsRowDescStyle}>
                    성장형·가치형 등 투자 유형 분류에 사용되는 판단 기준을 확인합니다.
                  </div>
                </div>
                <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </button>
            </div>
          </section>

          <section className="card" style={{ padding: 18, marginTop: 14 }}>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 12
              }}
            >
              개발자 정보
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={settingsRowTitleStyle}>이름</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  {developerInfo.name}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={settingsRowTitleStyle}>GitHub</div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                    fontFamily: "'SF Mono', 'Menlo', monospace"
                  }}
                >
                  {developerInfo.github}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={settingsRowTitleStyle}>이메일</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  {developerInfo.email}
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18, marginTop: 14 }}>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 12
              }}
            >
              앱 정보
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={settingsRowTitleStyle}>버전</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={testBadgeStyle}>TEST</span>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  v{__APP_VERSION__}
                </div>
              </div>
            </div>
          </section>

          {import.meta.env.DEV && (
            <section className="card" style={{ padding: 18, marginTop: 14 }}>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 12
                }}
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
      <ReportSidePanel isOpen={isPanelOpen} onClose={closePanel} />
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

const testBadgeStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: '#3b82f6',
  background: 'rgba(59, 130, 246, 0.1)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: 6,
  padding: '2px 7px',
  fontFamily: "'SF Mono', 'Menlo', monospace",
  letterSpacing: '0.04em'
}

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 14,
  height: 14,
  border: '2px solid var(--border)',
  borderTopColor: 'var(--text-tertiary)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite'
}
