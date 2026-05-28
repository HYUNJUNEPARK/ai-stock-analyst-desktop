import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiTrash2, FiX } from 'react-icons/fi'
import { useApp } from '../../context/AppContext'
import NavBar from '../../components/NavBar'
import ConfirmDialog from '../../components/ConfirmDialog'
import { ROUTES } from '../../routes'
import developerInfo from '../../data/developer-info.json'
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

const DEV_PREVIEW_PROMPT = '삼성전자'

export default function InfoPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel, currentPrompt, setCurrentPrompt } = useApp()
  const [modelName, setModelName] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const [reports, setReports] = useState<ReportFile[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ReportFile | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('[Page] SettingsPage 렌더링')
  }, [])

  useEffect(() => {
    if (!selectedModel) return
    window.api.getModelInfo(selectedModel).then((result) => {
      setModelName(result.modelName)
    })
  }, [selectedModel])

  useEffect(() => {
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
    }
  }, [navigate, selectedModel])

  useEffect(() => {
    if (isPanelOpen) {
      requestAnimationFrame(() => setPanelVisible(true))
      setReportsLoading(true)
      window.api.listGptReportFiles().then((files) => {
        setReports(files)
        setReportsLoading(false)
      })
    } else {
      setPanelVisible(false)
    }
  }, [isPanelOpen])

  function openPanel(): void {
    setIsPanelOpen(true)
  }

  function closePanel(): void {
    setPanelVisible(false)
    setTimeout(() => setIsPanelOpen(false), 280)
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
    window.api.deleteGptReportFile(target.name)
      .then((result) => {
        if (result.success) {
          setReports((prev) => prev.filter((r) => r.name !== target.name))
        }
      })
      .catch((err: Error) => {
        console.error('[delete] IPC 오류:', err.message)
      })
  }

  if (!selectedModel) return <></>

  function handleOpenInvestmentGuide(): void {
    void window.api.openGuideWindow('investment')
  }

  function handleOpenValuationGuide(): void {
    void window.api.openGuideWindow('valuation')
  }

  function handleDevPreview(): void {
    const previewPrompt = currentPrompt.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate(ROUTES.RESPONSE, {
      state: {
        previewOnly: true,
        previewStatus: 'done',
        model: selectedModel,
        prompt: previewPrompt
      }
    })
  }

  function handleDevProcessingPreview(): void {
    const previewPrompt = currentPrompt.trim() || DEV_PREVIEW_PROMPT
    setCurrentPrompt(previewPrompt)
    navigate(ROUTES.RESPONSE, {
      state: {
        previewOnly: true,
        previewStatus: 'streaming',
        model: selectedModel,
        prompt: previewPrompt
      }
    })
  }

  const isGpt = selectedModel === 'gpt'

  const modelNameBadgeStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '2px 7px',
    fontFamily: "'SF Mono', 'Menlo', monospace",
    verticalAlign: 'middle'
  }

  const modelDescription = isGpt ? (
    <span>
      {modelName
        ? <><span style={modelNameBadgeStyle}>{modelName}</span>{' 기반으로 분석을 실행합니다.'}</>
        : 'GPT 기반으로 분석을 실행합니다.'
      }
    </span>
  ) : 'Claude 기반으로 분석을 실행합니다.'

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.PROMPT)} />

      <div className="page-content">
        <div className="content-container" style={{ paddingTop: 24, paddingBottom: 24 }}>

          <section className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              현재 모델
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {modelDescription}
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              빠른 작업
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={openPanel} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>이전 보고서 확인</div>
                  <div style={settingsRowDescStyle}>저장된 분석 보고서 목록을 확인합니다.</div>
                </div>
                <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </button>
            </div>
          </section>

          <section className="card" style={{ padding: 18, marginTop: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              투자 가이드
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={handleOpenValuationGuide} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>투자 지표 용어 사전</div>
                  <div style={settingsRowDescStyle}>PER·PBR·ROE·부채비율 등 핵심 지표의 개념과 해석 기준을 확인합니다.</div>
                </div>
                <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </button>
              <button onClick={handleOpenInvestmentGuide} style={settingsRowButtonStyle}>
                <div>
                  <div style={settingsRowTitleStyle}>투자 유형 분류 기준</div>
                  <div style={settingsRowDescStyle}>성장형·가치형 등 투자 유형 분류에 사용되는 판단 기준을 확인합니다.</div>
                </div>
                <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </button>
            </div>
          </section>

          <section className="card" style={{ padding: 18, marginTop: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              개발자 정보
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={settingsRowTitleStyle}>이름</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  {developerInfo.name}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={settingsRowTitleStyle}>GitHub</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: "'SF Mono', 'Menlo', monospace" }}>
                  {developerInfo.github}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={settingsRowTitleStyle}>이메일</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  {developerInfo.email}
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 18, marginTop: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              앱 정보
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={settingsRowTitleStyle}>버전</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                v{__APP_VERSION__}
              </div>
            </div>
          </section>


          {import.meta.env.DEV && (
            <section className="card" style={{ padding: 18, marginTop: 14 }}>
              <div
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 12 }}
              >
                개발용 미리보기
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <button onClick={handleDevPreview} style={settingsRowButtonStyle}>
                  <div>
                    <div style={settingsRowTitleStyle}>응답 화면 미리보기</div>
                    <div style={settingsRowDescStyle}>
                      응답 완료 상태의 화면을 개발용 데이터로 바로 확인합니다.
                    </div>
                  </div>
                  <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </button>
                <button onClick={handleDevProcessingPreview} style={settingsRowButtonStyle}>
                  <div>
                    <div style={settingsRowTitleStyle}>처리 중 화면 미리보기</div>
                    <div style={settingsRowDescStyle}>
                      스트리밍 진행 중 상태의 응답 화면을 개발용으로 확인합니다.
                    </div>
                  </div>
                  <FiChevronRight style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
      {isPanelOpen && (
        <>
          {/* 백드롭 */}
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

          {/* 사이드 패널 */}
          <div
            ref={panelRef}
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
            {/* 패널 헤더 */}
            <div style={{
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
            }}>
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

            {/* 패널 콘텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
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
                          {section.reports.map((report) => {
                            const displayName = report.company || report.name
                            const label = report.ticker ? `${displayName}(${report.ticker})` : displayName
                            return (
                              <button
                                key={report.name}
                                type="button"
                                className="report-list-row"
                                onClick={() => void window.api.openReportDetailWindow(report.name, report.model)}
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
                                    handleDeleteRequest(report)
                                  }}
                                >
                                  <FiTrash2 size={15} />
                                </button>
                                <FiChevronRight className="report-list-chevron" aria-hidden="true" />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="보고서 삭제"
          message={`'${deleteTarget.ticker ? `${deleteTarget.company}(${deleteTarget.ticker})` : deleteTarget.company || deleteTarget.name}' 보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
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
