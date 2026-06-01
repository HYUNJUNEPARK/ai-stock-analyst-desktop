import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiChevronRight, FiTrash2 } from 'react-icons/fi'
import NavBar from '../../components/NavBar'
import ConfirmDialog from '../../components/ConfirmDialog'
import { gptIcon, claudeIcon } from '../../assets'
import { ROUTES } from '../../routes'
import { useReportList } from '../../hooks/useReportList'
import type { ReportFile } from '../../hooks/useReportList'
import { useReportDeletion } from '../../hooks/useReportDeletion'

export default function RecentReportPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isWindow = searchParams.get('mode') === 'window'

  const { loading, sections, removeReport } = useReportList()
  const { deleteTarget, deleteTargetLabel, handleDeleteRequest, handleDeleteCancel, handleDeleteConfirm } =
    useReportDeletion({ onSuccess: removeReport })

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] RecentReportPage 렌더링')
  }, [])

  const handleReportClick = (name: string, model: string): void => {
    void window.api.openReportDetailWindow(name, model)
  }

  return (
    <div className="page">
      <NavBar
        onBack={() => isWindow ? window.close() : navigate(ROUTES.INFO)}
        backLabel={isWindow ? '닫기' : '뒤로'}
        title="이전 보고서"
      />

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

          {!loading && sections.length === 0 && (
            <div className="card status-card">
              <div className="status-card-title">저장된 보고서가 없습니다</div>
              <p className="status-card-copy">
                GPT 분석을 먼저 실행하면 이 목록에 보고서가 표시됩니다.
              </p>
            </div>
          )}

          {!loading && sections.length > 0 && (
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
  const label = report.ticker && report.ticker !== 'unknown' ? `${displayName}(${report.ticker})` : displayName

  return (
    <div
      key={report.name}
      role="button"
      tabIndex={0}
      className="report-list-row"
      onClick={() => onClick(report.name, report.model)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(report.name, report.model)
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
