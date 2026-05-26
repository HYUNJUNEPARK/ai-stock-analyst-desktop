import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import NavBar from '../../components/NavBar'
import gptIcon from '../../assets/gpt.jpg'
import claudeIcon from '../../assets/claude.png'

type ReportFile = {
  name: string
  company: string
  ticker: string
  asOfDate: string
  model: string
  createdAt: string
  updatedAt: string
}

type ReportSection = {
  date: string
  reports: ReportFile[]
}

export default function RecentReportPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportFile[]>([])
  const [loading, setLoading] = useState(true)
  const sections = groupReportsByDate(reports)

  const handleReportClick = (name: string): void => {
    void window.api.openReportDetailWindow(name)
  }

  useEffect(() => {
    console.log('[Page] RecentReportPage 렌더링')
  }, [])

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
      <NavBar onBack={() => navigate('/settings')} title="이전 보고서" />

      <div className="page-content">
        <div className="content-container content-container-compact">
          <section className="report-summary">
            <p className="report-summary-copy">
              최근에 저장한 보고서를 빠르게 다시 열어볼 수 있습니다.
            </p>
          </section>

          {loading && (
            <div className="card status-card">
              보고서 목록을 불러오는 중입니다...
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="card status-card">
              <div className="status-card-title">저장된 보고서가 없습니다</div>
              <p className="status-card-copy">
                GPT 분석을 먼저 실행하면 이 목록에 보고서가 표시됩니다.
              </p>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="report-sections">
              {sections.map((section) => (
                <section key={section.date} className="report-section">
                  <div className="report-section-heading">{section.date}</div>
                  <div className="card report-list-card">
                    <div className="report-list">
                      {section.reports.map((report) => (
                        reportCard(report, handleReportClick)
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function reportCard(report: ReportFile, onClick: (name: string) => void): React.JSX.Element {
  const displayName = report.company || report.name.replace(/\.json$/, '')
  const label = report.ticker ? `${displayName}(${report.ticker})` : displayName

  return (
    <button
      key={report.name}
      type="button"
      className="report-list-row"
      onClick={() => onClick(report.name)}
    >
      <img
        src={report.model === 'gpt' ? gptIcon : report.model === 'claude' ? claudeIcon : ''}
        alt={displayName}
        className="report-list-thumb"
      />
      <div className="report-list-body report-list-body--center">
        <div className="report-list-title">{label}</div>
      </div>
      <FiChevronRight className="report-list-chevron" aria-hidden="true" />
    </button>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value))
}

function groupReportsByDate(reports: ReportFile[]): ReportSection[] {
  const grouped = new Map<string, ReportFile[]>()

  for (const report of reports) {
    const date = formatDate(report.createdAt)
    const section = grouped.get(date)

    if (section) {
      section.push(report)
      continue
    }

    grouped.set(date, [report])
  }

  return Array.from(grouped.entries()).map(([date, sectionReports]) => ({
    date,
    reports: sectionReports
  }))
}
