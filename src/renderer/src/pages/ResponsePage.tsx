import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PageFooter from '../components/PageFooter'
import claudeImg from '../assets/claude.png'
import gptImg from '../assets/gpt.jpg'

type Status = 'streaming' | 'done' | 'error' | 'cancelled'
type AgentStatus = 'idle' | 'running' | 'done'

const AGENT_CONFIG: { key: string; label: string }[] = [
  { key: 'financial-analyst-kr', label: '재무 분석' },
  { key: 'news-sentiment-analyst', label: '뉴스 분석' },
  { key: 'sector-researcher', label: '섹터 리서치' },
  { key: 'aggressive-investment-strategist', label: '투자 전략' }
]

export default function ResponsePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, apiKey, currentPrompt, setCurrentPrompt, setLastResponse } = useApp()
  const [response, setResponse] = useState('')
  const [status, setStatus] = useState<Status>('streaming')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(
    () => Object.fromEntries(AGENT_CONFIG.map((a) => [a.key, 'idle']))
  )
  const responseRef = useRef('')

  useEffect(() => {
    // 필수 상태 없이 직접 접근하면 홈으로 리다이렉트
    if (!selectedModel || !currentPrompt) {
      navigate('/')
      return
    }

    if (selectedModel === 'claude') {
      // 멀티 에이전트 주식 분석 흐름
      window.api?.onStockAnalysisAgent?.(({ name, status: agentStatus }) => {
        setAgentStatuses((prev) => ({ ...prev, [name]: agentStatus }))
      })

      window.api?.onStockAnalysisChunk?.((chunk: string) => {
        responseRef.current += chunk
        setResponse(responseRef.current)
      })

      window.api?.onStockAnalysisDone?.((result: { success: boolean; error?: string }) => {
        if (result.success) {
          setStatus('done')
          setLastResponse(responseRef.current)
        } else {
          setStatus('error')
          setErrorMsg(result.error ?? '분석에 실패했습니다.')
        }
      })

      window.api?.runStockAnalysis?.({ prompt: currentPrompt, apiKey })
    } else {
      // GPT 단순 프롬프트 흐름
      window.api?.onResponseChunk?.((chunk: string) => {
        responseRef.current += chunk
        setResponse(responseRef.current)
      })

      window.api?.onResponseDone?.((result: { success: boolean; error?: string }) => {
        if (result.success) {
          setStatus('done')
          setLastResponse(responseRef.current)
        } else {
          setStatus('error')
          setErrorMsg(result.error ?? '응답을 가져오지 못했습니다.')
        }
      })

      window.api?.runPrompt?.({ model: selectedModel, prompt: currentPrompt, apiKey })
    }
  }, [])

  // 응답 전체를 클립보드에 복사하고 1.5초 후 버튼 상태를 원래대로 복원
  function handleCopy(): void {
    navigator.clipboard.writeText(responseRef.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // 현재 프롬프트를 초기화하고 질문 입력 화면으로 돌아간다
  function handleNewQuestion(): void {
    setCurrentPrompt('')
    navigate('/prompt')
  }

  function handleCancel(): void {
    window.api?.cancelStockAnalysis?.()
    setStatus('cancelled')
  }

  function handleRetry(): void {
    setStatus('streaming')
    setResponse('')
    responseRef.current = ''
    setErrorMsg('')
    setAgentStatuses(Object.fromEntries(AGENT_CONFIG.map((a) => [a.key, 'idle'])))

    if (selectedModel === 'claude') {
      window.api?.runStockAnalysis?.({ prompt: currentPrompt, apiKey })
    } else {
      window.api?.runPrompt?.({ model: selectedModel!, prompt: currentPrompt, apiKey })
    }
  }

  const modelLabel = selectedModel === 'gpt' ? 'GPT o3' : 'Claude Code'
  const modelImg = selectedModel === 'gpt' ? gptImg : claudeImg

  return (
    <div className="page">
      {/* 내비게이션 바 */}
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

      {/* 콘텐츠 */}
      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          {/* 멀티 에이전트 진행 상태 (Claude 전용) */}
          {selectedModel === 'claude' && (
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

          {/* 내 질문 버블 */}
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
              {currentPrompt}
            </div>
          </div>

          {/* AI 응답 카드 */}
          <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            {/* 카드 헤더 */}
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

            {/* 응답 본문 */}
            <div style={{ padding: 16 }} role="article" aria-label="AI 응답">
              {status === 'streaming' && !response && (
                <div
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                    fontStyle: 'italic'
                  }}
                >
                  {selectedModel === 'claude'
                    ? (() => {
                        const running = AGENT_CONFIG.find((a) => agentStatuses[a.key] === 'running')
                        const doneCount = AGENT_CONFIG.filter((a) => agentStatuses[a.key] === 'done').length
                        if (running) return `${running.label} 진행 중...`
                        if (doneCount === 3) return '투자 전략 종합 중...'
                        if (doneCount > 0) return `분석 완료 ${doneCount}/3 — 다음 에이전트 대기 중...`
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
                  ⚠ {errorMsg}
                </div>
              )}
            </div>

            {/* 카드 하단 액션 바 (완료 시) */}
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
                  {copied ? '✓ 복사됨' : '📋 복사'}
                </button>
              </div>
            )}
          </div>

          {/* 오류 시 재시도 */}
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

      {/* 하단 버튼 */}
      {status === 'streaming' && selectedModel === 'claude' && (
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

/* ── 간단한 마크다운 렌더러 ── */
// 마크다운 텍스트를 줄 단위로 파싱하여 React 엘리먼트 배열로 변환
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

    // ``` 펜스를 만나면 코드 블록 진입/탈출 토글
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

    // 코드 블록 내부 줄은 그대로 누적
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

  // 미완성 코드 블록 (스트리밍 중)
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

// **bold**와 `code` 인라인 마크다운을 React 엘리먼트로 변환
function renderInline(text: string): React.ReactNode {
  // **text** → <strong>, `text` → <code> 패턴 분리
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

  // 코드 블록 내용을 클립보드에 복사하고 1.5초 후 버튼 상태를 원래대로 복원
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
          {copied ? '✓ 복사됨' : '복사'}
        </button>
      </div>
      <div className="code-body">{code}</div>
    </div>
  )
}
