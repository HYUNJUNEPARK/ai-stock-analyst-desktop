import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import gptImg from '../../assets/gpt.jpg'
import { EyeIcon, EyeOffIcon } from './EyeIcons'

type BtnState = 'idle' | 'loading' | 'done'

export default function GptAuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, setApiKey: saveApiKey } = useApp()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [btnState, setBtnState] = useState<BtnState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [inputError, setInputError] = useState(false)
  const [savedKeyHint, setSavedKeyHint] = useState(false)

  useEffect(() => {
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
              src={gptImg}
              alt="OpenAI"
              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', marginBottom: 16 }}
            />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>
              API 키 설정
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              OpenAI API 키를 입력해 주세요
            </p>
          </div>

          {errorMsg && <div className="error-banner">⚠ {errorMsg}</div>}

          <label className="input-label" htmlFor="api-key">API 키</label>
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
              placeholder="sk-proj-..."
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
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
          {!savedKeyHint && (
            <p className="input-hint">
              API 키는 sk-proj-로 시작합니다. platform.openai.com에서 발급받을 수 있습니다.
            </p>
          )}
        </div>
      </div>

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
    </div>
  )
}
