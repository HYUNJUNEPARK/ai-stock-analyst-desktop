# 화면 2 — CLI 다운로드 (CLI Download)

> **디자이너 참고**: 이 파일은 Claude Design에게 전달하는 UI 디자인 요청 프롬프트입니다.
> 디자인 시스템 기준은 `00-design-system.md`를 따릅니다.

---

## 화면 목적

모델 선택 후, OS에 맞는 CLI를 자동으로 설치하는 진행 화면.
설치 로그를 실시간으로 보여주며 사용자에게 진행 상황을 전달한다.
설치 완료/실패에 따라 다음 단계로 안내한다.

---

## 상태별 화면 설계

이 화면은 3가지 상태를 가진다: **설치 중 / 완료 / 실패**

---

### 상태 1 — 설치 중 (Installing)

```
┌─────────────────────────────────┐
│  ← (뒤로 버튼 — 설치 중 비활성)  │  nav-bar, 높이 52px
├─────────────────────────────────┤
│                                 │
│  ── 여백 40px ──                │
│                                 │
│  [스피너 애니메이션]              │  40×40px 중앙
│                                 │
│  ── 여백 20px ──                │
│                                 │
│  CLI 설치 중                    │  text-xl, semibold, 중앙
│  잠시만 기다려 주세요...          │  text-sm, text-secondary, 중앙
│                                 │
│  ── 여백 8px ──                 │
│                                 │
│  npm install -g @anthropic...   │  text-xs, text-tertiary, 중앙 (현재 실행 명령)
│                                 │
│  ── 여백 24px ──                │
│                                 │
│  ┌─ 터미널 로그 박스 ─────────┐   │
│  │ $ npm install -g @anthr.. │   │  다크 배경 터미널
│  │ added 1024 packages...    │   │  폰트: monospace 12px
│  │ > [████████░░] 80%        │   │  색상: #98FB98 (연한 초록)
│  │ ...                       │   │  높이: 200px, overflow-y: scroll
│  └───────────────────────────┘   │  border-radius: 12px
│                                 │
│  ── 여백 auto ──                 │
└─────────────────────────────────┘
```

**스피너 디자인:**
```
iOS activity indicator 스타일
두께 2.5px 원호, --accent 색상
회전 애니메이션 0.8s linear infinite
```

---

### 상태 2 — 설치 완료 (Success)

```
┌─────────────────────────────────┐
│  ← 뒤로                         │  nav-bar
├─────────────────────────────────┤
│                                 │
│  ── 여백 48px ──                │
│                                 │
│  [체크 아이콘 원]                 │  56×56px 중앙
│  배경: --success (#34C759)       │  iOS "done" 스타일 체크마크
│                                 │
│  ── 여백 20px ──                │
│                                 │
│  설치 완료!                      │  text-xl, bold, --text-primary
│  Claude Code CLI가               │  text-sm, text-secondary, 중앙
│  성공적으로 설치되었습니다.         │
│                                 │
│  ── 여백 32px ──                │
│                                 │
│  [접기/펼치기] 설치 로그 보기 ∨   │  text-sm, accent 색상, 클릭 토글
│  (토글 시 터미널 박스 표시)        │
│                                 │
│  ── 여백 auto ──                 │
│                                 │
├─────────────────────────────────┤
│  [다음: 로그인 설정] →           │  primary button, 하단 고정
│  ── 여백 20px ──                 │
└─────────────────────────────────┘
```

**체크 아이콘:**
```
원형 배경: #34C759, 크기: 56×56px, border-radius: 50%
체크마크: strokeWidth 2.5px, 흰색
등장 애니메이션: scale(0.5) → scale(1), 300ms spring
```

---

### 상태 3 — 설치 실패 (Error)

```
┌─────────────────────────────────┐
│  ← 뒤로                         │  nav-bar
├─────────────────────────────────┤
│                                 │
│  ── 여백 48px ──                │
│                                 │
│  [X 아이콘 원]                   │  56×56px 중앙
│  배경: --danger (#FF3B30)        │
│                                 │
│  ── 여백 20px ──                │
│                                 │
│  설치 실패                       │  text-xl, bold
│  오류가 발생했습니다.             │  text-sm, text-secondary
│                                 │
│  ── 여백 16px ──                │
│                                 │
│  ┌─ 오류 메시지 박스 ──────────┐  │
│  │ ⚠ EACCES permission denied │  │  배경: #FFF0EF, border: #FF3B30 20%
│  │ /usr/local/lib/...         │  │  border-radius: 10px, padding: 14px
│  └─────────────────────────────┘  │  text-sm, color: --danger
│                                 │
│  ── 여백 auto ──                 │
│                                 │
├─────────────────────────────────┤
│  [다시 시도]                     │  primary button (--danger 색상)
│  ── 여백 12px ──                 │
│  [모델 다시 선택하기]             │  ghost button
│  ── 여백 20px ──                 │
└─────────────────────────────────┘
```

---

## 내비게이션 바 상세

```
높이: 52px
배경: rgba(255, 255, 255, 0.85)
backdrop-filter: blur(20px) saturate(180%)
border-bottom: 0.5px solid rgba(0,0,0,0.1)

← 뒤로 버튼:
  - SF Symbols: chevron.left + "뒤로" 텍스트
  - color: var(--accent)
  - font-size: 17px
  - 설치 중일 때: opacity 0.3, pointer-events: none
```

---

## 터미널 로그 박스 상세

```css
.terminal-log {
  background: #1C1C1E;
  border-radius: 12px;
  padding: 14px 16px;
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #E5E5E5;
  overflow-y: auto;
  max-height: 200px;

  /* 스크롤바 스타일 */
  scrollbar-width: thin;
  scrollbar-color: #3A3A3C transparent;
}

/* 로그 레벨별 색상 */
.log-success { color: #30D158; }   /* 완료/성공 메시지 */
.log-error   { color: #FF453A; }   /* 오류 */
.log-info    { color: #E5E5E5; }   /* 일반 */
.log-dim     { color: #636366; }   /* 부수적 정보 */
```

---

## 진행률 표시 (선택)

npm 설치 시 퍼센트 정보가 출력되면 진행률 바를 추가:

```
┌──────────────────────────────┐
│  ████████████░░░░░░  65%     │
└──────────────────────────────┘

배경: rgba(255,255,255,0.1)
채워진 바: var(--accent)
border-radius: 4px
높이: 4px
transition: width 0.3s ease
```

---

## 접근성 고려사항

- 터미널 로그 영역: `role="log"`, `aria-live="polite"` — 스크린 리더에 새 로그 알림
- 스피너: `role="status"`, `aria-label="설치 중"`
- 성공/실패 아이콘: `aria-label="설치 완료"` / `aria-label="설치 실패"`
