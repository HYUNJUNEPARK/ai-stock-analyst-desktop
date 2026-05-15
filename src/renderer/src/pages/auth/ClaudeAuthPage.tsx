import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import claudeImg from '../../assets/claude.png'
import PageFooter from '../../components/PageFooter'

export default function ClaudeAuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { setApiKey: saveApiKey } = useApp()
  const [cliStatus, setCliStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [cliError, setCliError] = useState('')
  const [cliLogs, setCliLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  function handleCliLogin(): void {
    setCliStatus('running')
    setCliError('')
    setCliLogs([])

    window.api.onCliLoginProgress((data: string) => {
      setCliLogs((prev) => [...prev, data])
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight
        }
      }, 0)
    })

    window.api.onCliLoginComplete((result: { success: boolean; error?: string }) => {
      if (result.success) {
        setCliStatus('done')
        saveApiKey('')
        setTimeout(() => navigate('/prompt'), 800)
        return
      }

      setCliStatus('idle')
      setCliError(result.error ?? 'Claude CLI 로그인에 실패했습니다.')
    })

    window.api.runClaudeLogin()
  }

  return (
    <div className="page">
      <nav className="nav-bar">
        <button className="nav-back" onClick={() => navigate('/')} aria-label="뒤로">
          <svg viewBox="0 0 18 18">
            <polyline points="12,3 6,9 12,15" />
          </svg>
          뒤로
        </button>
      </nav>

      <div className="page-content">
        <div className="content-container">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 32 }}>
            <img
              src={claudeImg}
              alt="Claude"
              style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', marginBottom: 16 }}
            />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>
              Claude 인증
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              `claude login`으로 Anthropic 계정 인증을 진행해 주세요
            </p>
          </div>

          <div>
            <div className="info-card" style={{ marginBottom: 20 }}>
              `claude login` 명령을 실행합니다. 브라우저가 열리면 Anthropic 계정으로 로그인해 주세요.
            </div>

            {cliError && <div className="error-banner">⚠ {cliError}</div>}

            {cliStatus === 'running' && (
              <div>
                {/* <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: 'var(--accent)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 12
                  }}
                >
                  <div className="spinner" />
                  브라우저에서 로그인을 완료해 주세요...
                </div> */}
                <div
                  ref={logRef}
                  className="terminal"
                  role="log"
                  aria-live="polite"
                  style={{ height: 60 }}
                >
                  {cliLogs.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
            )}

            {cliStatus === 'done' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--success)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 500
                }}
              >
                ✓ 로그인 성공!
              </div>
            )}
          </div>
        </div>
      </div>

      <PageFooter>
        <button className="btn-primary" onClick={handleCliLogin} disabled={cliStatus !== 'idle'}>
          {cliStatus === 'running' && (
            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          )}
          {cliStatus === 'idle' && '시작하기'}
          {cliStatus === 'running' && '로그인 진행 중...'}
          {cliStatus === 'done' && '✓ 로그인 완료'}
        </button>
      </PageFooter>
    </div>
  )
}
