import { FiArrowRight, FiCheckCircle, FiFileText } from 'react-icons/fi'

const COMPLETE_STAGE_ROW_HEIGHT = 258

type AnalysisCompleteViewProps = {
  onViewReport: () => void
}

export default function AnalysisCompleteView({
  onViewReport
}: AnalysisCompleteViewProps): React.JSX.Element {
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
          <FiCheckCircle size={18} color="var(--success)" />
          투자 리포트 생성이 완료되었습니다
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          모든 에이전트 분석과 종합 투자 전략 생성을 마쳤습니다. 완성된 보고서를 확인해보세요.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 8,
          minHeight: COMPLETE_STAGE_ROW_HEIGHT
        }}
      >
        <CompleteStageCard
          num={1}
          color="#3B82F6"
          title="데이터 분석 및 밸류에이션"
          description="재무, 업종, 뉴스, 기술 분석과 적정가치 산출"
          isPrimary
        />

        <FlowArrow isComplete />

        <CompleteStageCard
          num={2}
          color="#10B981"
          title="투자 유형 판단"
          description="분석 결과 종합 및 투자 유형 분류"
        />

        <FlowArrow isComplete />

        <CompleteStageCard
          num={3}
          color="#8B5CF6"
          title="투자 전략 생성"
          description="최종 투자 전략 및 제안 생성"
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
          aria-label="분석 진행률 100%"
        >
          <div
            style={{
              height: '100%',
              width: '100%',
              background: 'var(--success)',
              borderRadius: 3
            }}
          />
        </div>

        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--success)',
            minWidth: 28,
            textAlign: 'right'
          }}
        >
          100%
        </span>

        <button
          className="btn-ghost"
          onClick={onViewReport}
          aria-label="완성된 보고서 보기"
          style={{
            flexShrink: 0,
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
    </div>
  )
}

type CompleteStageCardProps = {
  num: number
  color: string
  title: string
  description: string
  isPrimary?: boolean
}

function CompleteStageCard({
  num,
  color,
  title,
  description,
  isPrimary = false
}: CompleteStageCardProps): React.JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        minHeight: COMPLETE_STAGE_ROW_HEIGHT,
        border: `1.5px solid ${color}`,
        borderRadius: 14,
        padding: 14,
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
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
          background: 'rgba(52, 199, 89, 0.1)',
          color: 'var(--success)',
          fontSize: 12,
          fontWeight: 600
        }}
      >
        <FiCheckCircle size={12} />
        완료
      </div>
    </div>
  )
}

function FlowArrow({ isComplete }: { isComplete: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        color: isComplete ? 'var(--success)' : 'var(--text-tertiary)',
        flexShrink: 0
      }}
    >
      <FiArrowRight size={16} />
    </div>
  )
}
