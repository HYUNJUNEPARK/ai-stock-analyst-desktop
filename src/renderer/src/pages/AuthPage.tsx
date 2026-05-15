import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import claudeImg from '../assets/claude.png'
import gptImg from '../assets/gpt.jpg'

type AuthMethod = 'apikey' | 'cli'
type BtnState = 'idle' | 'loading' | 'done'

export default function AuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, setApiKey: saveApiKey } = useApp()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authMethod, setAuthMethod] = useState<AuthMethod>('apikey')
  const [btnState, setBtnState] = useState<BtnState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [inputError, setInputError] = useState(false)
  const [savedKeyHint, setSavedKeyHint] = useState(false)
  const [cliStatus, setCliStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [cliLogs, setCliLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedModel) { navigate('/'); return }
    window.api?.loadApiKey().then((key: string | null) => {
      if (key) { setApiKeyInput(key); setSavedKeyHint(true) }
    })
  }, [])

  async function handleConfirm(): Promise<void> {
    if (!apiKeyInput.trim()) return
    setErrorMsg('')
    setInputError(false)
    setBtnState('loading')

    const result = await window.api?.validateApiKey({ model: selectedModel!, apiKey: apiKeyInput })
    if (result?.valid) {
      await window.api?.saveApiKey({ model: selectedModel!, apiKey: apiKeyInput })
      saveApiKey(apiKeyInput)
      setBtnState('done')
      setTimeout(() => navigate('/prompt'), 600)
    } else {
      setBtnState('idle')
      setInputError(true)
      setErrorMsg(result?.error ?? '유효하지 않은 API 키입니다. 다시 확인해 주세요.')
    }
  }

  function handleCliLogin(): void {
    setCliStatus('running')
    setCliLogs([])
    window.api?.onCliLoginProgress?.((data: string) => {
      setCliLogs((p) => [...p, data])
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
      }, 0)
    })
    window.api?.onCliLoginComplete?.((result: { success: boolean }) => {
      if (result.success) {
        setCliStatus('done')
        setTimeout(() => navigate('/prompt'), 800)
      }
    })
    window.api?.runClaudeLogin?.()
  }

  const modelLabel = selectedModel === 'gpt' ? 'OpenAI' : 'Anthropic'
  const placeholder = selectedModel === 'gpt' ? 'sk-proj-...' : 'sk-ant-...'
  const hint =
    selectedModel === 'gpt'
      ? 'API 키는 sk-proj-로 시작합니다. platform.openai.com에서 발급받을 수 있습니다.'
      : 'API 키는 sk-ant-로 시작합니다. console.anthropic.com에서 발급받을 수 있습니다.'

  return (
    <div className="page">
      {/* 내비게이션 바 */}
      <nav className="nav-bar">
        <button className="nav-back" onClick={() => navigate('/')} aria-label="뒤로">
          <svg viewBox="0 0 18 18">
            <polyline points="12,3 6,9 12,15" />
          </svg>
          뒤로
        </button>
      </nav>

      {/* 콘텐츠 */}
      <div className="page-content">
        <div className="content-container">
          {/* 헤더 */}
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 32 }}>
            <img
              src={selectedModel === 'gpt' ? gptImg : claudeImg}
              alt={selectedModel === 'gpt' ? 'OpenAI' : 'Claude'}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                objectFit: 'cover',
                marginBottom: 16
              }}
            />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>
              API 키 설정
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {modelLabel} API 키를 입력해 주세요
            </p>
          </div>

          {/* Claude 전용: 탭 */}
          {selectedModel === 'claude' && (
            <div className="tab-bar">
              <button
                className={`tab-item ${authMethod === 'apikey' ? 'active' : ''}`}
                onClick={() => setAuthMethod('apikey')}
              >
                API 키로 인증
              </button>
              <button
                className={`tab-item ${authMethod === 'cli' ? 'active' : ''}`}
                onClick={() => setAuthMethod('cli')}
              >
                CLI 로그인
              </button>
            </div>
          )}

          {/* API 키 입력 폼 */}
          {(selectedModel === 'gpt' || authMethod === 'apikey') && (
            <div>
              {errorMsg && <div className="error-banner">⚠ {errorMsg}</div>}

              <label className="input-label" htmlFor="api-key">
                API 키
              </label>
              <div className="input-wrapper">
                <input
                  id="api-key"
                  className={`input ${inputError ? 'error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value)
                    setInputError(false)
                    setErrorMsg('')
                    setSavedKeyHint(false)
                  }}
                  placeholder={placeholder}
                  autoComplete="off"
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm()
                  }}
                />
                <button
                  className="input-eye-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {savedKeyHint && (
                <p className="input-hint success">✓ 저장된 키를 불러왔습니다. 변경하려면 입력하세요.</p>
              )}
              {!savedKeyHint && <p className="input-hint">{hint}</p>}
            </div>
          )}

          {/* Claude CLI 로그인 */}
          {selectedModel === 'claude' && authMethod === 'cli' && (
            <div>
              <div className="info-card" style={{ marginBottom: 20 }}>
                ℹ &nbsp;claude login 명령을 실행하면 브라우저가 열리며 Anthropic 계정으로 로그인할 수 있습니다.
              </div>

              {cliStatus === 'idle' && (
                <button className="btn-primary" onClick={handleCliLogin}>
                  claude login 시작하기
                </button>
              )}

              {cliStatus === 'running' && (
                <div>
                  <div
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
                  </div>
                  <div
                    ref={logRef}
                    className="terminal"
                    role="log"
                    aria-live="polite"
                    style={{ height: 120 }}
                  >
                    {cliLogs.map((line, i) => (
                      <div key={i}>{line}</div>
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
          )}
        </div>
      </div>

      {/* 하단 버튼 — API 키 방식만 */}
      {(selectedModel === 'gpt' || authMethod === 'apikey') && (
        <div className="page-footer">
          <div className="content-container">
            <button
              className={`btn-primary ${btnState === 'loading' ? 'loading' : ''}`}
              onClick={handleConfirm}
              disabled={!apiKeyInput.trim() || btnState !== 'idle'}
            >
              {btnState === 'loading' && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {btnState === 'idle' && '인증 확인'}
              {btnState === 'loading' && '확인 중...'}
              {btnState === 'done' && '✓ 인증 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EyeIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
