/**
 * 밸류에이션 분석 에이전트 결과 뷰
 * 증권사 목표주가, 시나리오별 적정가, 가격대별 투자 판단을 표시한다.
 */
import LinkText from '../components/LinkText'
import { tryParseJson, getSentimentStyle } from './shared'

export type ValuationData = {
  company: string
  ticker: string
  asOfDate: string
  securitiesReports: { firm: string; url?: string; date: string; opinion: string; targetPrice: string; rationale: string; note: string }[]
  targetPriceRange: { min: string; max: string; avg: string; median: string; summary: string }
  fairValueScenarios: { scenario: string; priceRange: string; assumption: string; valuation: string; vsCurrentPrice: string }[]
  priceZones: { zone: string; judgment: string; interpretation: string; strategy: string }[]
  currentPriceAnalysis: { currentPrice: string; reflectedScenario: string; downsideRisk: string; upsidePotential: string }
  finalVerdict: {
    judgment: string; baseFairValue: string; securitiesTargetRange: string; conservativeFairValue: string; optimisticFairValue: string
    primaryBuyPrice: string; additionalBuyZone: string; cautionZone: string; keyCheckpoints: string; summary: string
  }
}

function isValuationData(v: unknown): v is ValuationData {
  return v != null && typeof v === 'object' && 'finalVerdict' in v && 'fairValueScenarios' in v
}

export function tryParseValuationJson(text: string): ValuationData | null {
  return tryParseJson(text, isValuationData)
}

function getJudgmentStyle(judgment: string) {
  return getSentimentStyle(judgment.includes('저평가') ? '긍정' : judgment.includes('고평가') ? '부정' : '')
}

export default function ValuationAnalysisSection({ data }: { data: ValuationData }): React.JSX.Element {
  const judgmentStyle = getJudgmentStyle(data.finalVerdict.judgment)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 판정 + 현재 주가 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <div style={{ flex: '0 0 auto', padding: '16px 24px', background: judgmentStyle.bg, border: `1px solid ${judgmentStyle.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>밸류에이션</div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 900, color: judgmentStyle.color }}>{data.finalVerdict.judgment}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>현재 주가</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>{data.currentPriceAnalysis.currentPrice}</div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px' }}>
            <LinkText>{data.finalVerdict.summary}</LinkText>
          </div>
        </div>
      </div>

      {/* 핵심 가격 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        <PriceCard label="증권사 목표" value={data.finalVerdict.securitiesTargetRange} />
        <PriceCard label="보수적 적정가" value={data.finalVerdict.conservativeFairValue} />
        <PriceCard label="기준 적정가" value={data.finalVerdict.baseFairValue} color="#2563eb" />
        <PriceCard label="낙관 적정가" value={data.finalVerdict.optimisticFairValue} />
      </div>

      {/* 상승/하락 여력 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', background: '#f0fdf4' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>상승 여력 (낙관 시)</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: '#16a34a' }}>{data.currentPriceAnalysis.upsidePotential}</div>
        </div>
        <div style={{ border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', background: '#fef2f2' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>하락 위험 (보수적 시)</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: '#dc2626' }}>{data.currentPriceAnalysis.downsideRisk}</div>
        </div>
      </div>

      {/* 증권사 리포트 */}
      {data.securitiesReports?.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
            증권사 목표주가
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['증권사', '발행일', '의견', '목표가', '근거'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: '#fff' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.securitiesReports.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', borderBottom: i < data.securitiesReports.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}>
                    {r.url ? (
                      <a href="#" onClick={(e) => { e.preventDefault(); window.api.openExternalUrl(r.url!) }} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{r.firm}</a>
                    ) : r.firm}{r.note && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 4 }}>({r.note})</span>}
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', borderBottom: i < data.securitiesReports.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}>{r.date}</td>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: i < data.securitiesReports.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}>{r.opinion}</td>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', borderBottom: i < data.securitiesReports.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}>{r.targetPrice}</td>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderBottom: i < data.securitiesReports.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}><LinkText>{r.rationale}</LinkText></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 시나리오별 적정주가 */}
      {data.fairValueScenarios?.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>시나리오별 적정주가</div>
          {data.fairValueScenarios.map((s, i) => {
            const scenarioColor = s.scenario.includes('보수') ? '#d97706' : s.scenario.includes('낙관') ? '#16a34a' : '#2563eb'
            return (
              <div key={i} style={{ padding: '12px 14px', borderBottom: i < data.fairValueScenarios.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: scenarioColor, background: `${scenarioColor}15`, border: `1px solid ${scenarioColor}40`, borderRadius: 6, padding: '2px 8px' }}>{s.scenario}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>{s.priceRange}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{s.vsCurrentPrice}</span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}><LinkText>{s.assumption}</LinkText></div>
              </div>
            )
          })}
        </div>
      )}

      {/* 가격대별 투자 판단 */}
      {data.priceZones?.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>가격대별 투자 판단</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['구간', '판단', '해석', '전략'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: '#fff' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.priceZones.map((z, i) => (
                <tr key={i}>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', borderBottom: i < data.priceZones.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}>{z.zone}</td>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', fontWeight: 700, color: getJudgmentStyle(z.judgment).color, borderBottom: i < data.priceZones.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}>{z.judgment}</td>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderBottom: i < data.priceZones.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}><LinkText>{z.interpretation}</LinkText></td>
                  <td style={{ padding: '7px 10px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderBottom: i < data.priceZones.length - 1 ? '1px solid var(--border)' : 'none', background: '#fff' }}><LinkText>{z.strategy}</LinkText></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 매수 기준 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px', background: '#f0fdf4', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#16a34a', marginBottom: 4 }}>1차 관심 매수가</div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#16a34a' }}>{data.finalVerdict.primaryBuyPrice}</div>
        </div>
        <div style={{ border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 12px', background: '#eff6ff', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#2563eb', marginBottom: 4 }}>추가 매수 검토</div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#2563eb' }}>{data.finalVerdict.additionalBuyZone}</div>
        </div>
        <div style={{ border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', background: '#fef2f2', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#dc2626', marginBottom: 4 }}>주의 구간</div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#dc2626' }}>{data.finalVerdict.cautionZone}</div>
        </div>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        본 분석은 공개된 데이터를 기반으로 하며 투자 권유가 아닙니다.
      </div>
    </div>
  )
}

function PriceCard({ label, value, color }: { label: string; value: string; color?: string }): React.JSX.Element {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', background: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: color ?? 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
