import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import gptIcon from '../../assets/gpt.jpg'
import claudeIcon from '../../assets/claude.png'
import GptReportView from '../response/components/GptReportView'
import type { ComponentProps } from 'react'
import MarkdownRenderer from '../response/components/MarkdownRenderer'

type GptReport = ComponentProps<typeof GptReportView>['data']

function renderReport(data: Record<string, unknown>, isGpt: boolean): React.JSX.Element {
  if (isGpt) {
    return <GptReportView data={data as unknown as GptReport} />
  }
  return <MarkdownRenderer text={JSON.stringify(data, null, 2)} isStreaming={false} />
}

export default function ReportDetailPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { name: encodedName } = useParams<{ name: string }>()
  const name = encodedName ? decodeURIComponent(encodedName) : undefined
  const isStandaloneWindow = searchParams.get('mode') === 'window'
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const isGpt = name?.endsWith('.json') ?? false
  const modelImg = isGpt ? gptIcon : claudeIcon
  const modelLabel = isGpt ? 'GPT' : 'Claude'
  const contentWidth = isStandaloneWindow ? 800 : 550

  function handleCloseOrBack(): void {
    if (isStandaloneWindow) {
      window.close()
      return
    }

    navigate('/reports/latest')
  }

  return (
    <div className="page">
      <nav className="nav-bar">
        <button
          className="nav-back"
          onClick={handleCloseOrBack}
          aria-label={isStandaloneWindow ? '닫기' : '뒤로'}
        >
          <svg viewBox="0 0 18 18">
            <polyline points="12,3 6,9 12,15" />
          </svg>
          {isStandaloneWindow ? '닫기' : '뒤로'}
        </button>
        <div className="nav-title">보고서</div>
      </nav>

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

              {!loading && !error && data && renderReport(data, isGpt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
