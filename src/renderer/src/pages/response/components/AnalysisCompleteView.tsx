type AnalysisCompleteViewProps = {
  onViewReport: () => void
}

export default function AnalysisCompleteView({
  onViewReport
}: AnalysisCompleteViewProps): React.JSX.Element {
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
        분석이 완료되었습니다.
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
        <button className="btn-ghost" onClick={onViewReport}>
          보고서 보기
        </button>
      </div>
    </div>
  )
}
