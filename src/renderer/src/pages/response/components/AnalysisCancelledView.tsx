type AnalysisCancelledViewProps = {
  onRetry: () => void
}

export default function AnalysisCancelledView({
  onRetry
}: AnalysisCancelledViewProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'inherit' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)'
        }}
      >
        분석을 취소했습니다.
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
        <button className="btn-ghost" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    </div>
  )
}
