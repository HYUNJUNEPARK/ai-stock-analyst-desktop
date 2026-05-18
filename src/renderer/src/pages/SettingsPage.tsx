import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import gptImg from '../assets/gpt.jpg'
import claudeImg from '../assets/claude.png'

export default function SettingsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, setSelectedModel } = useApp()

  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [statsData, setStatsData] = useState<{
    weekStart: string
    weekEnd: string
    weekly: { sessions: number; tokensByModel: Record<string, number>; messages?: number; toolCalls?: number }
  } | null>(null)

  useEffect(() => {
    if (!selectedModel) {
      navigate('/')
    }
  }, [navigate, selectedModel])

  if (!selectedModel) return <></>

  async function handleCheckStats(): Promise<void> {
    setStatsLoading(true)
    setStatsData(null)
    setStatsError(null)
    const res = await window.api.checkCliStats(selectedModel!)
    setStatsLoading(false)
    if (res.success) {
      setStatsData({ weekStart: res.weekStart, weekEnd: res.weekEnd, weekly: res.weekly })
    } else {
      setStatsError(res.error)
    }
  }

  const isGpt = selectedModel === 'gpt'
  const modelLabel = isGpt ? 'OpenAI Codex' : 'Claude Code'
  const modelDescription = isGpt
    ? 'Codex CLI 기반으로 분석을 실행합니다.'
    : 'Claude Code CLI 기반으로 분석을 실행합니다.'
  const modelImage = isGpt ? gptImg : claudeImg

  function handleChangeModel(): void {
    setSelectedModel(null)
    navigate('/')
  }

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
          <div style={{ marginBottom: 16 }}>
            <h1
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8
              }}
            >
              분석 환경 설정
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              현재 선택한 모델과 작업 상태를 확인하고, 인증 화면이나 모델 선택 화면으로 이동할 수 있습니다.
            </p>
          </div>

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

          <section className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              인증 및 실행
            </div>
            <button
              onClick={() => navigate('/auth')}
              style={settingsRowButtonStyle}
            >
              <div>
                <div style={settingsRowTitleStyle}>인증 화면 열기</div>
                <div style={settingsRowDescStyle}>현재 모델의 CLI 로그인을 다시 진행합니다.</div>
              </div>
              <ChevronRightIcon />
            </button>
          </section>

          <section className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              사용량 / 잔여 토큰
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                onClick={handleCheckStats}
                disabled={statsLoading}
                style={queryButtonStyle(statsLoading)}
              >
                {statsLoading ? '조회 중...' : `${modelLabel} stats 조회`}
              </button>
              {statsError && (
                <div style={statsResultBoxStyle}>
                  <span style={{ color: 'var(--color-error, #e53e3e)', fontSize: 'var(--text-sm)' }}>
                    {statsError}
                  </span>
                </div>
              )}
              {statsData && (
                <div style={statsResultBoxStyle}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                    이번 주 ({statsData.weekStart} ~ {statsData.weekEnd})
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <StatsRow label="세션 수" value={statsData.weekly.sessions.toLocaleString()} />
                    {statsData.weekly.messages !== undefined && (
                      <StatsRow label="메시지 수" value={statsData.weekly.messages.toLocaleString()} />
                    )}
                    {statsData.weekly.toolCalls !== undefined && (
                      <StatsRow label="툴 호출 수" value={statsData.weekly.toolCalls.toLocaleString()} />
                    )}
                    {Object.entries(statsData.weekly.tokensByModel).map(([model, tokens]) => (
                      <StatsRow
                        key={model}
                        label={`토큰 (${model})`}
                        value={tokens.toLocaleString()}
                        highlight
                      />
                    ))}
                  </div>
                </div>
              )}
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

              <button onClick={handleChangeModel} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>모델 다시 선택</div>
                  <div style={settingsRowDescStyle}>홈으로 돌아가 분석 모델을 다시 선택합니다.</div>
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

function queryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '12px 16px',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    background: disabled ? 'var(--bg-primary)' : 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit'
  }
}

const statsResultBoxStyle: React.CSSProperties = {
  padding: '14px 16px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 12
}

function StatsRow({
  label,
  value,
  highlight
}: {
  label: string
  value: string
  highlight?: boolean
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        color: highlight ? 'var(--color-accent, #4f8ef7)' : 'var(--text-primary)'
      }}>
        {value}
      </span>
    </div>
  )
}
