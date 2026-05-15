import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function RecentReportPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { currentPrompt, lastResponse } = useApp()

  const hasReport = Boolean(lastResponse)

  return (
    <div className="page">
      <nav className="nav-bar">
        <button className="nav-back" onClick={() => navigate('/')} aria-label="뒤로">
          <svg viewBox="0 0 18 18">
            <polyline points="12,3 6,9 12,15" />
          </svg>
          뒤로
        </button>
        <div className="nav-title">이전 보고서</div>
      </nav>

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 24, paddingBottom: 24 }}>
          {!hasReport && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 8 }}>
                저장된 보고서가 없습니다
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                먼저 분석을 실행하면 최근 생성한 결과 보고서를 여기서 다시 확인할 수 있습니다.
              </p>
            </div>
          )}

          {hasReport && (
            <>
              {currentPrompt && (
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
                      wordBreak: 'break-word'
                    }}
                  >
                    {currentPrompt}
                  </div>
                </div>
              )}

              <div className="card" style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}
                >
                  최근 생성 결과
                </div>
                <div
                  style={{
                    padding: 16,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.8,
                    color: 'var(--text-primary)'
                  }}
                >
                  {lastResponse}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
