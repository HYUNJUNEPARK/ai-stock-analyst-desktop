import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import claudeImg from '../../assets/claude.png'
import NavBar from '../../components/NavBar'
import gptImg from '../../assets/gpt.jpg'
import { useApp } from '../../context/AppContext'
import ResponseCard from './components/ResponseCard'
import { AGENT_CONFIG, DEV_PREVIEW_RESPONSE } from './constants'
import type { AgentStatus, ResponseLocationState, Status } from './types'
import { ROUTES } from '../../routes'

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

          <ResponseCard
            agentStatuses={agentStatuses}
            errorMsg={errorMsg}
            model={effectiveModel}
            modelImg={modelImg}
            modelLabel={modelLabel}
            onCancel={handleCancel}
            onRetry={handleRetry}
            onViewReport={() => navigate(ROUTES.REPORTS_LATEST)}
            response={response}
            status={status}
          />
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
