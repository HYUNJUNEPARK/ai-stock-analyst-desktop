/**
 * 보고서 상세 페이지
 * 라우팅 진입점으로 보고서 JSON을 로드하고, ReportView에 데이터를 전달한다.
 * NavBar, 확대/축소, PDF 저장 등 페이지 셸 기능을 담당한다.
 */
import { useEffect, useState } from 'react'
import { LuDownload, LuZoomOut, LuZoomIn } from 'react-icons/lu'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import NavBar from '../../components/NavBar'
import type { ComponentProps } from 'react'
import MarkdownRenderer from './components/MarkdownRenderer'
import ReportView, { ZOOM_LEVELS, DEFAULT_ZOOM_INDEX } from './ReportView'
import { ROUTES } from '../../routes'

type GptReport = ComponentProps<typeof ReportView>['data']

export default function ReportDetailPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { name: encodedName } = useParams<{ name: string }>()
  const name = encodedName ? decodeURIComponent(encodedName) : undefined
  const isStandaloneWindow = searchParams.get('mode') === 'window'
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingPdf, setSavingPdf] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] ReportDetailPage 렌더링')
  }, [])

  useEffect(() => {
    if (!name) return
    window.api.readGptReportFile(name).then((result) => {
      if (result.success) {
        setData(result.data as Record<string, unknown>)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : '보고서를 불러오는 중 오류가 발생했습니다.')
      setLoading(false)
    })
  }, [name])

  const isGpt = searchParams.get('model') === 'gpt'
  const contentWidth = isStandaloneWindow ? 800 : 550

  function handleCloseOrBack(): void {
    if (isStandaloneWindow) {
      window.close()
      return
    }

    navigate(ROUTES.REPORTS_LATEST)
  }

  async function handleSavePdf(): Promise<void> {
    setSavingPdf(true)
    const company = data && typeof data.company === 'string' ? data.company : ''
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const defaultName = [company, today].filter(Boolean).join('_') + '.pdf'
    try {
      await window.api.saveReportPdf(defaultName)
    } finally {
      setSavingPdf(false)
    }
  }

  return (
    <div className="page">
      <NavBar
        onBack={handleCloseOrBack}
        title="보고서"
        backLabel={isStandaloneWindow ? '닫기' : '뒤로'}
        rightAction={
          !loading && !error && data
            ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                    disabled={zoomIndex === 0}
                    title="축소"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      background: 'transparent',
                      color: zoomIndex === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      border: 'none',
                      cursor: zoomIndex === 0 ? 'default' : 'pointer',
                      opacity: zoomIndex === 0 ? 0.4 : 1,
                    }}
                  >
                    <LuZoomOut size={16} />
                  </button>
                  <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                  <button
                    onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
                    disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                    title="확대"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      background: 'transparent',
                      color: zoomIndex === ZOOM_LEVELS.length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      border: 'none',
                      cursor: zoomIndex === ZOOM_LEVELS.length - 1 ? 'default' : 'pointer',
                      opacity: zoomIndex === ZOOM_LEVELS.length - 1 ? 0.4 : 1,
                    }}
                  >
                    <LuZoomIn size={16} />
                  </button>
                </div>
                <button
                  onClick={handleSavePdf}
                  disabled={savingPdf}
                  title="PDF 저장"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: savingPdf ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingPdf ? (
                    <span
                      style={{
                        display: 'block',
                        width: 16,
                        height: 16,
                        border: '2px solid var(--border)',
                        borderTopColor: 'var(--text-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  ) : (
                    <LuDownload size={18} />
                  )}
                </button>
              </div>
            )
            : undefined
        }
      />

      <div className="page-content">
        <div
          className="content-container"
          style={{ maxWidth: contentWidth, paddingTop: 16, paddingBottom: 24 }}
        >
          <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: isStandaloneWindow ? 24 : 16, minHeight: 216 }}>
              {loading && (
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  보고서를 불러오는 중입니다...
                </div>
              )}

              {!loading && error && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  minHeight: 180,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    보고서를 불러올 수 없습니다
                  </div>
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.5,
                    maxWidth: 320
                  }}>
                    {error}
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={handleCloseOrBack}
                    style={{
                      marginTop: 4,
                      padding: '6px 16px',
                      borderRadius: 8,
                      fontSize: 'var(--text-sm)'
                    }}
                  >
                    {isStandaloneWindow ? '닫기' : '돌아가기'}
                  </button>
                </div>
              )}

              {!loading && !error && data && (
                isGpt
                  ? <ReportView data={data as unknown as GptReport} zoomIndex={zoomIndex} />
                  : <MarkdownRenderer text={JSON.stringify(data, null, 2)} isStreaming={false} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
