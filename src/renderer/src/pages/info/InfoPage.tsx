import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { useApp } from '../../context/AppContext'
import NavBar from '../../components/NavBar'
import ReportSidePanel from '../../components/ReportSidePanel'
import { ROUTES } from '../../routes'
import developerInfo from '../../data/developer-info.json'
import './InfoPage.css'

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
    window.api
      .getModelInfo(selectedModel)
      .then((result) => setModelName(result.modelName))
      .finally(() => setModelLoading(false))
  }, [selectedModel])

  useEffect(() => {
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
    }
  }, [navigate, selectedModel])

  if (!selectedModel) return <></>

  const isGpt = selectedModel === 'gpt'
  const modelLabel = isGpt ? 'GPT' : 'Claude'

  function handleOpenInvestmentGuide(): void {
    void window.api.openGuideWindow('investment')
  }

  function handleOpenValuationGuide(): void {
    void window.api.openGuideWindow('valuation')
  }

  function handleOpenTechnicalAnalysisGuide(): void {
    void window.api.openGuideWindow('technical-analysis')
  }

  function navigatePreview(previewStatus: string): void {
    const previewPrompt = currentPrompt.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate(ROUTES.RESPONSE, {
      state: { previewOnly: true, previewStatus, model: selectedModel, prompt: previewPrompt }
    })
  }

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.PROMPT)} />

      <div className="page-content">
        <div className="info-page">
          {/* ── 현재 모델 ── */}
          <section className="info-section">
            <h2 className="info-section-header">현재 모델</h2>
            <div className="info-group">
              <div className="info-row">
                <span className="info-row-label">모델</span>
                <span className="info-row-value">
                  {modelLoading ? (
                    <span className="info-row-loading">
                      <span className="info-spinner" />
                      확인 중...
                    </span>
                  ) : modelName ? (
                    <span className="info-model-badge">{modelName}</span>
                  ) : (
                    modelLabel
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* ── 빠른 작업 ── */}
          <section className="info-section">
            <h2 className="info-section-header">빠른 작업</h2>
            <div className="info-group">
              <button className="info-row info-row--tap" onClick={() => setIsPanelOpen(true)}>
                <span className="info-row-label">이전 보고서 확인</span>
                <FiChevronRight className="info-row-chevron" />
              </button>
            </div>
          </section>

          {/* ── 투자 가이드 ── */}
          <section className="info-section">
            <h2 className="info-section-header">투자 가이드</h2>
            <div className="info-group">
              <button className="info-row info-row--tap" onClick={handleOpenValuationGuide}>
                <div className="info-row-body">
                  <span className="info-row-label">투자 지표 용어 사전</span>
                  <span className="info-row-desc">
                    PER·PBR·ROE·부채비율 등 핵심 지표의 개념과 해석 기준
                  </span>
                </div>
                <FiChevronRight className="info-row-chevron" />
              </button>

              <div className="info-row-separator" />

              <button className="info-row info-row--tap" onClick={handleOpenTechnicalAnalysisGuide}>
                <div className="info-row-body">
                  <span className="info-row-label">기술적 분석 용어 사전</span>
                  <span className="info-row-desc">
                    이동평균선·RSI·MACD·볼린저밴드 등 기술적 분석 지표
                  </span>
                </div>
                <FiChevronRight className="info-row-chevron" />
              </button>

              <div className="info-row-separator" />

              <button className="info-row info-row--tap" onClick={handleOpenInvestmentGuide}>
                <div className="info-row-body">
                  <span className="info-row-label">투자 유형 분류 기준</span>
                  <span className="info-row-desc">
                    성장형·가치형 등 투자 유형 분류에 사용되는 판단 기준
                  </span>
                </div>
                <FiChevronRight className="info-row-chevron" />
              </button>
            </div>
          </section>

          {/* ── 개발자 정보 ── */}
          <section className="info-section">
            <h2 className="info-section-header">개발자 정보</h2>
            <div className="info-group">
              <div className="info-row">
                <span className="info-row-label">이름</span>
                <span className="info-row-value">{developerInfo.name}</span>
              </div>
              <div className="info-row-separator" />
              <div className="info-row">
                <span className="info-row-label">GitHub</span>
                <span className="info-row-value info-row-value--mono">{developerInfo.github}</span>
              </div>
              <div className="info-row-separator" />
              <div className="info-row">
                <span className="info-row-label">이메일</span>
                <span className="info-row-value">{developerInfo.email}</span>
              </div>
            </div>
          </section>

          {/* ── 앱 정보 ── */}
          <section className="info-section">
            <h2 className="info-section-header">앱 정보</h2>
            <div className="info-group">
              <div className="info-row">
                <span className="info-row-label">버전</span>
                <span className="info-row-value">
                  <span className="info-test-badge">TEST</span>
                  v{__APP_VERSION__}
                </span>
              </div>
            </div>
          </section>

          {/* ── 개발용 미리보기 (DEV only) ── */}
          {import.meta.env.DEV && (
            <section className="info-section">
              <h2 className="info-section-header">개발용 미리보기</h2>
              <div className="info-group">
                <button className="info-row info-row--tap" onClick={() => navigatePreview('done')}>
                  <div className="info-row-body">
                    <span className="info-row-label">응답 완료 화면</span>
                    <span className="info-row-desc">완료 상태의 화면을 개발용 데이터로 확인</span>
                  </div>
                  <FiChevronRight className="info-row-chevron" />
                </button>

                <div className="info-row-separator" />

                <button
                  className="info-row info-row--tap"
                  onClick={() => navigatePreview('streaming')}
                >
                  <div className="info-row-body">
                    <span className="info-row-label">처리 중 화면</span>
                    <span className="info-row-desc">스트리밍 진행 중 상태 확인</span>
                  </div>
                  <FiChevronRight className="info-row-chevron" />
                </button>

                <div className="info-row-separator" />

                <button
                  className="info-row info-row--tap"
                  onClick={() => navigatePreview('error')}
                >
                  <div className="info-row-body">
                    <span className="info-row-label">분석 실패 화면</span>
                    <span className="info-row-desc">에러 상태 화면 확인</span>
                  </div>
                  <FiChevronRight className="info-row-chevron" />
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <ReportSidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </div>
  )
}
