/**
 * 기술적 분석 가이드 — 타입 및 이미지 매핑
 */
import data from '../../../../data/technical-analysis-terms.json'
import imgRegularAlignment from '../../../../assets/technical_bullish_moving_average_alignment.png'
import imgReverseAlignment from '../../../../assets/technical_bearish_moving_average_alignment.png'
import imgConvergence from '../../../../assets/technical_moving_average_convergence.png'
import imgGoldenCross from '../../../../assets/technical_golden_cross_signal.png'
import imgDeadCross from '../../../../assets/technical_death_cross_signal.png'

export type Term = (typeof data.categories)[number]['terms'][number]
export type Category = (typeof data.categories)[number]

export const termImages: Record<string, string> = {
  regularAlignment: imgRegularAlignment,
  reverseAlignment: imgReverseAlignment,
  maConvergence: imgConvergence,
  goldenCross: imgGoldenCross,
  deadCross: imgDeadCross
}
