import { useEffect, useState } from 'react'
import { FiChevronRight, FiTrash2 } from 'react-icons/fi'
import ConfirmDialog from './ConfirmDialog'
import { gptIcon, claudeIcon } from '../assets'
import { useReportList } from '../hooks/useReportList'
import type { ReportFile } from '../hooks/useReportList'
import { useReportDeletion } from '../hooks/useReportDeletion'

type ReportSidePanelProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ReportSidePanel({
  isOpen,
  onClose
}: ReportSidePanelProps): React.JSX.Element | null {
  const [panelVisible, setPanelVisible] = useState(false)

  const { loading: reportsLoading, sections, removeReport, resetLoading } = useReportList({ enabled: isOpen })
  const { deleteTarget, deleteTargetLabel, handleDeleteRequest, handleDeleteCancel, handleDeleteConfirm } =
    useReportDeletion({ onSuccess: removeReport })

  // 패널이 열릴 때 슬라이드 인 애니메이션을 트리거한다
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

          {!reportsLoading && sections.length === 0 && (
            <div className="card status-card">
              <div className="status-card-title">저장된 보고서가 없습니다</div>
              <p className="status-card-copy">
                GPT 분석을 먼저 실행하면 이 목록에 보고서가 표시됩니다.
              </p>
            </div>
          )}

          {!reportsLoading && sections.length > 0 && (
            <div className="report-sections">
              {sections.map((section) => (
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
  const label = report.ticker && report.ticker !== 'unknown' ? `${displayName}(${report.ticker})` : displayName
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
