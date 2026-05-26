export interface RecentReport {
  name: string
  company: string
  ticker: string
  daysAgo: number
}

interface Props {
  report: RecentReport
  onConfirmAnalysis: () => void
  onViewReport: () => void
  onCancel: () => void
}

export default function RecentReportModal({
  report,
  onConfirmAnalysis,
  onViewReport,
  onCancel
}: Props): React.JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 8
          }}
        >
          저장된 보고서가 있습니다
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 24
          }}
        >
          <strong>{report.company || report.ticker}</strong> 보고서가{' '}
          {report.daysAgo === 0 ? '오늘' : `${report.daysAgo}일 전`}에 저장되어 있습니다.
          새로 분석하시겠습니까?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onConfirmAnalysis}
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            새로 분석하기
          </button>
          <button
            onClick={onViewReport}
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            기존 보고서 보기
          </button>
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '8px 0',
              background: 'none',
              color: 'var(--text-tertiary)',
              border: 'none',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
