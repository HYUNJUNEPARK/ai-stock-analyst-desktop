/**
 * 기술적(차트) 분석 에이전트 결과 뷰
 * 이동평균선, RSI/MACD, 볼린저밴드, 거래량, 지지/저항선 등 기술적 지표를 표시한다.
 */
import LinkText from '../components/LinkText'

export type PriceData = {
  company: string
  ticker: string
  asOfDate: string
  sources?: { name: string; url: string }[]
  currentPrice: {
    price: string
    returns: { '1w': string; '1m': string; '3m': string; ytd: string }
  }
  movingAverages: {
    data: { period: string; value: string; position: string }[]
    trendVerdict: string
    interpretation: string
  }
  momentum: {
    rsi: { value: string; interpretation: string }
    macd: { macd: string; signal: string; histogram: string; interpretation: string }
  }
  bollingerBands: {
    upper: string; middle: string; lower: string; percentB: string; interpretation: string
  }
  volume: { recent: string; avg20d: string; ratio: string; interpretation: string }
  supportResistance: { type: string; price: string; rationale: string }[]
  week52: { high: string; low: string; currentPosition: string; interpretation: string }
  chartPattern: { name: string; reliability: string; implication: string }
  technicalSummary: {
    signals: { trend: string; momentum: string; volatility: string; volume: string; supportResistance: string }
    entryPrice: string
    rationale: string
  }
}

export function tryParsePriceJson(text: string): PriceData | null {
  if (!text.trim()) return null
  try {
    const parsed = JSON.parse(text.trim())
    if (parsed && parsed.technicalSummary && parsed.movingAverages) return parsed as PriceData
    return null
  } catch {
    return null
  }
}

function getSignalColor(signal: string): string {
  if (['상승', '강세', '확장', '증가', '지지권'].some((k) => signal.includes(k))) return '#16a34a'
  if (['하락', '약세', '수축', '감소', '저항권'].some((k) => signal.includes(k))) return '#dc2626'
  return '#d97706'
}

function getTrendStyle(verdict: string): { color: string; bg: string; border: string } {
  if (verdict.includes('상승')) return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
  if (verdict.includes('하락')) return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
  return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
}

