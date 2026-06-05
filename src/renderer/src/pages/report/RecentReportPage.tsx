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
import './RecentReportPage.css'

export default function RecentReportPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isWindow = searchParams.get('mode') === 'window'

  const { loading, sections, removeReport } = useReportList()
  const {
    deleteTarget,
    deleteTargetLabel,
    handleDeleteRequest,
    handleDeleteCancel,
    handleDeleteConfirm
  } = useReportDeletion({ onSuccess: removeReport })

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] RecentReportPage 렌더링')
  }, [])

  const handleReportClick = (name: string, model: string): void => {
    void window.api.openReportDetailWindow(name, model)
  }

  return (
    <div className="page">
      <NavBar
        onBack={() => (isWindow ? window.close() : navigate(ROUTES.INFO))}
        backLabel={isWindow ? '닫기' : '뒤로'}
        title="이전 보고서"
      />

      <div className="page-content">
        <div className="rrp">
          {/* 로딩 */}
          {loading && (
            <div className="rrp-loading">
              <span className="rrp-spinner" />
              보고서를 불러오는 중...
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && sections.length === 0 && (
            <div className="rrp-empty">
              <div className="rrp-empty-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect
                    x="6"
                    y="4"
                    width="20"
                    height="24"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M11 12h10M11 16h7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="rrp-empty-title">저장된 보고서가 없습니다</div>
              <div className="rrp-empty-desc">
                분석을 실행하면 이 목록에 보고서가 표시됩니다.
              </div>
            </div>
          )}

          {/* 보고서 리스트 */}
          {!loading &&
            sections.length > 0 &&
            sections.map((section) => (
              <section key={section.date} className="rrp-section">
                <h3 className="rrp-section-header">{section.date}</h3>
                <div className="rrp-group">
                  {section.reports.map((report, i) => (
                    <ReportRow
                      key={report.name}
                      report={report}
                      showSeparator={i < section.reports.length - 1}
                      onClick={handleReportClick}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>
              </section>
            ))}
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

function ReportRow({
  report,
  showSeparator,
  onClick,
  onDelete
}: {
  report: ReportFile
  showSeparator: boolean
  onClick: (name: string, model: string) => void
  onDelete: (report: ReportFile) => void
}): React.JSX.Element {
  const displayName = report.company || report.name
  const label =
    report.ticker && report.ticker !== 'unknown'
      ? `${displayName}(${report.ticker})`
      : displayName

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="rrp-row"
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
          className="rrp-row-thumb"
        />
        <div className="rrp-row-body">
          <span className="rrp-row-title">{label}</span>
        </div>
        <button
          type="button"
          className="rrp-row-delete"
          aria-label="보고서 삭제"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(report)
          }}
        >
          <FiTrash2 size={14} />
        </button>
        <FiChevronRight className="rrp-row-chevron" aria-hidden="true" />
      </div>
      {showSeparator && <div className="rrp-row-separator" />}
    </>
  )
}
