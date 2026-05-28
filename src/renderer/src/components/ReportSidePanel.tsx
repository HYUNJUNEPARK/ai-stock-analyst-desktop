import { useEffect, useState } from 'react'
import { FiChevronRight, FiTrash2 } from 'react-icons/fi'
import ConfirmDialog from './ConfirmDialog'
import gptIcon from '../assets/gpt.jpg'
import claudeIcon from '../assets/claude.png'

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

type ReportSidePanelProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ReportSidePanel({
  isOpen,
  onClose
}: ReportSidePanelProps): React.JSX.Element | null {
  const [panelVisible, setPanelVisible] = useState(false)
  const [reports, setReports] = useState<ReportFile[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<ReportFile | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    requestAnimationFrame(() => setPanelVisible(true))
    window.api
      .listGptReportFiles()
      .then((files) => {
        if (!cancelled) {
          setReports(files)
          setReportsLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          console.error('[reports] 목록 조회 실패:', err.message)
          setReportsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isOpen])

  if (!isOpen) return null

  function closePanel(): void {
    setPanelVisible(false)
    setTimeout(() => {
      setReportsLoading(true)
      onClose()
    }, 280)
  }

  function handleDeleteRequest(report: ReportFile): void {
    setDeleteTarget(report)
  }

  function handleDeleteCancel(): void {
    setDeleteTarget(null)
  }

  function handleDeleteConfirm(): void {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    window.api
      .deleteGptReportFile(target.name)
      .then((result) => {
        if (result.success) {
          setReports((prev) => prev.filter((r) => r.name !== target.name))
        } else {
          console.error('[delete] 삭제 실패:', result.error)
        }
      })
      .catch((err: Error) => {
        console.error('[delete] IPC 오류:', err.message)
      })
  }

  const deleteTargetLabel = deleteTarget
    ? deleteTarget.ticker
      ? `${deleteTarget.company}(${deleteTarget.ticker})`
      : deleteTarget.company || deleteTarget.name
    : ''

  return (
    <>
      <div
        onClick={closePanel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.35)',
          zIndex: 200,
          opacity: panelVisible ? 1 : 0,
          transition: 'opacity 0.28s ease'
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '82%',
          maxWidth: 420,
          background: 'var(--bg-primary)',
          borderLeft: '0.5px solid var(--border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          transform: panelVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div
          style={{
            height: 52,
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '0.5px solid var(--border)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <button
            onClick={closePanel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              border: 'none',
              background: 'var(--bg-tertiary)',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <FiChevronRight size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              margin: '0 0 16px',
              lineHeight: 1.5
            }}
          >
            보관 중인 보고서 리스트입니다.
          </p>

          {reportsLoading && (
            <div className="card status-card">보고서 목록을 불러오는 중입니다...</div>
          )}

          {!reportsLoading && reports.length === 0 && (
            <div className="card status-card">
              <div className="status-card-title">저장된 보고서가 없습니다</div>
              <p className="status-card-copy">
                GPT 분석을 먼저 실행하면 이 목록에 보고서가 표시됩니다.
              </p>
            </div>
          )}

          {!reportsLoading && reports.length > 0 && (
            <div className="report-sections">
              {groupReportsByDate(reports).map((section) => (
                <section key={section.date} className="report-section">
                  <div className="report-section-heading">{section.date}</div>
                  <div className="card report-list-card">
                    <div className="report-list">
                      {section.reports.map((report) => (
                        <ReportRow
                          key={report.name}
                          report={report}
                          onDelete={handleDeleteRequest}
                        />
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
    </>
  )
}

function ReportRow({
  report,
  onDelete
}: {
  report: ReportFile
  onDelete: (report: ReportFile) => void
}): React.JSX.Element {
  const displayName = report.company || report.name
  const label = report.ticker ? `${displayName}(${report.ticker})` : displayName
  const openReport = (): void => {
    void window.api.openReportDetailWindow(report.name, report.model)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="report-list-row"
      onClick={openReport}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openReport()
        }
      }}
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
    </div>
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