export default function PriceAnalysisSection({ data }: { data: PriceData }): React.JSX.Element {
  const trendStyle = getTrendStyle(data.movingAverages.trendVerdict)
  const signals = data.technicalSummary.signals

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 현재 주가 + 기간별 수익률 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <div style={{ padding: '16px 24px', background: trendStyle.bg, border: `1px solid ${trendStyle.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flex: '0 0 auto' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>추세 판정</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: trendStyle.color }}>{data.movingAverages.trendVerdict}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>현재 주가</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>{data.currentPrice.price}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
            {([['1W', data.currentPrice.returns['1w']], ['1M', data.currentPrice.returns['1m']], ['3M', data.currentPrice.returns['3m']], ['YTD', data.currentPrice.returns.ytd]] as [string, string][]).map(([label, val]) => (
              <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', textAlign: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{label}</div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: val?.startsWith('-') ? '#dc2626' : '#16a34a' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 데이터 출처 */}
      {data.sources && data.sources.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '0 4px' }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>출처:</span>
          {data.sources.map((s, i) => (
            s.url ? (
              <a
                key={i}
                href="#"
                onClick={(e) => { e.preventDefault(); window.api.openExternalUrl(s.url) }}
                style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}
              >
                {s.name}
              </a>
            ) : (
              <span key={i} style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{s.name}</span>
            )
          ))}
        </div>
      )}

      {/* 이동평균선 */}
      <SimpleTable
        title="이동평균선"
        columns={['구분', '수치', '현재가 대비']}
        rows={data.movingAverages.data.map((d) => [d.period + ' MA', d.value, d.position])}
        interpretation={data.movingAverages.interpretation}
      />

      {/* 모멘텀 (RSI + MACD) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MetricCard title="RSI (14일)" value={data.momentum.rsi.value} interpretation={data.momentum.rsi.interpretation} />
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>MACD</div>
          <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', display: 'flex', gap: 12 }}>
            {[['MACD', data.momentum.macd.macd], ['Signal', data.momentum.macd.signal], ['Hist', data.momentum.macd.histogram]].map(([l, v]) => (
              <div key={l as string} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{l}</div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
            <LinkText>{data.momentum.macd.interpretation}</LinkText>
          </div>
        </div>
      </div>

      {/* 볼린저 밴드 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>볼린저 밴드 (20일, 2σ)</div>
        <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', display: 'flex', gap: 12 }}>
          {[['상단', data.bollingerBands.upper], ['중간', data.bollingerBands.middle], ['하단', data.bollingerBands.lower], ['%B', data.bollingerBands.percentB]].map(([l, v]) => (
            <div key={l as string} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{l}</div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
          <LinkText>{data.bollingerBands.interpretation}</LinkText>
        </div>
      </div>

      {/* 거래량 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>거래량 분석</div>
        <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', display: 'flex', gap: 12 }}>
          {[['최근', data.volume.recent], ['20일 평균', data.volume.avg20d], ['비율', data.volume.ratio]].map(([l, v]) => (
            <div key={l as string} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{l}</div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
          <LinkText>{data.volume.interpretation}</LinkText>
        </div>
      </div>

      {/* 지지/저항선 */}
      {data.supportResistance?.length > 0 && (
        <SimpleTable
          title="지지선 / 저항선"
          columns={['구분', '가격', '근거']}
          rows={data.supportResistance.map((s) => [s.type, s.price, s.rationale])}
        />
      )}

      {/* 52주 고저 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricCard title="52주 고가" value={data.week52.high} />
        <MetricCard title="52주 저가" value={data.week52.low} />
        <MetricCard title="현재 위치" value={data.week52.currentPosition} />
      </div>
      {data.week52.interpretation && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px', marginTop: -8 }}>
          <LinkText>{data.week52.interpretation}</LinkText>
        </div>
      )}

      {/* 차트 패턴 */}
      {data.chartPattern?.name && data.chartPattern.name !== '특이 패턴 없음' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>차트 패턴</div>
          <div style={{ padding: '12px 14px', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{data.chartPattern.name}</span>
              {data.chartPattern.reliability && (
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 6px' }}>신뢰도: {data.chartPattern.reliability}</span>
              )}
            </div>
            {data.chartPattern.implication && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}><LinkText>{data.chartPattern.implication}</LinkText></div>
            )}
          </div>
        </div>
      )}

      {/* 기술적 종합 판정 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>기술적 종합 판정</div>
        <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries({ '추세': signals.trend, '모멘텀': signals.momentum, '변동성': signals.volatility, '거래량': signals.volume, '지지/저항': signals.supportResistance }).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: getSignalColor(val) }}>{val}</span>
            </div>
          ))}
        </div>
        {data.technicalSummary.entryPrice && (
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>진입 적합 가격대: </span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>{data.technicalSummary.entryPrice}</span>
          </div>
        )}
        <div style={{ padding: '10px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
          <LinkText>{data.technicalSummary.rationale}</LinkText>
        </div>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        본 분석은 기술적 지표 기반이며 투자 권유가 아닙니다.
      </div>
    </div>
  )
}

function SimpleTable({ title, columns, rows, interpretation }: { title: string; columns: string[]; rows: string[][]; interpretation?: string }): React.JSX.Element {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '7px 14px', fontSize: 'var(--text-xs)', color: j === 0 ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: j === 0 ? 400 : 600, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-primary)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {interpretation && (
        <div style={{ padding: '10px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, borderTop: '1px solid var(--border)', background: '#f8fafc' }}><LinkText>{interpretation}</LinkText></div>
      )}
    </div>
  )
}

function MetricCard({ title, value, interpretation }: { title: string; value: string; interpretation?: string }): React.JSX.Element {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ padding: '14px', background: 'var(--bg-primary)' }}>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      </div>
      {interpretation && (
        <div style={{ padding: '10px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, borderTop: '1px solid var(--border)', background: '#f8fafc' }}><LinkText>{interpretation}</LinkText></div>
      )}
    </div>
  )
}
