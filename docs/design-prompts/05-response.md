# 화면 5 — 응답 확인 (Response)

> **디자이너 참고**: 이 파일은 Claude Design에게 전달하는 UI 디자인 요청 프롬프트입니다.
> 디자인 시스템 기준은 `00-design-system.md`를 따릅니다.

---

## 화면 목적

AI의 응답을 스트리밍으로 수신하며 실시간으로 보여주는 화면.
마크다운 렌더링, 코드 하이라이팅을 지원하며
응답 완료 후 복사 및 새 질문 기능을 제공한다.

---

## 상태별 화면 설계

---

### 상태 1 — 로딩 / 스트리밍 (Streaming)

```
┌─────────────────────────────────┐
│  ← 취소                  [모델]  │  nav-bar, 52px
├─────────────────────────────────┤
│                                 │
│  ── 여백 20px ──                │
│                                 │
│  ┌─ 내 질문 버블 ─────────────┐  │
│  │ 이 코드에서 버그를 찾아줘   │  │  우측 정렬 버블
│  └─────────────────────────── ┘  │  배경: var(--accent)
│                                 │  color: white
│  ── 여백 16px ──                │  border-radius: 18px 18px 4px 18px
│                                 │
│  ┌─ AI 응답 영역 ─────────────┐  │  좌측 정렬
│  │  [아이콘]                   │  │
│  │                             │  │
│  │  네, 코드를 분석해 보겠습...│  │  텍스트 스트리밍 중
│  │  ▌ (커서 블링크)            │  │
│  │                             │  │
│  └─────────────────────────── ┘  │
│                                 │
│  ── 여백 auto ──                │
└─────────────────────────────────┘
```

---

### 상태 2 — 완료 (Complete)

```
┌─────────────────────────────────┐
│  ← 뒤로                  [모델]  │  nav-bar
├─────────────────────────────────┤  스크롤 가능 영역
│                                 │
│  ┌─ 내 질문 버블 ─────────────┐  │
│  │ 이 코드에서 버그를 찾아줘   │  │  우측 정렬
│  └─────────────────────────── ┘  │
│                                 │
│  ┌─ AI 응답 카드 ─────────────┐  │  좌측 정렬, 카드 형태
│  │ [모델 아이콘]  Claude Code  │  │  카드 헤더
│  │ ─────────────────────────  │  │
│  │                             │  │
│  │  [마크다운 렌더링 영역]     │  │
│  │                             │  │
│  │  # 발견된 버그              │  │
│  │  1. 변수 미초기화           │  │
│  │  ```python                  │  │  코드 블록: 다크 테마
│  │  def foo():                 │  │
│  │    x = x + 1  # ← 오류    │  │
│  │  ```                        │  │
│  │                             │  │
│  │  [복사] [공유]              │  │  카드 하단 액션
│  └─────────────────────────── ┘  │
│                                 │
│  ── 여백 100px ──                │  하단 버튼 영역 확보
└─────────────────────────────────┘

├─────────────────────────────────┤
│  [새 질문하기]                   │  primary button
│  ── 여백 20px ──                 │
└─────────────────────────────────┘
```

---

### 상태 3 — 오류 (Error)

```
┌─────────────────────────────────┐
│  ← 뒤로                         │
├─────────────────────────────────┤
│                                 │
│  ┌─ 내 질문 버블 ─────────────┐  │
│  │ 이 코드에서 버그를 찾아줘   │  │
│  └─────────────────────────── ┘  │
│                                 │
│  ┌─ 오류 카드 ─────────────── ┐  │
│  │  ⚠  응답을 가져오지 못했   │  │  배경: #FFF0EF
│  │     습니다                  │  │  border-left: 3px --danger
│  │                             │  │
│  │  API 한도를 초과했거나      │  │
│  │  네트워크 문제일 수 있습니다│  │
│  └─────────────────────────── ┘  │
│                                 │
├─────────────────────────────────┤
│  [다시 시도]                     │  primary (--danger 계열)
│  ── 여백 12px ──                 │
│  [새 질문하기]                   │  ghost button
│  ── 여백 20px ──                 │
└─────────────────────────────────┘
```

---

## 질문 버블 상세

