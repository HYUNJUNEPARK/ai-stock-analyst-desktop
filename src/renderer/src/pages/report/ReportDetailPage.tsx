import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import gptIcon from '../../assets/gpt.jpg'
import NavBar from '../../components/NavBar'
import claudeIcon from '../../assets/claude.png'
import type { ComponentProps } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ReportView from './ReportView'
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

  useEffect(() => {
    console.log('[Page] ReportDetailPage 렌더링')
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
    })
  }, [name])

  const isGpt = searchParams.get('model') === 'gpt'
  const modelImg = isGpt ? gptIcon : claudeIcon
  const modelLabel = isGpt ? 'GPT' : 'Claude'
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
    const ticker = data && typeof data.ticker === 'string' ? data.ticker : ''
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const defaultName = [company, ticker, today].filter(Boolean).join('_') + '.pdf'
    await window.api.saveReportPdf(defaultName)
    setSavingPdf(false)
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
              <button
                onClick={handleSavePdf}
                disabled={savingPdf}
                style={{
                  padding: '4px 12px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  background: savingPdf ? 'var(--bg-secondary)' : 'var(--accent)',
                  color: savingPdf ? 'var(--text-secondary)' : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: savingPdf ? 'not-allowed' : 'pointer',
                }}
              >
                {savingPdf ? 'PDF 저장 중...' : 'PDF 저장'}
              </button>
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 16px',
                height: 48,
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <img
                src={modelImg}
                alt={modelLabel}
                style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {modelLabel}
              </span>
            </div>

            <div style={{ padding: isStandaloneWindow ? 24 : 16, minHeight: 216 }}>
              {loading && (
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  보고서를 불러오는 중입니다...
                </div>
              )}

              {!loading && error && (
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  보고서를 불러올 수 없습니다: {error}
                </div>
              )}

              {!loading && !error && data && (
                isGpt
                  ? <ReportView data={data as unknown as GptReport} />
                  : <MarkdownRenderer text={JSON.stringify(data, null, 2)} isStreaming={false} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
