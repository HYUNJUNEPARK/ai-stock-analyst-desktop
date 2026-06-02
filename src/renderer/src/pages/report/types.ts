/**
 * 종합 보고서 데이터 타입 정의
 * ReportView 및 각 섹션 컴포넌트에서 공유하는 타입들
 */

export type InvestType = {
  type: string
  coreIdea: string
  suitableHorizon: string
  investmentThesisBreakers: string[]
}

export type PricePoint = {
  price: string
  source: string
  rationale: string
}

export type AgentVerdicts = {
  financial?: { grade: string; summary: string }
  news?: { sentiment: string; summary: string }
  sector?: { outlook: string; summary: string }
  price?: { verdict: string; summary: string }
  valuation?: { position: string; summary: string }
  investType?: { type: string; summary: string }
}

export type InvestmentStrategy = {
  entryStrategy: string
  positionSizing: string
  actionPlan: string[]
  exitStrategy: string
  timeHorizon: string
  caution: string
}

export type Report = {
  company: string
  ticker: string
  asOfDate: string
  'ai-model'?: string
  aiInfo?: {
    provider?: string
    model?: string
    engine?: string
  }
  artifactDir?: string
  verdict: string
  verdictEmoji: string
  summary: string
  investType?: InvestType
  agentVerdicts?: AgentVerdicts
  analysis: {
    financial: { signal: string; content: string }
    news: { signal: string; content: string }
    sector: { signal: string; content: string }
    price?: { signal?: string; content: string }
    strategist: string
  }
  strategy: {
    currentPrice: string
    targetReturn: string
    targetPrice?: string
    stopLoss: string
    stopLossPrice?: string
    targetPrices?: PricePoint[]
    stopLossPrices?: PricePoint[]
    recommendedBuyPrice?: string
    recommendedBuyPriceBasis?: string
    buyPriceRationale?: string
  }
  investmentStrategy?: InvestmentStrategy
  valuation?: {
    securitiesTargetRange?: string
    fairValueConservative?: string
    fairValueBase?: string
    fairValueOptimistic?: string
    currentPricePosition?: string
    valuationSummary?: string
  }
}

export type ArtifactTab = 'summary' | 'financial' | 'news' | 'sector' | 'price' | 'valuation' | 'invest-type'
