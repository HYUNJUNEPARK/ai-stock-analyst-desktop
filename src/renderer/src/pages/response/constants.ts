import type { AgentConfig } from './types'

export const AGENT_CONFIG: AgentConfig[] = [
  { key: 'financial-analyst-kr', label: '재무 분석' },
  { key: 'news-sentiment-analyst', label: '뉴스 분석' },
  { key: 'sector-researcher', label: '섹터 리서치' },
  { key: 'invest-type-classifier', label: '투자 유형 판단' },
  { key: 'aggressive-investment-strategist', label: '투자 전략' }
]

export const DEV_PREVIEW_RESPONSE = `# 개발 미리보기 리포트

## 요약
이 화면은 개발 환경에서 UI 확인만 하기 위한 샘플 응답입니다.

### 핵심 포인트
- 실제 CLI 또는 API 호출은 실행하지 않습니다.
- 스트리밍 완료 상태와 레이아웃을 확인할 수 있습니다.
- 복사 버튼과 새 질문 버튼의 배치를 확인할 수 있습니다.

> 프롬프트 입력 화면의 개발 전용 버튼으로 진입한 경우에만 표시됩니다.
`