```css
.question-bubble {
  align-self: flex-end;           /* 우측 정렬 */
  max-width: 80%;
  background: var(--accent);
  color: #FFFFFF;
  border-radius: 18px 18px 4px 18px;  /* iOS 말풍선 */
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}
```

---

## AI 응답 카드 상세

### 카드 헤더
```
높이: 48px
배경: var(--bg-primary)
border-bottom: 1px solid var(--border)
padding: 0 16px
display: flex, align-items: center, gap: 10px

모델 아이콘: 24×24px, border-radius: 6px
모델명: font-size 13px, font-weight 600, color: var(--text-secondary)
```

### 응답 콘텐츠 영역
```css
.response-content {
  padding: 16px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
}

/* 마크다운 요소 스타일 */
.response-content h1 { font-size: 20px; font-weight: 700; margin: 20px 0 10px; }
.response-content h2 { font-size: 17px; font-weight: 600; margin: 16px 0 8px; }
.response-content h3 { font-size: 15px; font-weight: 600; margin: 12px 0 6px; }
.response-content p  { margin: 0 0 12px; }
.response-content ul, .response-content ol { padding-left: 20px; margin-bottom: 12px; }
.response-content li { margin-bottom: 4px; }

/* 인라인 코드 */
.response-content code {
  background: var(--bg-tertiary);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 13px;
  color: #D73A49;  /* 붉은 모노 컬러 */
}

/* 구분선 */
.response-content hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 16px 0;
}

/* blockquote */
.response-content blockquote {
  border-left: 3px solid var(--accent);
  margin: 0;
  padding: 4px 0 4px 14px;
  color: var(--text-secondary);
  font-style: italic;
}
```

### 코드 블록
```css
.code-block-wrapper {
  border-radius: 10px;
  overflow: hidden;
  margin: 12px 0;
  border: 1px solid rgba(0,0,0,0.06);
}

/* 코드 헤더 바 (언어 + 복사 버튼) */
.code-block-header {
  background: #2D2D2D;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.code-language-label {
  font-size: 11px;
  color: #888;
  font-family: monospace;
  text-transform: uppercase;
}
.code-copy-btn {
  font-size: 11px;
  color: #888;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.code-copy-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }

/* 코드 영역 (react-syntax-highlighter: vscDarkPlus 테마 권장) */
.code-block-body {
  font-size: 13px;
  line-height: 1.6;
  padding: 12px 16px;
  overflow-x: auto;
  background: #1E1E1E;
}
```

---

## 스트리밍 커서 애니메이션

```css
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--accent);
  border-radius: 1px;
  margin-left: 2px;
  animation: blink 0.8s ease-in-out infinite;
  vertical-align: text-bottom;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
```

---

## 카드 하단 액션 바

```
높이: 44px
border-top: 1px solid var(--border)
padding: 0 14px
display: flex, gap: 8px

버튼들 (아이콘 + 텍스트):
  [📋 복사]  → 클릭 시 "✓ 복사됨" 으로 1.5초 변경
  [↗ 공유]  (선택 사항)

버튼 스타일:
  background: none
  border: none
  font-size: 13px
  color: var(--text-secondary)
  padding: 6px 10px
  border-radius: 8px
  cursor: pointer
  gap: 4px (아이콘 + 텍스트)
  hover: background var(--bg-primary)
```

---

## 하단 고정 버튼 영역

```css
.response-footer {
  position: sticky;
  bottom: 0;
  background: rgba(242, 242, 247, 0.92);
  backdrop-filter: blur(16px);
  padding: 12px 24px 32px;   /* 32px: macOS 하단 안전 영역 */
  border-top: 0.5px solid var(--border);
}
```

**새 질문하기 버튼:**
```
텍스트: "+ 새 질문하기"
아이콘: + 또는 pencil.and.outline
height: 52px
border-radius: 14px
```

---

## 접근성 고려사항

- 응답 영역: `role="article"`, `aria-label="AI 응답"`
- 스트리밍 중: `aria-live="polite"` (너무 잦으면 성능 이슈 — chunk 단위가 아닌 문장 단위로 업데이트)
- 복사 버튼: `aria-label="응답 복사"`, 완료 시 `"복사됨"` (스크린 리더 알림)
- 코드 블록: `role="region"`, `aria-label="코드 예시: {언어}"`
