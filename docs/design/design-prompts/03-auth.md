# 화면 3 — 인증 (Auth)

> **디자이너 참고**: 이 파일은 Claude Design에게 전달하는 UI 디자인 요청 프롬프트입니다.
> 디자인 시스템 기준은 `00-design-system.md`를 따릅니다.

---

## 화면 목적

선택한 모델의 CLI 로그인을 수행하는 인증 화면.
GPT / Claude 여부에 따라 UI가 분기되며, GPT는 `codex login`, Claude는 `claude login`을 사용한다.

---

## 공통 상단 구조

```
┌─────────────────────────────────┐
│  ← 뒤로                         │  nav-bar, 52px
├─────────────────────────────────┤
│                                 │
│  ── 여백 40px ──                │
│                                 │
│  [모델 아이콘]                   │  40×40px, 카드와 동일 스타일
│  인증 설정                      │  text-xl, bold, 중앙
│  선택한 CLI 로그인 인증을       │  text-sm, text-secondary, 중앙
│  진행해 주세요                  │
│                                 │
│  ── 여백 32px ──                │
```

---

## GPT 선택 시 레이아웃

```
│  ── 여백 24px ──                │
│                                 │
│  ┌─ 안내 카드 ─────────────────┐ │
│  │ ℹ codex login 명령을 실행   │ │
│  │   하면 브라우저가 열리며     │ │
│  │   ChatGPT 계정으로           │ │
│  │   로그인할 수 있습니다.      │ │
│  └────────────────────────────┘ │
│                                 │
│  [상태: 대기 중]                │
│  [codex login 시작하기]         │
│                                 │
│  [상태: 진행 중]                │
│  [스피너] Codex 로그인 진행 중...│
│  ┌─ 터미널 로그 박스 ─────────┐  │
│  │ $ codex login              │  │
│  │ Opening browser...         │  │
│  └────────────────────────────┘  │
│                                 │
│  [상태: 완료]                   │
│  (체크 아이콘) Codex 로그인 성공 │
│                                 │
│  ── 여백 auto ──                │
│                                 │
├─────────────────────────────────┤
│  [오류 메시지 - 조건부]           │  오류 시 버튼 위에 표시
│  [codex login 시작하기]          │  primary button, 하단 고정
│  ── 여백 20px ──                 │
└─────────────────────────────────┘
```

---

## Claude 선택 시 레이아웃

### CLI 로그인

```
│  ── 여백 24px ──                │
│                                 │
│  ┌─ 안내 카드 ─────────────────┐ │
│  │ ℹ claude login 명령을 실행  │ │  배경: accent-light
│  │   하면 브라우저가 열리며     │ │  border: 1px solid accent 30%
│  │   Anthropic 계정으로         │ │  border-radius: 12px
│  │   로그인할 수 있습니다.      │ │  padding: 16px
│  └──────────────────────────── ┘ │
│                                 │
│  ── 여백 20px ──                │
│                                 │
│  [상태: 대기 중]                │  --- 로그인 전 ---
│  [claude login 시작하기]        │  primary button
│                                 │
│  ───────────────────────────── │
│                                 │
│  [상태: 진행 중]                │  --- 로그인 진행 중 ---
│  [스피너] 브라우저에서          │  icon + text, accent 색상
│  로그인을 완료해 주세요...       │
│                                 │
│  ┌─ 터미널 로그 박스 ─────────┐  │
│  │ $ claude login             │  │  다크 터미널 (02 화면과 동일)
│  │ Opening browser...         │  │  높이: 120px
│  └────────────────────────────┘  │
│                                 │
│  ───────────────────────────── │
│                                 │
│  [상태: 완료]                   │  --- 로그인 성공 ---
│  (체크 아이콘) 로그인 성공!      │  --success 색상
│  [다음으로]                     │  primary button
```

---

## 오류 상태 디자인

```
[오류 배너]

┌────────────────────────────────┐
│  ⚠ 유효하지 않은 API 키입니다.  │
│     키를 다시 확인해 주세요.    │
└────────────────────────────────┘

배경: rgba(255, 59, 48, 0.08)
border-left: 3px solid #FF3B30
border-radius: 8px
padding: 12px 14px
font-size: 13px, color: #FF3B30
```

입력 필드 오류 상태:
```
border-color: #FF3B30
box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.15)
+ shake 애니메이션 (좌우 3px × 3회)
```

---

## 로딩 상태 (CLI 로그인 진행 중)

버튼 내부에 인라인 스피너 + 텍스트 변경:
```
[기본]    [로그인 시작하기]
[로딩]    [◌ 확인 중...]  ← 스피너 + 텍스트
[완료]    [✓ 로그인 완료] ← 체크 아이콘 + 텍스트 (0.5초 후 이동)
```

버튼 상태:
```css
/* 로딩 중 */
.btn-primary.loading {
  opacity: 0.8;
  pointer-events: none;
}

/* 스피너 (버튼 내) */
.btn-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
}
```

---

## 접근성 고려사항

- 오류 메시지: `role="alert"`, `aria-live="assertive"`
- 로그 영역: `role="log"`, `aria-live="polite"`
