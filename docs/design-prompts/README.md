# 디자인 프롬프트 모음 — AI CLI Launcher

Claude Design에게 전달할 화면별 UI 디자인 요청 프롬프트 모음.

## 전달 순서

| 파일 | 화면 | 설명 |
|------|------|------|
| [00-design-system.md](00-design-system.md) | 디자인 시스템 | **먼저 읽어야 할 기준** — 색상, 타이포, 컴포넌트 |
| [01-model-selection.md](01-model-selection.md) | 모델 선택 | 앱 첫 화면, GPT/Claude 카드 선택 |
| [02-cli-download.md](02-cli-download.md) | CLI 다운로드 | 설치 중/완료/실패 3가지 상태 |
| [03-auth.md](03-auth.md) | 인증 | API 키 입력 + Claude CLI 로그인 분기 |
| [04-prompt-input.md](04-prompt-input.md) | 프롬프트 입력 | 질문 입력, 자동 확장 textarea |
| [05-response.md](05-response.md) | 응답 확인 | 마크다운 렌더링, 코드 하이라이팅, 스트리밍 |

## 디자인 방향 요약

- **스타일**: 깔끔 모던 + iOS Native 감성
- **색상**: 단 하나의 포인트 컬러 `#007AFF` (iOS Blue)
- **배경**: `#F2F2F7` (iOS systemGroupedBackground)
- **카드**: `border-radius: 16px`, 얇고 가벼운 그림자
- **버튼**: `border-radius: 12~14px`, 풀 너비
- **폰트**: `-apple-system, BlinkMacSystemFont` 체인 (SF Pro 자동 사용)
- **애니메이션**: subtle, 150~200ms ease
