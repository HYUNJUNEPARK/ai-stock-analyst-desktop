import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PageFooter from '../components/PageFooter'
import claudeImg from '../assets/claude.png'
import gptImg from '../assets/gpt.jpg'

type Status = 'streaming' | 'done' | 'error' | 'cancelled'
type AgentStatus = 'idle' | 'running' | 'done'
type PreviewModel = 'gpt' | 'claude'
type ResponseLocationState = {
  previewOnly?: boolean
  model?: PreviewModel
  prompt?: string
} | null

const AGENT_CONFIG: { key: string; label: string }[] = [
  { key: 'financial-analyst-kr', label: '재무 분석' },
  { key: 'news-sentiment-analyst', label: '뉴스 분석' },
  { key: 'sector-researcher', label: '섹터 리서치' },
  { key: 'aggressive-investment-strategist', label: '투자 전략' }
]

const DEV_PREVIEW_RESPONSE = `# 개발 미리보기 리포트
## 요약
이 화면은 개발 환경에서 UI 확인만 하기 위한 샘플 응답입니다.

### 핵심 포인트
- 실제 CLI 또는 API 호출은 실행하지 않습니다.
- 스트리밍 완료 상태와 레이아웃을 확인할 수 있습니다.
- 복사 버튼과 새 질문 버튼의 배치를 확인할 수 있습니다.

> 프롬프트 입력 화면의 개발 전용 버튼으로 진입한 경우에만 표시됩니다.
`

export default function ResponsePage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModel, currentPrompt, setCurrentPrompt, setLastResponse } = useApp()
  const previewState = import.meta.env.DEV ? (location.state as ResponseLocationState) : null
  const isPreviewOnly = previewState?.previewOnly === true
  const effectiveModel = isPreviewOnly ? (previewState?.model ?? selectedModel ?? 'gpt') : selectedModel
  const effectivePrompt = isPreviewOnly ? (previewState?.prompt ?? currentPrompt) : currentPrompt
  const apiKey = ''
  const [response, setResponse] = useState('')
  const [status, setStatus] = useState<Status>('streaming')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(
    () => Object.fromEntries(AGENT_CONFIG.map((a) => [a.key, 'idle']))
  )
  const responseRef = useRef('')

  useEffect(() => {
    if (isPreviewOnly) {
      responseRef.current = DEV_PREVIEW_RESPONSE
      setResponse(DEV_PREVIEW_RESPONSE)
      setStatus('done')
      setAgentStatuses(Object.fromEntries(AGENT_CONFIG.map((a) => [a.key, 'done'])))
      setLastResponse(DEV_PREVIEW_RESPONSE)
      return
    }

    if (!effectiveModel || !effectivePrompt) {
      navigate('/')
      return
    }

    if (effectiveModel === 'claude' || effectiveModel === 'gpt') {
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
  }, [])

  function handleCopy(): void {
    navigator.clipboard.writeText(responseRef.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleNewQuestion(): void {
    setCurrentPrompt('')
    navigate('/prompt')
  }

  function handleCancel(): void {
    window.api.cancelStockAnalysis()
    setStatus('cancelled')
  }

  function handleRetry(): void {
    setStatus('streaming')
    setResponse('')
    responseRef.current = ''
    setErrorMsg('')
    setAgentStatuses(Object.fromEntries(AGENT_CONFIG.map((a) => [a.key, 'idle'])))

    if (isPreviewOnly) {
      responseRef.current = DEV_PREVIEW_RESPONSE
      setResponse(DEV_PREVIEW_RESPONSE)
      setStatus('done')
      setAgentStatuses(Object.fromEntries(AGENT_CONFIG.map((a) => [a.key, 'done'])))
      return
    }

    if (effectiveModel === 'claude' || effectiveModel === 'gpt') {
      window.api.runStockAnalysis({ model: effectiveModel!, prompt: effectivePrompt, apiKey })
    } else {
      window.api.runPrompt({ model: effectiveModel!, prompt: effectivePrompt, apiKey })
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
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="model-badge">
            <img src={modelImg} alt={modelLabel} style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }} />
            {modelLabel}
          </div>
        </div>
      </nav>

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          {(effectiveModel === 'claude' || effectiveModel === 'gpt') && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                flexWrap: 'wrap'
              }}
            >
              {AGENT_CONFIG.map((agent) => {
                const agentStatus = agentStatuses[agent.key] ?? 'idle'
                return (
                  <div
                    key={agent.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 20,
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                      border: '1px solid var(--border)',
                      background:
                        agentStatus === 'done'
                          ? 'var(--success)'
                          : agentStatus === 'running'
                            ? 'var(--accent-light)'
                            : 'var(--bg-secondary)',
                      color:
                        agentStatus === 'done'
                          ? '#fff'
                          : agentStatus === 'running'
                            ? 'var(--accent)'
                            : 'var(--text-tertiary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {agentStatus === 'running' && (
                      <div className="spinner" style={{ width: 10, height: 10 }} />
                    )}
                    {agentStatus === 'done' && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" />
                      </svg>
                    )}
                    {agent.label}
                  </div>
                )
              })}
            </div>
          )}

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
                  color: 'var(--text-secondary)'
                }}
              >
                {modelLabel}
              </span>

              {status === 'streaming' && (
                <div className="spinner" style={{ marginLeft: 'auto' }} aria-label="응답 생성 중" />
              )}
            </div>

            <div style={{ padding: 16 }} role="article" aria-label="AI 응답">
              {status === 'streaming' && !response && (
                <div
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                    fontStyle: 'italic'
                  }}
                >
                  {effectiveModel === 'claude' || effectiveModel === 'gpt'
                    ? (() => {
                        const running = AGENT_CONFIG.find((a) => agentStatuses[a.key] === 'running')
                        const doneCount = AGENT_CONFIG.filter((a) => agentStatuses[a.key] === 'done').length
                        if (running) return `${running.label} 진행 중...`
                        if (doneCount === 3) return '투자 전략 종합 중...'
                        if (doneCount > 0) return `분석 완료 ${doneCount}/3, 다음 에이전트 대기 중...`
                        return '에이전트 초기화 중...'
                      })()
                    : '응답을 생성 중입니다...'}
                </div>
              )}

              {(response || status !== 'streaming') && (
                <MarkdownRenderer text={response} isStreaming={status === 'streaming'} />
              )}

              {status === 'error' && (
                <div className="error-banner" style={{ marginTop: response ? 16 : 0 }}>
                  {errorMsg}
                </div>
              )}
            </div>

            {status === 'done' && (
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '0 10px',
                  height: 44,
                  borderTop: '1px solid var(--border)',
                  alignItems: 'center'
                }}
              >
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    fontSize: 'var(--text-xs)',
                    color: copied ? 'var(--success)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    transition: 'background 0.15s, color 0.15s'
                  }}
                  aria-label="응답 복사"
                >
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
            )}
          </div>

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
              분석이 취소되었습니다.
            </div>
          )}
        </div>
      </div>

      {status === 'streaming' && (effectiveModel === 'claude' || effectiveModel === 'gpt') && (
        <PageFooter>
          <button className="btn-ghost" onClick={handleCancel} aria-label="분석 취소">
            분석 취소
          </button>
        </PageFooter>
      )}

      {(status === 'done' || status === 'error' || status === 'cancelled') && (
        <PageFooter>
          {status === 'cancelled' && (
            <button className="btn-ghost" onClick={handleRetry} style={{ marginRight: 8 }}>
              다시 시도
            </button>
          )}
          <button className="btn-primary" onClick={handleNewQuestion}>
            + 새 질문하기
          </button>
        </PageFooter>
      )}
    </div>
  )
}

