import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import claudeImg from '../../assets/claude.png'
import gptImg from '../../assets/gpt.jpg'
import PageFooter from '../../components/PageFooter'
import { useApp } from '../../context/AppContext'
import PromptBubble from './components/PromptBubble'
import ResponseCard from './components/ResponseCard'
import { AGENT_CONFIG, DEV_PREVIEW_RESPONSE } from './constants'
import type { AgentStatus, ResponseLocationState, Status } from './types'

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
  const apiKey = ''
  const initialResponse = isPreviewOnly && previewStatus === 'done' ? DEV_PREVIEW_RESPONSE : ''
  const [response, setResponse] = useState(initialResponse)
  const [status, setStatus] = useState<Status>(isPreviewOnly ? previewStatus : 'streaming')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(() =>
    getPreviewAgentStatuses(isPreviewOnly, previewStatus)
  )
  const responseRef = useRef(initialResponse)
  const hasStartedRef = useRef(false)

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
      navigate('/')
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

      window.api.runStockAnalysis({ model: effectiveModel, prompt: effectivePrompt, apiKey })
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

      window.api.runPrompt({ model: effectiveModel, prompt: effectivePrompt, apiKey })
    }
  }, [effectiveModel, effectivePrompt, isPreviewOnly, navigate, previewStatus, setLastResponse])

  function handleCopy(): void {
    navigator.clipboard.writeText(responseRef.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

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
      navigate('/')
      return
    }

    if (isStockAnalysisModel(effectiveModel)) {
      window.api.runStockAnalysis({ model: effectiveModel, prompt: effectivePrompt, apiKey })
    } else {
      window.api.runPrompt({ model: effectiveModel, prompt: effectivePrompt, apiKey })
    }
  }

  const modelLabel = effectiveModel === 'gpt' ? 'OpenAI Codex' : 'Claude Code'
  const modelImg = effectiveModel === 'gpt' ? gptImg : claudeImg

  return (
    <div className="page">
      <nav className="nav-bar">
        <button
          className="nav-back"
          onClick={() => navigate('/prompt')}
          disabled={status === 'streaming'}
          aria-label="뒤로"
        >
          <svg viewBox="0 0 18 18">
            <polyline points="12,3 6,9 12,15" />
          </svg>
          뒤로
        </button>
      </nav>

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <PromptBubble prompt={effectivePrompt} />

          <ResponseCard
            agentStatuses={agentStatuses}
            copied={copied}
            errorMsg={errorMsg}
            model={effectiveModel}
            modelImg={modelImg}
            modelLabel={modelLabel}
            onCancel={handleCancel}
            onCopy={handleCopy}
            response={response}
            status={status}
          />

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
              <button className="btn-primary danger" onClick={handleRetry}>
                다시 시도
              </button>
            </div>
          )}

          {status === 'cancelled' && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                textAlign: 'center'
              }}
            >
              분석을 취소했습니다.
            </div>
          )}
        </div>
      </div>

      {(status === 'done' || status === 'error' || status === 'cancelled') && (
        <PageFooter>
          {status === 'cancelled' && (
            <button className="btn-ghost" onClick={handleRetry} style={{ marginRight: 8 }}>
              다시 시도
            </button>
          )}
        </PageFooter>
      )}
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
