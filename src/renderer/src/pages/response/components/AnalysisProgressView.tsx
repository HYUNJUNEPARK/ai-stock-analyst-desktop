import { useEffect, useRef, useState } from 'react'
import {
  FiArrowRight,
  FiClock,
  FiTarget,
  FiUsers,
} from 'react-icons/fi'
import {
  IoNewspaperOutline,
  IoDiamondOutline,
  IoDocumentTextOutline
} from "react-icons/io5";
import { FaChartLine } from "react-icons/fa6";
import ConfirmDialog from '../../../components/ConfirmDialog'
import { AGENT_CONFIG } from '../constants'
import type { AgentStatus } from '../types'
import { LuScale } from "react-icons/lu";
import { StageBadge, StageCard, AgentCard, ValuationCard } from './StageComponents'

type AnalysisProgressViewProps = {
  agentStatuses: Record<string, AgentStatus>
  onCancel: () => void
  showAgentFlow: boolean
}

export default function AnalysisProgressView({
  agentStatuses,
  onCancel,
  showAgentFlow
}: AnalysisProgressViewProps): React.JSX.Element {
  const [showConfirm, setShowConfirm] = useState(false)

  const [financial, sector, news, price, valuation, classifier, strategy] = AGENT_CONFIG

  const doneCount = Object.values(agentStatuses).filter((s) => s === 'done').length
  const anyRunningOrDone = Object.values(agentStatuses).some((s) => s === 'running' || s === 'done')
  const isValidating = !anyRunningOrDone
  const progressPct = Math.round((doneCount / AGENT_CONFIG.length) * 100)

  // 검증 배너: 사라질 때 fade-out 애니메이션을 위해 DOM 제거를 지연
  const [showValidationBanner, setShowValidationBanner] = useState(isValidating)
  const [validationFadingOut, setValidationFadingOut] = useState(false)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isValidating) {
      // 검증 중으로 돌아온 경우 (retry 등)
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
      setValidationFadingOut(false)
      setShowValidationBanner(true)
    } else if (showValidationBanner && !validationFadingOut) {
      // 검증 끝남 → fade-out 시작
      setValidationFadingOut(true)
      fadeTimerRef.current = setTimeout(() => {
        setShowValidationBanner(false)
        setValidationFadingOut(false)
        fadeTimerRef.current = null
      }, 400)
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [isValidating]) // eslint-disable-line react-hooks/exhaustive-deps

  const chainADone =
    agentStatuses[financial.key] === 'done' && agentStatuses[sector.key] === 'done'
  const wave1Done =
    chainADone &&
    agentStatuses[valuation.key] === 'done' &&
    agentStatuses[news.key] === 'done' &&
    agentStatuses[price.key] === 'done'
  const classifierDone = agentStatuses[classifier?.key] === 'done'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 헤더 */}
      <div>
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 2
          }}
        >
          투자 리포트 생성 중
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          에이전트별 분석을 마친 후 종합 투자 분석이 진행됩니다.
        </div>
      </div>

      {/* 입력 검증 중 안내 */}
      {showAgentFlow && showValidationBanner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: validationFadingOut ? '0 14px' : '10px 14px',
            borderRadius: 10,
            background: 'var(--accent-light, #EFF6FF)',
            border: validationFadingOut ? '1px solid transparent' : '1px solid var(--accent, #3B82F6)',
            opacity: validationFadingOut ? 0 : 1,
            maxHeight: validationFadingOut ? 0 : 60,
            marginBottom: validationFadingOut ? -16 : 0,
            overflow: 'hidden',
            transition: 'opacity 0.35s ease, max-height 0.4s ease, margin-bottom 0.4s ease, padding 0.4s ease, border-color 0.35s ease',
          }}
        >
          <div
            className="spinner"
            style={{
              width: 16,
              height: 16,
              borderTopColor: 'var(--accent, #3B82F6)',
              flexShrink: 0
            }}
          />
          <div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 2
              }}
            >
              종목을 확인하고 있습니다
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'pre-line' }}>
              {'종목명과 현재 주가를 확인하는 중입니다. 잠시만 기다려 주세요. (약 1-3분 소요)'}
            </div>
          </div>
        </div>
      )}

      {showAgentFlow ? (
        <>
          {/* 3단계 카드 레이아웃 */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
            {/* 1단계 카드 */}
            <div
              style={{
                flex: '0 0 340px',
                border: '2px solid var(--accent)',
                borderRadius: 14,
                padding: 14,
                background: 'var(--bg-secondary)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StageBadge num={1} color="#3B82F6" />
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    데이터 분석 및 밸류에이션
                  </span>
                </div>

              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 12
                }}
              >
                기업 및 시장 데이터 분석 → 적정가치 산출
              </div>

              {/* 2×2 그리드 + → + 밸류에이션 */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    flex: 1
                  }}
                >
                  <AgentCard
                    icon={<IoDocumentTextOutline size={14} />}
                    label="재무 분석"
                    description={'기업 재무제표 및\n재무 건전성 분석'}
                    status={agentStatuses[financial.key] ?? 'idle'}
                  />
                  <AgentCard
                    icon={<FiUsers size={14} />}
                    label="업종 리서치"
                    description={'산업 동향 및\n경쟁사 분석'}
                    status={agentStatuses[sector.key] ?? 'idle'}
                  />
                  <AgentCard
                    icon={<IoNewspaperOutline size={14} />}
                    label="뉴스 분석"
                    description={'뉴스 수집 및\n감성 분석'}
                    status={agentStatuses[news.key] ?? 'idle'}
                  />
                  <AgentCard
                    icon={<FaChartLine size={14} />}
                    label="기술 분석"
                    description={'주가 흐름 및\n기술적 지표 분석'}
                    status={agentStatuses[price.key] ?? 'idle'}
                  />
                </div>

                <ValuationCard
                  icon={<IoDiamondOutline size={24} />}
                  label="밸류에이션"
                  description={'재무 + 업종 분석\n결과 기반\n적정가치 산출'}
                  status={agentStatuses[valuation.key] ?? 'idle'}
                />
              </div>
            </div>

            {/* → 화살표 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: wave1Done ? 'var(--accent)' : 'var(--text-tertiary)',
                flexShrink: 0,
                transition: 'color 0.3s'
              }}
            >
              <FiArrowRight size={16} />
            </div>

            {/* 2단계 카드 */}
            <StageCard
              num={2}
              color="#10B981"
              iconBg="#D1FAE5"
              iconColor="#34D399"
              title="투자 유형 판단"
              description={'1단계 분석 결과 종합하여\n투자 유형 판단'}
              icon={<LuScale size={28} />}
              status={agentStatuses[classifier?.key] ?? 'idle'}
            />

            {/* → 화살표 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: classifierDone ? 'var(--accent)' : 'var(--text-tertiary)',
                flexShrink: 0,
                transition: 'color 0.3s'
              }}
            >
              <FiArrowRight size={16} />
            </div>

            {/* 3단계 카드 */}
            <StageCard
              num={3}
              color="#8B5CF6"
              iconBg="#EDE9FE"
              iconColor="#A78BFA"
              title="투자 전략 생성"
              description={'최종 투자 전략 및 제안'}
              icon={<FiTarget size={28} />}
              status={agentStatuses[strategy?.key] ?? 'idle'}
            />
          </div>

          {/* 진행률 + 취소 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
                flexShrink: 0
              }}
            >
              <FiClock size={12} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span>예상 완료 시간</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>약 4~8분</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)'
                }}
              >
                전체 진행률
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'var(--border)',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: 'var(--accent)',
                      borderRadius: 3,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    minWidth: 28,
                    textAlign: 'right'
                  }}
                >
                  {progressPct}%
                </span>
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={() => setShowConfirm(true)}
              aria-label="분석 취소"
              style={{
                flexShrink: 0,
                width: 'auto',
                height: 'auto',
                padding: '5px 12px',
                borderRadius: 8
              }}
            >
              분석 취소
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 'auto',
            paddingTop: 8
          }}
        >
          <button className="btn-ghost" onClick={() => setShowConfirm(true)} aria-label="분석 취소">
            분석 취소
          </button>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="분석을 취소하시겠습니까?"
          message="취소하면 분석 결과를 받을 수 없으며, 이미 소모된 토큰은 되돌릴 수 없습니다."
          confirmLabel="취소"
          cancelLabel="계속 분석"
          onConfirm={onCancel}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
