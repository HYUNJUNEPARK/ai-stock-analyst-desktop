import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import claudeImg from '../../assets/claude.png'
import NavBar from '../../components/NavBar'
import gptImg from '../../assets/gpt.jpg'
import { useApp } from '../../context/AppContext'
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
  const { selectedModel, currentPrompt, setLastResponse } = useApp()
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
  const [errorMsg, setErrorMsg] = useState('')
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(() =>
    getPreviewAgentStatuses(isPreviewOnly, previewStatus)
  )
  const responseRef = useRef(initialResponse)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    console.log('[Page] ResponsePage 렌더링')
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

      window.api.onStockAnalysisDone((result: { success: boolean; error?: string }) => {
        if (result.success) {
          setStatus('done')
          setLastResponse(responseRef.current)
        } else {
          setStatus('error')
          setErrorMsg(result.error ?? '분석에 실패했습니다.')
        }
      })

      window.api.runStockAnalysis({ model: effectiveModel, prompt: effectivePrompt })
    } else {
      window.api.onResponseChunk((chunk: string) => {
        responseRef.current += chunk
        setResponse(responseRef.current)
      })

      window.api.onResponseDone((result: { success: boolean; error?: string }) => {
        if (result.success) {
          setStatus('done')
          setLastResponse(responseRef.current)
        } else {
          setStatus('error')
          setErrorMsg(result.error ?? '응답을 가져오지 못했습니다.')
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
      window.api.runStockAnalysis({ model: effectiveModel, prompt: effectivePrompt })
    } else {
      window.api.runPrompt({ model: effectiveModel, prompt: effectivePrompt })
    }
  }

  const modelLabel = effectiveModel === 'gpt' ? 'GPT' : 'Claude'
  const modelImg = effectiveModel === 'gpt' ? gptImg : claudeImg

  const isStreamingEmpty = status === 'streaming' && !response
  const contentMinHeight = status === 'done' ? 216 : 260
  const isCancelled = status === 'cancelled'
  const isError = status === 'error'
  const doneCount = Object.values(agentStatuses).filter((s) => s === 'done').length
  const totalCount = AGENT_CONFIG.length
  const progressPct = Math.round((doneCount / totalCount) * 100)
  const showProgress = status === 'streaming' && progressPct < 100

  const circleSize = 28
  const radius = 10
  const progressColor =
    doneCount === 0
      ? 'var(--text-tertiary)'
      : doneCount === 1
        ? '#4A90E2'
        : doneCount === 2
          ? '#9B59B6'
          : '#E67E22'

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.PROMPT)} disabled={status === 'streaming'} />

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          {/* 사용자가 입력한 프롬프트를 말풍선 형태로 오른쪽에 표시 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 16px',
                height: 48,
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <img
                src={modelImg}
                alt={modelLabel}
                style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  flexShrink: 0
                }}
              >
                {modelLabel}
              </span>

              {showProgress && (
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                  <svg
                    width={circleSize}
                    height={circleSize}
                    style={{ animation: 'spin 1s linear infinite', display: 'block' }}
                  >
                    <circle
                      cx={circleSize / 2}
                      cy={circleSize / 2}
                      r={radius}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth={3}
                    />
                    <circle
                      cx={circleSize / 2}
                      cy={circleSize / 2}
                      r={radius}
                      fill="none"
                      stroke={progressColor}
                      strokeWidth={3}
                      strokeDasharray={`${2 * Math.PI * radius * 0.25} ${2 * Math.PI * radius * 0.75}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke 0.4s ease' }}
                    />
                  </svg>
                </div>
              )}
            </div>

            <div
              style={{ padding: 16, minHeight: contentMinHeight, position: 'relative' }}
              role="article"
            >
              {/* 분석 취소 */}
              {isCancelled && <AnalysisCancelledView onRetry={handleRetry} />}

              {/* 에러 */}
              {isError && <ErrorResponseView errorMsg={errorMsg} onRetry={handleRetry} />}

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
      </div>
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

  return Object.fromEntries(
    AGENT_CONFIG.map((agent, index) => [agent.key, index === 0 ? 'running' : 'idle'])
  )
}

function isStockAnalysisModel(model: string | null): model is 'gpt' | 'claude' {
  return model === 'claude' || model === 'gpt'
}
