import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PageFooter from '../components/PageFooter'
import gptImg from '../assets/gpt.jpg'
import claudeImg from '../assets/claude.png'

const MAX_CHARS = 5000
const WARN_CHARS = 4000

export default function PromptPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, currentPrompt, setCurrentPrompt } = useApp()
  const [text, setText] = useState(currentPrompt)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isMac = navigator.platform.toUpperCase().includes('MAC')

  // textarea 내용 길이에 맞게 높이를 자동 조절 (최대 320px)
  function autoResize(): void {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 320) + 'px'
  }

  // 최대 글자 수 초과 입력을 막고, 변경 시마다 높이를 재조정
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const val = e.target.value
    if (val.length > MAX_CHARS) return
    setText(val)
    autoResize()
  }

  // OS별 단축키(Mac: ⌘↩ / Windows: Ctrl+↩)로 제출 트리거
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    const submit = isMac ? e.metaKey && e.key === 'Enter' : e.ctrlKey && e.key === 'Enter'
    if (submit && text.trim()) handleSubmit()
  }

  // 프롬프트를 전역 상태에 저장하고 응답 화면으로 이동
  function handleSubmit(): void {
    if (!text.trim()) return
    setCurrentPrompt(text.trim())
    navigate('/response')
  }

  // 글자 수에 따라 카운터 색상을 동적으로 변경 (경고 → 위험)
  const charColor =
    text.length > MAX_CHARS
      ? 'var(--danger)'
      : text.length > WARN_CHARS
        ? 'var(--warning)'
        : 'var(--text-tertiary)'

  const modelLabel = selectedModel === 'gpt' ? 'OpenAI Codex' : 'Claude Code'
  // const dotColor = selectedModel === 'gpt' ? '#000' : '#D4A853'
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
          {/* <div className="model-badge-dot" style={{ background: dotColor }} /> */}
          {modelLabel}
        </div>
        <div className="nav-right">
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

      {/* 콘텐츠 */}
      <div className="page-content">
        <div className="content-container">
          {/* 헤더 */}
          <div style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 24 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>
              주식 분석 리포트 생성
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              종목명 또는 티커를 포함해 분석을 요청하세요.
            </p>
          </div>

          {/* 입력 카드 */}
          <div
            className="card"
            style={{
              border: '1.5px solid transparent',
              borderRadius: 20,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'border-color 0.15s, box-shadow 0.15s'
            }}
            onFocusCapture={(e) => {
              const el = e.currentTarget
              el.style.borderColor = 'var(--accent)'
              el.style.boxShadow = '0 0 0 3px var(--accent-light), 0 2px 12px rgba(0,0,0,0.08)'
            }}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                const el = e.currentTarget
                el.style.borderColor = 'transparent'
                el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="예) 삼성전자 분석해 줘"
              aria-label="주식 분석 요청 입력"
              style={{
                width: '100%',
                minHeight: 140,
                maxHeight: 320,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: 'var(--text-base)',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                background: 'transparent',
                padding: '16px 16px 0',
                overflowY: 'auto'
              }}
            />

            {/* 툴바 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderTop: '1px solid var(--border)'
              }}
            >
              {/* <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                <kbd
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 4,
                    padding: '1px 5px',
                    fontFamily: 'monospace',
                    fontSize: 10
                  }}
                >
                  {shortcutLabel}
                </kbd>{' '}
                로 제출
              </span> */}
              <span
                style={{ fontSize: 'var(--text-xs)', color: charColor }}
                aria-label={`글자 수: ${text.length}`}
                aria-live="polite"
              >
                {text.length.toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 하단 버튼 */}
      <PageFooter>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!text.trim()}
          aria-disabled={!text.trim()}
        >
          분석 시작
          {/* <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="9" y1="14" x2="9" y2="4" />
            <polyline points="4,9 9,4 14,9" />
          </svg> */}
        </button>
      </PageFooter>
    </div>
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
