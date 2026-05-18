import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import gptImg from '../assets/gpt.jpg'
import claudeImg from '../assets/claude.png'

const MAX_CHARS = 100
const DEV_PREVIEW_PROMPT = '삼성전자'

export default function PromptPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, currentPrompt, setCurrentPrompt } = useApp()
  const [text, setText] = useState(currentPrompt)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const val = e.target.value
    if (val.length > MAX_CHARS) return
    setText(val)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' && text.trim()) handleSubmit()
  }

  function handleSubmit(): void {
    if (!text.trim()) return
    setCurrentPrompt(text.trim())
    navigate('/response')
  }

  function handleDevPreview(): void {
    const previewPrompt = text.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate('/response', {
      state: {
        previewOnly: true,
        previewStatus: 'done',
        model: selectedModel ?? 'gpt',
        prompt: previewPrompt
      }
    })
  }

  function handleDevProcessingPreview(): void {
    const previewPrompt = text.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate('/response', {
      state: {
        previewOnly: true,
        previewStatus: 'streaming',
        model: selectedModel ?? 'gpt',
        prompt: previewPrompt
      }
    })
  }

  const modelLabel = selectedModel === 'gpt' ? 'GPT' : 'Claude'
  const modelImg = selectedModel === 'gpt' ? gptImg : claudeImg

  return (
    <div className="page">
      {/* 내비게이션 바 */}
      <nav className="nav-bar">
        <div className="model-badge">
          <img
            src={modelImg}
            alt={modelLabel}
            style={{ width: 16, height: 16, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
          />
          {modelLabel}
        </div>
        <div className="nav-right">
          {import.meta.env.DEV && (
            <>
              <button
                onClick={handleDevPreview}
                aria-label="응답 화면 미리보기"
                title="응답 화면 미리보기"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 8,
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <PreviewIcon />
              </button>
              <button
                onClick={handleDevProcessingPreview}
                aria-label="응답 처리 중 화면 미리보기"
                title="응답 처리 중 화면 미리보기"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 8,
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <ProcessingPreviewIcon />
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/settings')}
            aria-label="설정"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 8,
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <SettingsIcon />
          </button>
        </div>
      </nav>

      {/* 콘텐츠 — 수직 중앙 정렬 */}
      <div
        className="page-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: 400, padding: '0 8px' }}>
          {/* 검색 입력 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border)',
              borderRadius: 28,
              padding: '0 16px',
              height: 52,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'border-color 0.15s, box-shadow 0.15s'
            }}
            onFocus={() => {}}
          >
            <SearchIcon />
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="종목명 입력  예) 삼성전자"
              aria-label="종목명 입력"
              autoFocus
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 'var(--text-base)',
                color: 'var(--text-primary)',
                marginLeft: 10
              }}
            />
            {text && (
              <button
                onClick={() => setText('')}
                aria-label="입력 지우기"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: '50%',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                <ClearIcon />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              aria-label="분석 시작"
              style={{
                background: text.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                border: 'none',
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                color: text.trim() ? '#fff' : 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: '50%',
                marginLeft: 6,
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s'
              }}
            >
              <SubmitIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewIcon(): React.JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ProcessingPreviewIcon(): React.JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="m4.93 4.93 2.83 2.83" />
      <path d="m16.24 16.24 2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="m4.93 19.07 2.83-2.83" />
      <path d="m16.24 7.76 2.83-2.83" />
    </svg>
  )
}

function SubmitIcon(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function SearchIcon(): React.JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ClearIcon(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SettingsIcon(): React.JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
