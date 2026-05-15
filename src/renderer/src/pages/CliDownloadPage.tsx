import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

type Status = 'installing' | 'success' | 'error'

export default function CliDownloadPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()
  const [status, setStatus] = useState<Status>('installing')
  const [logs, setLogs] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedModel) {
      navigate('/')
      return
    }

    window.api.onInstallProgress((data: string) => {
      setLogs((prev) => [...prev, data])
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight
        }
      }, 0)
    })

    window.api.onInstallComplete((result: { success: boolean; error?: string }) => {
      if (result.success) {
        setStatus('success')
        // setTimeout(() => navigate('/auth'), 3000)
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? '알 수 없는 오류가 발생했습니다.')
      }
    })

    window.api.startCliInstall(selectedModel)
  }, [])

  const modelLabel = selectedModel === 'gpt' ? 'OpenAI GPT' : 'Claude Code'
  const command =
    selectedModel === 'claude'
      ? 'npm install -g @anthropic-ai/claude-code'
      : 'npm install -g openai'

  return (
    <div className="page">
      {/* 콘텐츠 */}
      <div
        className="page-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          {status === 'installing' && (
            <InstallingState logs={logs} command={command} logRef={logRef} />
          )}
          {status === 'success' && (
            <SuccessState
              modelLabel={modelLabel}
              logs={logs}
              showLogs={showLogs}
              setShowLogs={setShowLogs}
              logRef={logRef}
              onNext={() => navigate('/auth')}
            />
          )}
          {status === 'error' && (
            <ErrorState
              errorMsg={errorMsg}
              onRetry={() => {
                setStatus('installing')
                setLogs([])
                setErrorMsg('')
                window.api.startCliInstall(selectedModel!)
              }}
              onBack={() => navigate('/')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 설치 중 ── */
function InstallingState({
  logs,
  command,
  logRef
}: {
  logs: string[]
  command: string
  logRef: React.RefObject<HTMLDivElement | null>
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div className="spinner-lg" style={{ marginBottom: 20 }} />

      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8
        }}
      >
        CLI 설치 중
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 6
        }}
      >
        잠시만 기다려 주세요...
      </p>
      <code
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginBottom: 24
        }}
      >
        {command}
      </code>

      {/* 터미널 로그 */}
      <div
        ref={logRef}
        className="terminal"
        role="log"
        aria-live="polite"
        style={{ width: '100%', height: 200 }}
      >
        {logs.length === 0 ? (
          <span className="terminal-line dim">설치를 시작하는 중...</span>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="terminal-line">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ── 성공 ── */
function SuccessState({
  modelLabel,
  logs,
  showLogs,
  setShowLogs,
  logRef,
  onNext
}: {
  modelLabel: string
  logs: string[]
  showLogs: boolean
  setShowLogs: (v: boolean) => void
  logRef: React.RefObject<HTMLDivElement | null>
  onNext: () => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div className="status-icon success" style={{ marginBottom: 20 }} aria-label="설치 완료">
        <svg viewBox="0 0 28 28">
          <polyline points="6,14 11,19 22,8" />
        </svg>
      </div>

      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8
        }}
      >
        설치 완료!
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 32
        }}
      >
        {modelLabel} CLI가 성공적으로 설치되었습니다.
        <br />
        <span style={{ color: 'var(--text-tertiary)' }}>3초 후 자동으로 이동합니다.</span>
      </p>

      {/* 로그 토글 */}
      <button
        onClick={() => setShowLogs(!showLogs)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          marginBottom: 12,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        설치 로그 보기
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: showLogs ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <polyline points="2,4 7,10 12,4" />
        </svg>
      </button>

      <div
        style={{
          width: '100%',
          maxHeight: showLogs ? 172 : 0,
          opacity: showLogs ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.3s ease',
          marginBottom: showLogs ? 24 : 0
        }}
      >
        <div
          ref={logRef}
          className="terminal"
          style={{ width: '100%', height: 160 }}
        >
          {logs.map((line, i) => (
            <div key={i} className="terminal-line success">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', marginTop: 8 }}>
        <button className="btn-primary" onClick={onNext}>
          다음: API 키 설정
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6,3 12,9 6,15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ── 실패 ── */
function ErrorState({
  errorMsg,
  onRetry,
  onBack
}: {
  errorMsg: string
  onRetry: () => void
  onBack: () => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div className="status-icon error" style={{ marginBottom: 20 }} aria-label="설치 실패">
        <svg viewBox="0 0 28 28">
          <line x1="8" y1="8" x2="20" y2="20" />
          <line x1="20" y1="8" x2="8" y2="20" />
        </svg>
      </div>

      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8
        }}
      >
        설치 실패
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 20
        }}
      >
        오류가 발생했습니다.
      </p>

      {/* 오류 메시지 */}
      <div
        style={{
          width: '100%',
          background: 'rgba(255,59,48,0.08)',
          borderLeft: '3px solid var(--danger)',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 'var(--text-sm)',
          color: 'var(--danger)',
          lineHeight: 1.5,
          marginBottom: 32,
          wordBreak: 'break-word'
        }}
      >
        ⚠ {errorMsg}
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn-primary danger" onClick={onRetry}>
          다시 시도
        </button>
        <button className="btn-ghost" onClick={onBack}>
          모델 다시 선택
        </button>
      </div>
    </div>
  )
}
