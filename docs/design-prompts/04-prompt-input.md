# 화면 4 — 프롬프트 입력 (Prompt Input)

> **디자이너 참고**: 이 파일은 Claude Design에게 전달하는 UI 디자인 요청 프롬프트입니다.
> 디자인 시스템 기준은 `00-design-system.md`를 따릅니다.

---

## 화면 목적

사용자가 AI에게 질문을 입력하는 핵심 화면.
최대한 집중감을 주며, 군더더기 없이 입력에만 집중할 수 있게 설계한다.
iOS의 Messages 앱처럼 입력 영역이 자연스럽게 확장된다.

---

## 레이아웃 구조

```
┌─────────────────────────────────┐
│  [모델 배지]        [설정 아이콘]  │  상단 내비게이션 바, 52px
├─────────────────────────────────┤
│                                 │
│  ── 여백 32px ──                │
│                                 │
│  AI에게 질문해 보세요            │  text-xl, bold, 중앙
│  어떤 것이든 물어보세요.         │  text-sm, text-secondary, 중앙
│                                 │
│  ── 여백 24px ──                │
│                                 │
│  ┌─ 입력 카드 ─────────────────┐ │
│  │                             │ │  배경: white, border-radius: 20px
│  │  [textarea]                 │ │  padding: 16px
│  │                             │ │  box-shadow: 0 2px 12px rgba(0,0,0,0.08)
│  │  ───────────────────────── │ │  구분선
│  │  [단축키 힌트]   [글자수]   │ │  높이: auto, 패딩: 12px 16px
│  └─────────────────────────────┘ │
│                                 │
│  ── 여백 auto ──                 │
│                                 │
├─────────────────────────────────┤
│  [제출 버튼]                     │  하단 고정, padding: 16px 24px 32px
└─────────────────────────────────┘
```

---

## 내비게이션 바

```
┌─ 모델 배지 (좌측) ─────────────────────────────── 설정 아이콘 (우측) ─┐
│  ● GPT o3                                                    ⚙️       │
└──────────────────────────────────────────────────────────────────────┘

모델 배지:
  배경: var(--bg-tertiary)
  border-radius: 20px
  padding: 4px 12px
  font-size: 13px, font-weight 500
  color: var(--text-primary)
  앞에 색상 원 (●):
    GPT: #000000
    Claude: #D4A853

설정 아이콘:
  크기: 28×28px 탭 영역 (아이콘은 20×20)
  color: var(--text-secondary)
  hover: var(--text-primary)
  회전 애니메이션: hover 시 90도, transition 200ms
```

---

## 텍스트 입력 카드

### textarea
```css
.prompt-textarea {
  width: 100%;
  min-height: 140px;      /* 약 6줄 */
  max-height: 320px;      /* 최대 높이 (이후 스크롤) */
  border: none;
  outline: none;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  background: transparent;

  /* 자동 높이: JS로 scrollHeight 추적하여 height 조절 */
}
.prompt-textarea::placeholder {
  color: var(--text-tertiary);
}
```

### 카드 전체
```css
.prompt-card {
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
  border: 1.5px solid transparent;
  transition: border-color 0.15s, box-shadow 0.15s;
}
/* textarea 포커스 시 카드 강조 */
.prompt-card:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light), 0 2px 12px rgba(0,0,0,0.08);
}
```

### 카드 하단 바 (toolbar)
```
높이: 44px
border-top: 1px solid var(--border)
display: flex
align-items: center
padding: 0 14px

[좌측] 단축키 힌트:
  ⌘↩ 또는 Ctrl+↩ 로 제출
  font-size: 11px, color: var(--text-tertiary)
  kbd 태그 스타일:
    background: var(--bg-tertiary)
    border-radius: 4px
    padding: 1px 5px
    font-size: 10px
    font-family: monospace

[우측] 글자 수 카운터:
  font-size: 11px, color: var(--text-tertiary)
  임박 경고 (4000자 초과): color: --warning
  초과 (5000자 이상): color: --danger
```

---

## 제출 버튼

```
기본: 100% 너비, height 52px
border-radius: 14px
font-size: 17px, font-weight 600

비활성 (textarea 비어있음):
  opacity: 0.35
  cursor: not-allowed

활성:
  background: var(--accent)
  color: #fff
  + 아이콘: ↑ (send 스타일, 우측)
  또는 "제출" 텍스트 + send 아이콘

hover (활성):
  background: var(--accent-hover)

active:
  transform: scale(0.98)
```

**버튼 내부 레이아웃:**
```
[       제출  ↑       ]
         ← 텍스트 + 아이콘 gap 8px
```

---

## 빈 상태 힌트 (Empty State)

textarea에 아무 것도 없을 때 카드 중앙에 표시:

```
(textarea placeholder 외에 카드 하단에 예시 질문 칩 추가 - 선택사항)

┌─ 예시 질문 (선택 옵션) ─────────────┐
│  💡 이 코드의 버그를 찾아줘          │  → 클릭 시 textarea에 삽입
│  📝 이메일 초안 작성해줘             │
│  🔍 이 개념을 설명해줘              │
└──────────────────────────────────────┘

칩 스타일:
  background: var(--bg-primary)
  border: 1px solid var(--border)
  border-radius: 20px
  padding: 8px 14px
  font-size: 13px
  flex-wrap: wrap
  display: inline-flex
```

---

## 반응형 동작

- textarea가 확장될 때 카드도 자연스럽게 늘어남
- 제출 버튼은 항상 화면 하단에 고정
- 카드가 버튼과 겹칠 정도로 커지면 카드 영역이 스크롤 가능하게 전환

---

## 접근성 고려사항

- textarea: `aria-label="AI 질문 입력"`
- 글자수: `aria-live="polite"`, `aria-label="글자 수: N"`
- 제출 버튼: `aria-disabled` (비활성 시)
- 단축키: `Ctrl+Enter` / `Cmd+Enter` (platform 감지 후 힌트 표시)