function MarkdownRenderer({
  text,
  isStreaming
}: {
  text: string
  isStreaming: boolean
}): React.JSX.Element {
  const lines = text.split('\n')
  const elements: React.JSX.Element[] = []
  let codeBlock: string[] = []
  let codeLang = ''
  let inCode = false
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
        codeBlock = []
      } else {
        elements.push(
          <CodeBlock key={key++} lang={codeLang} code={codeBlock.join('\n')} />
        )
        inCode = false
        codeBlock = []
        codeLang = ''
      }
      continue
    }

    if (inCode) {
      codeBlock.push(line)
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} style={{ fontSize: 15, fontWeight: 600, margin: '12px 0 6px', color: 'var(--text-primary)' }}>
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} style={{ fontSize: 17, fontWeight: 600, margin: '16px 0 8px', color: 'var(--text-primary)' }}>
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} style={{ fontSize: 20, fontWeight: 700, margin: '20px 0 10px', color: 'var(--text-primary)' }}>
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={key++}
          style={{
            borderLeft: '3px solid var(--accent)',
            margin: '0 0 12px',
            padding: '4px 0 4px 14px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}
        >
          {line.slice(2)}
        </blockquote>
      )
    } else if (line.match(/^[-*]\s/)) {
      elements.push(
        <div
          key={key++}
          style={{ paddingLeft: 16, marginBottom: 4, color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}
        >
          • {renderInline(line.slice(2))}
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 8 }} />)
    } else {
      elements.push(
        <p
          key={key++}
          style={{ marginBottom: 12, color: 'var(--text-primary)', fontSize: 'var(--text-base)', lineHeight: 1.7 }}
        >
          {renderInline(line)}
        </p>
      )
    }
  }

  if (inCode && codeBlock.length > 0) {
    elements.push(
      <CodeBlock key={key++} lang={codeLang} code={codeBlock.join('\n')} />
    )
  }

  return (
    <div className="markdown-body" style={{ userSelect: 'text' }}>
      {elements}
      {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 4,
            padding: '2px 6px',
            fontFamily: "'SF Mono', 'Menlo', monospace",
            fontSize: 13,
            color: '#D73A49',
            userSelect: 'text'
          }}
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function CodeBlock({ lang, code }: { lang: string; code: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  function handleCopy(): void {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{lang || 'code'}</span>
        <button className="code-copy-btn" onClick={handleCopy}>
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <div className="code-body">{code}</div>
    </div>
  )
}
