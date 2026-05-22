import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import gptImg from '../../assets/gpt.jpg'
import claudeImg from '../../assets/claude.png'

export default function SettingsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()

  useEffect(() => {
    if (!selectedModel) {
      navigate('/')
    }
  }, [navigate, selectedModel])

  if (!selectedModel) return <></>


  const isGpt = selectedModel === 'gpt'
  const modelLabel = isGpt ? 'GPT' : 'Claude'
  const modelDescription = isGpt
    ? 'Codex CLI 기반으로 분석을 실행합니다.'
    : 'Claude Code CLI 기반으로 분석을 실행합니다.'
  const modelImage = isGpt ? gptImg : claudeImg

  return (
    <div className="page">
      <nav className="nav-bar">
        <button className="nav-back" onClick={() => navigate('/prompt')} aria-label="뒤로">
          <svg viewBox="0 0 18 18">
            <polyline points="12,3 6,9 12,15" />
          </svg>
          뒤로
        </button>
        <div className="nav-title">설정</div>
      </nav>

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 24, paddingBottom: 24 }}>

          <section className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              현재 모델
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={modelImage}
                alt={modelLabel}
                style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 4 }}>
                  {modelLabel}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {modelDescription}
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              빠른 작업
            </div>
            <div style={{ display: 'grid', gap: 10 }}>

              <button onClick={() => navigate('/reports/latest')} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>이전 보고서 확인</div>
                  <div style={settingsRowDescStyle}>저장된 분석 보고서 목록을 확인합니다.</div>
                </div>
                <ChevronRightIcon />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ChevronRightIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
      <polyline
        points="6,3 12,9 6,15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const settingsRowButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  width: '100%',
  textAlign: 'left',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  fontFamily: 'inherit'
}

const settingsRowTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 4
}

const settingsRowDescStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--text-secondary)',
  lineHeight: 1.5
}
