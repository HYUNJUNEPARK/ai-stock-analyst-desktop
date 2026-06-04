import { FiCheckCircle, FiFileText } from 'react-icons/fi'

type AnalysisCompleteViewProps = {
  onViewReport: () => void
}

export default function AnalysisCompleteView({
  onViewReport
}: AnalysisCompleteViewProps): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'inherit',
        gap: 20
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <FiCheckCircle size={48} color="var(--success)" />
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'center',
            lineHeight: 1.5
          }}
        >
          투자 리포트 생성이 완료되었습니다
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            lineHeight: 1.5
          }}
        >
          모든 에이전트 분석과 종합 투자 전략 생성을 마쳤습니다. 완성된 보고서를 확인해보세요.
        </div>
      </div>

      <button
        className="btn-ghost"
        onClick={onViewReport}
        aria-label="완성된 보고서 보기"
        style={{
          width: 'auto',
          height: 'auto',
          padding: '5px 12px',
          borderRadius: 8
        }}
      >
        <FiFileText size={15} />
        보고서 보기
      </button>
    </div>
  )
}
