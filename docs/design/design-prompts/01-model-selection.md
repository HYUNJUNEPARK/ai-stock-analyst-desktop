# 화면 1 — 모델 선택 (Model Selection)

> **디자이너 참고**: 이 파일은 Claude Design에게 전달하는 UI 디자인 요청 프롬프트입니다.
> 디자인 시스템 기준은 `00-design-system.md`를 따릅니다.

---

## 화면 목적

앱을 처음 실행했을 때 나타나는 온보딩 첫 화면.
사용자가 GPT 또는 Claude 모델 중 하나를 선택한다.
선택하면 다음 단계(CLI 다운로드)로 진행된다.

---

## 레이아웃 구조

```
┌─────────────────────────────────┐
│  (타이틀바 없음 — 여백으로 시작)   │
│                                 │
│  ── 상단 여백 60px ──            │
│                                 │
│  [앱 아이콘 or 로고]              │  크기: 56×56px, 중앙 정렬
│                                 │
│  AI CLI Launcher                │  text-2xl, bold, 중앙
│  원하는 AI 모델을 선택해 주세요   │  text-sm, text-secondary, 중앙
│                                 │
│  ── 여백 48px ──                │
│                                 │
│  ┌─── GPT 카드 ───┐              │
│  │  [OpenAI 로고]  │              │  카드 너비: 100%, 높이: 100px
│  │  OpenAI GPT    │              │  좌측: 아이콘 48px / 우측: 텍스트
│  │  o3 / o4-mini  │  →           │  우측 끝: chevron.right 아이콘
│  └────────────────┘              │
│                                 │
│  ── 여백 12px ──                │
│                                 │
│  ┌─── Claude 카드 ───┐           │
│  │  [Anthropic 로고] │           │  동일 구조
│  │  Anthropic Claude │           │
│  │  claude-code CLI  │  →        │
│  └───────────────────┘           │
│                                 │
│  ── 여백 auto ──                 │
│                                 │
│  버전 정보 v0.1.0                │  text-xs, text-tertiary, 하단 중앙
│  ── 하단 여백 24px ──            │
└─────────────────────────────────┘
```

---

## 카드 상세 디자인

### 기본 상태
```
background: #FFFFFF
border-radius: 16px
padding: 20px
border: 1.5px solid rgba(0,0,0,0.08)
box-shadow: 0 1px 3px rgba(0,0,0,0.06)

내부 레이아웃: flex, align-items: center, gap: 16px
```

### 아이콘 영역
```
크기: 48×48px
border-radius: 12px (squircle 느낌)
배경:
  GPT → #000000 (검정) + OpenAI 로고(흰색) 또는 "GPT" 텍스트
  Claude → #D97706 (amber) + "C" 텍스트 또는 Anthropic 로고
```

### 텍스트 영역
```
모델명: font-size 17px, font-weight 600, color: var(--text-primary)
부제목: font-size 13px, font-weight 400, color: var(--text-secondary)
```

### Chevron 아이콘
```
SF Symbols: chevron.right 또는 unicode ›
color: var(--text-tertiary)
margin-left: auto
```

### Hover 상태
```
border-color: var(--accent)
box-shadow: 0 0 0 3px var(--accent-light), 0 4px 12px rgba(0,0,0,0.08)
transform: translateY(-1px)
transition: all 0.15s ease
cursor: pointer
```

### Active / Pressed 상태
```
transform: scale(0.99) translateY(0px)
box-shadow: 0 1px 3px rgba(0,0,0,0.06)
```

---

## 로고 / 아이콘 처리 지침

- 실제 OpenAI / Anthropic 공식 로고 SVG를 사용하는 것이 이상적
- SVG 파일이 없는 경우, 브랜드 컬러 + 알파벳 이니셜로 대체:
  - GPT: 검정 원 + "G" 흰색 텍스트
  - Claude: `#D4A853` 원 + "C" 흰색 텍스트

---

## 앱 로고 (상단)

```
형태: 둥근 사각형 아이콘 (56×56px, border-radius: 14px)
배경: linear-gradient(135deg, #007AFF 0%, #5856D6 100%)
내부: 터미널 > 아이콘 또는 번개 아이콘, 흰색
box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3)
```

---

## 접근성 고려사항

- 카드는 `role="button"`, `tabIndex={0}` 적용
- `aria-label`: "OpenAI GPT 선택" / "Anthropic Claude 선택"
- 키보드: Enter / Space로 선택 가능
- 포커스 링: `outline: 2px solid var(--accent)`, `outline-offset: 2px`

---

## 구현 시 주의사항

- 전체 화면을 세로로 채우되 스크롤이 생기지 않도록 레이아웃 설계
- Electron 창은 기본 타이틀바 제거(`titleBarStyle: hidden`) 고려 — 드래그 영역 `-webkit-app-region: drag` 상단에 적용
- 카드 간 세로 정렬: `flex-direction: column`, 너비는 `max-width: 380px`로 제한 후 중앙 정렬
