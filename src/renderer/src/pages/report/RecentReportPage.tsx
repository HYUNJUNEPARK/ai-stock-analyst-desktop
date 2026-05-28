import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiTrash2 } from 'react-icons/fi'
import NavBar from '../../components/NavBar'
import ConfirmDialog from '../../components/ConfirmDialog'
import gptIcon from '../../assets/gpt.jpg'
import claudeIcon from '../../assets/claude.png'
import { ROUTES } from '../../routes'

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
  const [deleteTarget, setDeleteTarget] = useState<ReportFile | null>(null)
  const sections = groupReportsByDate(reports)

  const handleReportClick = (name: string, model: string): void => {
    void window.api.openReportDetailWindow(name, model)
  }

  const handleDeleteRequest = (report: ReportFile): void => {
    setDeleteTarget(report)
  }

  const handleDeleteCancel = (): void => {
    setDeleteTarget(null)
  }

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteTarget) return
    const result = await window.api.deleteGptReportFile(deleteTarget.name)
    if (result.success) {
      setReports((prev) => prev.filter((r) => r.name !== deleteTarget.name))
    }
    setDeleteTarget(null)
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

  const deleteTargetLabel = deleteTarget
    ? deleteTarget.ticker
      ? `${deleteTarget.company}(${deleteTarget.ticker})`
      : deleteTarget.company || deleteTarget.name
    : ''

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.INFO)} title="이전 보고서" />

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
                        reportCard(report, handleReportClick, handleDeleteRequest)
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="보고서 삭제"
          message={`'${deleteTargetLabel}' 보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  )
}

function reportCard(
  report: ReportFile,
  onClick: (name: string, model: string) => void,
  onDelete: (report: ReportFile) => void
): React.JSX.Element {
  const displayName = report.company || report.name
  const label = report.ticker ? `${displayName}(${report.ticker})` : displayName

  return (
    <button
      key={report.name}
      type="button"
      className="report-list-row"
      onClick={() => onClick(report.name, report.model)}
    >
      <img
        src={report.model === 'gpt' ? gptIcon : report.model === 'claude' ? claudeIcon : ''}
        alt={displayName}
        className="report-list-thumb"
      />
      <div className="report-list-body report-list-body--center">
        <div className="report-list-title">{label}</div>
      </div>
      <button
        type="button"
        className="report-list-delete-btn"
        aria-label="보고서 삭제"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(report)
        }}
      >
        <FiTrash2 size={15} />
      </button>
      <FiChevronRight className="report-list-chevron" aria-hidden="true" />
    </button>
  )
}

function formatSectionDate(asOfDate: string): string {
  if (!asOfDate) return '날짜 미상'
  const d = new Date(asOfDate)
  if (isNaN(d.getTime())) return asOfDate
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

function groupReportsByDate(reports: ReportFile[]): ReportSection[] {
  const grouped = new Map<string, ReportFile[]>()

  for (const report of reports) {
    const key = report.asOfDate || report.createdAt.slice(0, 10)
    const section = grouped.get(key)
    if (section) {
      section.push(report)
    } else {
      grouped.set(key, [report])
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sectionReports]) => ({
      date: formatSectionDate(date),
      reports: sectionReports
    }))
}
