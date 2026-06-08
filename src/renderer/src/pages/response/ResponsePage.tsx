import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiBookOpen, FiFileText, FiPieChart } from 'react-icons/fi'
import NavBar from '../../components/NavBar'
import ReportSidePanel from '../../components/ReportSidePanel'
import { useApp } from '../../context/AppContext'
import { marketKrIcon, marketUsIcon } from '../../assets'
import { AGENT_CONFIG, DEV_PREVIEW_RESPONSE } from './constants'
import type { AgentStatus, ResponseLocationState, Status } from './types'
import { ROUTES } from '../../routes'
import AnalysisCancelledView from './components/AnalysisCancelledView'
import AnalysisCompleteView from './components/AnalysisCompleteView'
import AnalysisProgressView from './components/AnalysisProgressView'
import ErrorResponseView from './components/ErrorResponseView'

export default function ResponsePage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModel, setSelectedModel, currentPrompt, currentMarket, setLastResponse } = useApp()
  const previewState = import.meta.env.DEV ? (location.state as ResponseLocationState) : null
  const isPreviewOnly = previewState?.previewOnly === true
  const previewStatus = previewState?.previewStatus ?? 'done'
  const effectiveModel = isPreviewOnly
    ? (previewState?.model ?? selectedModel ?? 'gpt')
    : selectedModel
  const effectivePrompt = isPreviewOnly ? (previewState?.prompt ?? currentPrompt) : currentPrompt
  const initialResponse = isPreviewOnly && previewStatus === 'done' ? DEV_PREVIEW_RESPONSE : ''
  const [response, setResponse] = useState(initialResponse)
  const [status, setStatus] = useState<Status>(isPreviewOnly ? previewStatus : 'streaming')
  const [errorMsg, setErrorMsg] = useState(
    isPreviewOnly && previewStatus === 'error' ? '개발용 미리보기: 분석 실패 상태입니다.' : ''
  )
  const [errorLog, setErrorLog] = useState(
    isPreviewOnly && previewStatus === 'error'
      ? '[start] financial-analyst-kr\n[done] financial-analyst-kr\n[start] sector-researcher\n[실패] sector-researcher\n[경고] 업종 분석 에이전트 실패. 해당 데이터 없이 계속 진행합니다.\n[start] news-sentiment-analyst\n[done] news-sentiment-analyst\n[start] price-analyst\n[done] price-analyst\n[start] valuation-analyst\n[done] valuation-analyst\n[start] invest-type-classifier\n[done] invest-type-classifier\n[start] aggressive-investment-strategist\n[실패] aggressive-investment-strategist: 타임아웃: 600초 초과\n[error] 분석에 실패하였습니다. 최종 투자 전략을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.\n[error] 프로세스 비정상 종료 (exit code: 1)'
      : ''
  )
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(() =>
    getPreviewAgentStatuses(isPreviewOnly, previewStatus)
  )
  const [authRequired, setAuthRequired] = useState(false)
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false)
  const responseRef = useRef(initialResponse)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] ResponsePage 렌더링')
  }, [])

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    if (isPreviewOnly) {
      if (previewStatus === 'done') {
        setLastResponse(DEV_PREVIEW_RESPONSE)
      }
      return
    }

    if (!effectiveModel || !effectivePrompt) {
      navigate(ROUTES.ROOT)
      return
    }

    if (isStockAnalysisModel(effectiveModel)) {
      window.api.onStockAnalysisAgent(({ name, status: agentStatus }) => {
        setAgentStatuses((prev) => ({ ...prev, [name]: agentStatus }))
      })

      window.api.onStockAnalysisChunk((chunk: string) => {
        responseRef.current += chunk
        setResponse(responseRef.current)
      })

      window.api.onStockAnalysisDone((result: { success: boolean; error?: string; errorLog?: string; authRequired?: boolean }) => {
        if (result.success) {
          setStatus('done')
          setLastResponse(responseRef.current)
        } else {
          setStatus('error')
          setErrorMsg(result.error ?? '분석에 실패했습니다.')
          setErrorLog(result.errorLog ?? '')
          setAuthRequired(result.authRequired === true)
        }
      })

      window.api.runStockAnalysis({ model: effectiveModel, prompt: effectivePrompt, market: currentMarket })
    } else {
      window.api.onResponseChunk((chunk: string) => {
        responseRef.current += chunk
        setResponse(responseRef.current)
      })

      window.api.onResponseDone((result: { success: boolean; error?: string; authRequired?: boolean }) => {
        if (result.success) {
          setStatus('done')
          setLastResponse(responseRef.current)
        } else {
          setStatus('error')
          setErrorMsg(result.error ?? '응답을 가져오지 못했습니다.')
          setAuthRequired(result.authRequired === true)
        }
      })

      window.api.runPrompt({ model: effectiveModel, prompt: effectivePrompt })
    }
  }, [effectiveModel, effectivePrompt, isPreviewOnly, navigate, previewStatus, setLastResponse])

  function handleCancel(): void {
    if (!isPreviewOnly) {
      window.api.cancelStockAnalysis()
    }
    setStatus('cancelled')
  }

  function handleRetry(): void {
    setStatus('streaming')
    setResponse('')
    responseRef.current = ''
    setErrorMsg('')
    setErrorLog('')
    setAuthRequired(false)
    setAgentStatuses(getInitialAgentStatuses('idle'))

    if (isPreviewOnly) {
      const nextResponse = previewStatus === 'done' ? DEV_PREVIEW_RESPONSE : ''
      responseRef.current = nextResponse
      setResponse(nextResponse)
      setStatus(previewStatus)
      setAgentStatuses(getPreviewAgentStatuses(true, previewStatus))
      return
    }

    if (!effectiveModel || !effectivePrompt) {
      navigate(ROUTES.ROOT)
      return
    }

    if (isStockAnalysisModel(effectiveModel)) {
      window.api.runStockAnalysis({ model: effectiveModel, prompt: effectivePrompt, market: currentMarket })
    } else {
      window.api.runPrompt({ model: effectiveModel, prompt: effectivePrompt })
    }
  }

  function openReportPanel(): void {
    setIsReportPanelOpen(true)
  }

  function closeReportPanel(): void {
    setIsReportPanelOpen(false)
  }

  function handleReauthenticate(): void {
    setSelectedModel('gpt')
    navigate(ROUTES.AUTH)
  }


  const isStreamingEmpty = status === 'streaming' && !response
  const contentMinHeight = 260
  const isCancelled = status === 'cancelled'
  const isError = status === 'error'

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.PROMPT)} disabled={status === 'streaming'} />

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20, maxWidth: 760 }}>
          {/* 사용자가 입력한 프롬프트를 말풍선 형태로 오른쪽에 표시 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {(currentMarket === 'kr' || currentMarket === 'us') && (
              <img
                src={currentMarket === 'kr' ? marketKrIcon : marketUsIcon}
                alt={currentMarket === 'kr' ? '한국' : '미국'}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)'
                }}
              />
            )}
            <div
              style={{
                maxWidth: '80%',
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: '18px 18px 4px 18px',
                padding: '12px 16px',
                fontSize: 'var(--text-base)',
                lineHeight: 1.5,
                wordBreak: 'break-word',
                userSelect: 'text'
              }}
            >
              {effectivePrompt}
            </div>
          </div>

          <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div
              style={{ padding: 16, minHeight: contentMinHeight, position: 'relative' }}
              role="article"
            >
              {/* 분석 취소 */}
              {isCancelled && <AnalysisCancelledView onRetry={handleRetry} />}

              {/* 에러 */}
              {isError && (
                <ErrorResponseView
                  errorMsg={errorMsg}
                  errorLog={errorLog}
                  authRequired={authRequired}
                  onRetry={handleRetry}
                  onReauthenticate={handleReauthenticate}
                />
              )}

              {/* 분석 중 */}
              {!isCancelled && !isError && isStreamingEmpty && (
                <AnalysisProgressView
                  agentStatuses={agentStatuses}
                  onCancel={handleCancel}
                  showAgentFlow={isStockAnalysisModel(effectiveModel)}
                />
              )}

              {/* 분석 완료 */}
              {!isCancelled && !isError && status === 'done' && (
                <AnalysisCompleteView onViewReport={() => navigate(ROUTES.REPORTS_LATEST)} />
              )}
            </div>
          </div>
        </div>

        {/* 빠른 이동 링크 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            paddingTop: 10,
            paddingBottom: 4
          }}
        >
          {[
            { icon: <FiFileText size={13} />, label: '이전 보고서', onClick: openReportPanel },
            {
              icon: <FiPieChart size={13} />,
              label: '투자 지표 용어 사전',
              onClick: () => window.api.openGuideWindow('valuation')
            },
            {
              icon: <FiBookOpen size={13} />,
              label: '투자 유형 기준',
              onClick: () => window.api.openGuideWindow('investment')
            }
          ].map(({ icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px 8px',
                borderRadius: 8,
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                fontFamily: 'inherit',
                transition: 'color 0.15s, background 0.15s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent)'
                e.currentTarget.style.background = 'var(--accent-light)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)'
                e.currentTarget.style.background = 'none'
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
      <ReportSidePanel isOpen={isReportPanelOpen} onClose={closeReportPanel} />
    </div>
  )
}

function getInitialAgentStatuses(status: AgentStatus): Record<string, AgentStatus> {
  return Object.fromEntries(AGENT_CONFIG.map((agent) => [agent.key, status]))
}

function getPreviewAgentStatuses(
  isPreviewOnly: boolean,
  previewStatus: Status
): Record<string, AgentStatus> {
  if (!isPreviewOnly) return getInitialAgentStatuses('idle')
  if (previewStatus === 'done') return getInitialAgentStatuses('done')
  if (previewStatus === 'error') return getInitialAgentStatuses('idle')

  return Object.fromEntries(
    AGENT_CONFIG.map((agent, index) => [agent.key, index === 0 ? 'running' : 'idle'])
  )
}

function isStockAnalysisModel(model: string | null): model is 'gpt' | 'claude' {
  return model === 'claude' || model === 'gpt'
}
