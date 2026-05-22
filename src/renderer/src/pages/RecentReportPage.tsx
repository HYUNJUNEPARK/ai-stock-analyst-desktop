import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gptIcon from '../assets/gpt.jpg'
import claudeIcon from '../assets/claude.png'

type ReportFile = {
  name: string
  company: string
  ticker: string
  asOfDate: string
  model: string
  updatedAt: string
}

export default function RecentReportPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    window.api.listGptReportFiles().then((files) => {
      if (!cancelled) {
        setReports(files)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

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
          <div style={{ marginBottom: 16 }}>
            <h1
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8
              }}
            >
              보고서 목록
            </h1>
          </div>

          {loading && (
            <div className="card" style={{ padding: 20, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              보고서 목록을 불러오는 중입니다...
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 8 }}>
                저장된 보고서가 없습니다
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                GPT 분석을 먼저 실행하면 이 목록에 보고서가 표시됩니다.
              </p>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {reports.map((report) => (
                reportCard(report)
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function reportCard(report: ReportFile): React.JSX.Element {
  const displayName = report.company || report.name.replace(/\.json$/, '')
  const subtitle = [report.ticker, report.asOfDate].filter(Boolean).join(' · ')

  return (
    <div
      key={report.name}
      className="card"
      style={{
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <img
        src={report.model === 'gpt' ? gptIcon : report.model === 'claude' ? claudeIcon : ''}
        alt={displayName}
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
          {displayName}
        </div>
        {subtitle && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {subtitle}
          </div>
        )}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {formatDate(report.updatedAt)}
        </div>
      </div>
    </div>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
