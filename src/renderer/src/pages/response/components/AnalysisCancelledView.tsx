import { FiRefreshCw, FiXCircle } from 'react-icons/fi'

type AnalysisCancelledViewProps = {
  onRetry: () => void
}

export default function AnalysisCancelledView({
  onRetry
}: AnalysisCancelledViewProps): React.JSX.Element {
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
        <FiXCircle size={48} color="var(--danger)" />
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'center',
            lineHeight: 1.5
          }}
        >
          투자 리포트 생성이 취소되었습니다
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            lineHeight: 1.5
          }}
        >
          진행 중이던 에이전트 분석을 중단했습니다. 다시 시작하면 처음부터 새로 분석합니다.
        </div>
      </div>

      <button
        className="btn-ghost"
        onClick={onRetry}
        aria-label="분석 다시 시작"
        style={{
          width: 'auto',
          height: 'auto',
          padding: '5px 12px',
          borderRadius: 8
        }}
      >
        <FiRefreshCw size={15} />
        다시 분석
      </button>
    </div>
  )
}
