# 단계 7 - 전체 UI 스타일링 및 UX 다듬기

## 목표
- 일관된 디자인 시스템 적용 (다크 테마 기반)
- 각 화면 간 트랜지션 추가
- 반응형 레이아웃 및 접근성 개선

## 프롬프트

```
전체 앱의 UI를 다듬어 주세요. 현재 Electron 앱이며 창 크기는 고정 또는 최소 800x600 기준입니다.

디자인 방향:
- 다크 테마 (배경: #1a1a1a 계열, 텍스트: #e0e0e0)
- 포인트 컬러: GPT 선택 시 초록 계열 (#10a37f), Claude 선택 시 보라 계열 (#7c3aed)
- 폰트: 시스템 기본 폰트 (sans-serif)

작업 항목:

1. src/renderer/src/assets/main.css 에 전체 공통 스타일을 정의합니다:
   - CSS 변수로 색상 팔레트 정의
   - 공통 버튼 스타일 (.btn-primary, .btn-secondary, .btn-danger)
   - 공통 입력 스타일 (.input-field)
   - 카드 컴포넌트 스타일 (.card)
   - 페이지 레이아웃 (.page-container, .page-header, .page-body)

2. 각 페이지에 페이지 전환 애니메이션 추가:
   - fade-in 효과 (opacity 0 → 1, 0.2s ease)

3. ModelSelectionPage:
   - 선택 카드에 hover 시 scale(1.02) 효과
   - 선택된 카드는 포인트 컬러 테두리

4. CliDownloadPage:
   - 터미널 스타일 로그 박스 (배경: #0d0d0d, 폰트: monospace, 초록 텍스트)

5. AuthPage:
   - 입력 필드 focus 시 포인트 컬러 테두리 glow 효과

6. PromptPage:
   - textarea 스타일 (어두운 배경, 밝은 텍스트, 부드러운 테두리)

7. ResponsePage:
   - 마크다운 렌더링 스타일 (코드 블록 배경색, 헤더 크기, 링크 색상)
   - 긴 응답을 위한 스크롤 영역

8. 공통 레이아웃 컴포넌트 src/renderer/src/components/Layout.tsx 생성:
   - 앱 전체를 감싸는 최외곽 컨테이너
   - 선택한 모델에 따라 포인트 컬러 변경
```
