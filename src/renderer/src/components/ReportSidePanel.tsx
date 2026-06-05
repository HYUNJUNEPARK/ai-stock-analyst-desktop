import { useEffect, useState } from 'react'
import { FiX, FiChevronRight, FiTrash2 } from 'react-icons/fi'
import ConfirmDialog from './ConfirmDialog'
import { gptIcon, claudeIcon } from '../assets'
import { useReportList } from '../hooks/useReportList'
import type { ReportFile } from '../hooks/useReportList'
import { useReportDeletion } from '../hooks/useReportDeletion'
import './ReportSidePanel.css'

type ReportSidePanelProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ReportSidePanel({
  isOpen,
  onClose
}: ReportSidePanelProps): React.JSX.Element | null {
  const [panelVisible, setPanelVisible] = useState(false)

  const {
    loading: reportsLoading,
    sections,
    removeReport,
    resetLoading
  } = useReportList({ enabled: isOpen })
  const {
    deleteTarget,
    deleteTargetLabel,
    handleDeleteRequest,
    handleDeleteCancel,
    handleDeleteConfirm
  } = useReportDeletion({ onSuccess: removeReport })

  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => setPanelVisible(true))
  }, [isOpen])

  if (!isOpen) return null

  function closePanel(): void {
    setPanelVisible(false)
    setTimeout(() => {
      resetLoading()
      onClose()
    }, 280)
  }

  return (
    <>
      {/* 백드롭 */}
      <div
        className={`rsp-backdrop ${panelVisible ? 'rsp-backdrop--visible' : ''}`}
        onClick={closePanel}
      />

      {/* 패널 */}
      <div className={`rsp-panel ${panelVisible ? 'rsp-panel--visible' : ''}`}>
        {/* 헤더 */}
        <div className="rsp-header">
          <h2 className="rsp-header-title">이전 보고서</h2>
          <button className="rsp-close-btn" onClick={closePanel} aria-label="닫기">
            <FiX size={15} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="rsp-content">
          {/* 로딩 */}
          {reportsLoading && (
            <div className="rsp-empty">
              <span className="rsp-empty-spinner" />
              보고서를 불러오는 중...
            </div>
          )}

          {/* 빈 상태 */}
          {!reportsLoading && sections.length === 0 && (
            <div className="rsp-empty-card">
              <div className="rsp-empty-icon">
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
              <div className="rsp-empty-title">저장된 보고서가 없습니다</div>
              <div className="rsp-empty-desc">
                분석을 실행하면 이 목록에 보고서가 표시됩니다.
              </div>
            </div>
          )}

          {/* 보고서 리스트 */}
          {!reportsLoading &&
            sections.length > 0 &&
            sections.map((section) => (
              <section key={section.date} className="rsp-section">
                <h3 className="rsp-section-header">{section.date}</h3>
                <div className="rsp-group">
                  {section.reports.map((report, i) => (
                    <ReportRow
                      key={report.name}
                      report={report}
                      showSeparator={i < section.reports.length - 1}
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
    </>
  )
}

function ReportRow({
  report,
  showSeparator,
  onDelete
}: {
  report: ReportFile
  showSeparator: boolean
  onDelete: (report: ReportFile) => void
}): React.JSX.Element {
  const displayName = report.company || report.name
  const label =
    report.ticker && report.ticker !== 'unknown'
      ? `${displayName}(${report.ticker})`
      : displayName

  const openReport = (): void => {
    void window.api.openReportDetailWindow(report.name, report.model)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="rsp-row"
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
          className="rsp-row-thumb"
        />
        <div className="rsp-row-body">
          <span className="rsp-row-title">{label}</span>
        </div>
        <button
          type="button"
          className="rsp-row-delete"
          aria-label="보고서 삭제"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(report)
          }}
        >
          <FiTrash2 size={14} />
        </button>
        <FiChevronRight className="rsp-row-chevron" aria-hidden="true" />
      </div>
      {showSeparator && <div className="rsp-row-separator" />}
    </>
  )
}
