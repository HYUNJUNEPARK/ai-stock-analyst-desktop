import { FiArrowRight, FiRefreshCw, FiXCircle } from 'react-icons/fi'

const CANCELLED_STAGE_ROW_HEIGHT = 258

type AnalysisCancelledViewProps = {
  onRetry: () => void
}

export default function AnalysisCancelledView({
  onRetry
}: AnalysisCancelledViewProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 'inherit' }}>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 2
          }}
        >
          <FiXCircle size={18} color="var(--danger)" />
          투자 리포트 생성이 취소되었습니다
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          진행 중이던 에이전트 분석을 중단했습니다. 다시 시작하면 처음부터 새로 분석합니다.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 8,
          minHeight: CANCELLED_STAGE_ROW_HEIGHT
        }}
      >
        <CancelledStageCard
          num={1}
          color="#3B82F6"
          title="데이터 분석 및 밸류에이션"
          description="재무, 업종, 뉴스, 기술 분석과 적정가치 산출"
          status="취소됨"
          isPrimary
        />

        <FlowArrow />

        <CancelledStageCard
          num={2}
          color="#10B981"
          title="투자 유형 판단"
          description="분석 결과 종합 및 투자 유형 분류"
          status="취소됨"
        />

        <FlowArrow />

        <CancelledStageCard
          num={3}
          color="#8B5CF6"
          title="투자 전략 생성"
          description="최종 투자 전략 및 제안 생성"
          status="취소됨"
        />
      </div>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div
          style={{
            flex: 1,
            height: 6,
            background: 'var(--border)',
            borderRadius: 3,
            overflow: 'hidden'
          }}
          aria-label="분석 진행률 0%"
        >
          <div
            style={{
              height: '100%',
              width: 0,
              background: 'var(--danger)',
              borderRadius: 3
            }}
          />
        </div>

        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--danger)',
            minWidth: 28,
            textAlign: 'right'
          }}
        >
          취소
        </span>

        <button
          className="btn-ghost"
          onClick={onRetry}
          aria-label="분석 다시 시작"
          style={{
            flexShrink: 0,
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
    </div>
  )
}

type CancelledStageCardProps = {
  num: number
  color: string
  title: string
  description: string
  status: string
  isPrimary?: boolean
}

function CancelledStageCard({
  num,
  color,
  title,
  description,
  status,
  isPrimary = false
}: CancelledStageCardProps): React.JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        minHeight: CANCELLED_STAGE_ROW_HEIGHT,
        border: `1.5px solid ${color}`,
        borderRadius: 14,
        padding: 14,
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: 0.72
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              background: color,
              borderRadius: 6,
              padding: '2px 6px',
              flexShrink: 0
            }}
          >
            {num}단계
          </span>
          <span
            style={{
              fontSize: isPrimary ? 'var(--text-sm)' : 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}
          >
            {title}
          </span>
        </div>
        <div
          style={{
            fontSize: isPrimary ? 'var(--text-xs)' : 10,
            color: 'var(--text-tertiary)',
            lineHeight: isPrimary ? 1.45 : 1.4
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 8px',
          borderRadius: 8,
          background: 'rgba(255, 59, 48, 0.08)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 600
        }}
      >
        <FiXCircle size={12} />
        {status}
      </div>
    </div>
  )
}

function FlowArrow(): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        color: 'var(--text-tertiary)',
        flexShrink: 0
      }}
    >
      <FiArrowRight size={16} />
    </div>
  )
}
