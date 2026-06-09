import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiLogOut } from 'react-icons/fi'
import { useApp } from '../../context/AppContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import NavBar from '../../components/NavBar'
import ReportSidePanel from '../../components/ReportSidePanel'
import ConfirmDialog from '../../components/ConfirmDialog'
import { ROUTES } from '../../routes'
import { MARKET_OPTIONS, MARKET_STORAGE_KEY, isValidMarket } from '../../data/market'
import type { Market } from '../../data/market'
import { gptIcon, claudeIcon } from '../../assets'
import developerInfo from '../../data/developer-info.json'
import './InfoPage.css'

/** 개발 미리보기에서 프롬프트가 비어 있을 때 사용하는 기본 종목명 */
const DEV_PREVIEW_PROMPT = '삼성전자'

/** getModelInfo 응답을 어떤 모델에 대해 받았는지 추적하기 위한 타입 */
type LoadedModelInfo = {
  model: 'gpt' | 'claude'
  modelName: string | null
}

export default function InfoPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, setSelectedModel, currentPrompt, setCurrentPrompt } = useApp()
  const [loadedModelInfo, setLoadedModelInfo] = useState<LoadedModelInfo | null>(null)
  const [market, setMarket] = useLocalStorage<Market>(MARKET_STORAGE_KEY, 'auto', isValidMarket)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)

  // 개발 환경에서만 페이지 마운트 로그 출력
  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] SettingsPage 렌더링')
  }, [])

  // 선택된 모델이 변경될 때 CLI를 통해 모델 상세 정보(이름)를 조회한다.
  // 단, 컴포넌트가 리마운트되면 loadedModelInfo가 null로 초기화되므로
  // 같은 모델이라도 페이지 재진입 시 다시 호출된다.
  // 언마운트 시 isCancelled 플래그로 stale 응답을 무시한다.
  useEffect(() => {
    if (!selectedModel) return
    let isCancelled = false

    window.api
      .getModelInfo(selectedModel)
      .then((result) => {
        if (!isCancelled) {
          setLoadedModelInfo({ model: selectedModel, modelName: result.modelName })
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLoadedModelInfo({ model: selectedModel, modelName: null })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedModel])

  // 모델이 선택되지 않은 상태로 접근하면 모델 선택 화면으로 리다이렉트
  useEffect(() => {
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
    }
  }, [navigate, selectedModel])

  // 리다이렉트 중에는 빈 화면 렌더링 (위 useEffect에서 ROOT로 이동 처리)
  if (!selectedModel) return <></>

  const isGpt = selectedModel === 'gpt'
  const modelLabel = isGpt ? 'GPT' : 'Claude'
  // 조회 완료된 모델 정보가 현재 선택된 모델과 일치할 때만 이름을 표시
  const modelName = loadedModelInfo?.model === selectedModel ? loadedModelInfo.modelName : null
  // 아직 현재 모델에 대한 조회 응답이 오지 않았으면 로딩 상태로 처리
  const modelLoading = loadedModelInfo?.model !== selectedModel

  // 각 가이드 버튼 클릭 시 별도 윈도우로 가이드 페이지를 연다
  function handleOpenInvestmentGuide(): void {
    void window.api.openGuideWindow('investment')
  }

  function handleOpenValuationGuide(): void {
    void window.api.openGuideWindow('valuation')
  }

  function handleOpenTechnicalAnalysisGuide(): void {
    void window.api.openGuideWindow('technical-analysis')
  }

  // 개발 미리보기: 특정 상태(done/streaming/error)의 응답 화면으로 이동한다.
  // 현재 프롬프트가 비어 있으면 DEV_PREVIEW_PROMPT를 기본값으로 사용한다.
  function navigatePreview(previewStatus: string): void {
    const previewPrompt = currentPrompt.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate(ROUTES.RESPONSE, {
      state: { previewOnly: true, previewStatus, model: selectedModel, prompt: previewPrompt }
    })
  }

  // 개발 미리보기: CLI 설치 실패 상태의 다운로드 화면으로 이동한다.
  function navigateInstallFailurePreview(): void {
    navigate(ROUTES.DOWNLOAD, {
      state: { previewOnly: true, previewStatus: 'install-error' }
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
                  ) : (
                    <>
                      <img
                        className="info-model-icon"
                        src={isGpt ? gptIcon : claudeIcon}
                        alt={modelLabel}
                      />
                      {modelName ? (
                        <span className="info-model-badge">{modelName}</span>
                      ) : (
                        modelLabel
                      )}
                    </>
                  )}
                </span>
              </div>
              <div className="info-row-separator" />
              <button className="info-row info-row--tap info-row--disconnect" onClick={() => setIsDisconnectDialogOpen(true)}>
                <span className="info-row-label">세션 연결 해제</span>
                <FiLogOut className="info-row-chevron" />
              </button>
            </div>
          </section>

          {/* ── 시장 설정 ── */}
          <section className="info-section">
            <h2 className="info-section-header">시장 설정</h2>
            <div className="info-group">
              <div className="info-row">
                <span className="info-row-label">분석 시장</span>
                <div className="info-market-toggle">
                  {MARKET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`info-market-btn${market === opt.value ? ' info-market-btn--active' : ''}`}
                      onClick={() => setMarket(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                  <span className="info-test-badge">TEST</span>v{__APP_VERSION__}
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

                <button className="info-row info-row--tap" onClick={() => navigatePreview('error')}>
                  <div className="info-row-body">
                    <span className="info-row-label">분석 실패 화면</span>
                    <span className="info-row-desc">에러 상태 화면 확인</span>
                  </div>
                  <FiChevronRight className="info-row-chevron" />
                </button>

                <div className="info-row-separator" />

                <button className="info-row info-row--tap" onClick={navigateInstallFailurePreview}>
                  <div className="info-row-body">
                    <span className="info-row-label">설치 실패 화면</span>
                    <span className="info-row-desc">CLI 설치 실패 상태 화면 확인</span>
                  </div>
                  <FiChevronRight className="info-row-chevron" />
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <ReportSidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />

      {isDisconnectDialogOpen && (
        <ConfirmDialog
          title="세션 연결 해제"
          message={`현재 모델과의 세션을 해제합니다. 해제 후 다시 인증이 필요합니다.`}
          confirmLabel="연결 해제"
          cancelLabel="취소"
          onConfirm={async () => {
            const result = await window.api.clearAuth(selectedModel)
            setIsDisconnectDialogOpen(false)
            if (result.success) {
              setSelectedModel(null)
              navigate(ROUTES.ROOT)
            }
          }}
          onCancel={() => setIsDisconnectDialogOpen(false)}
        />
      )}
    </div>
  )
}
