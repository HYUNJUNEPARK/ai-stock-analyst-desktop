# 디자인 작업 계획 — AI CLI Launcher

## 개요

Claude Design과 협업하여 5개 화면의 UI를 구현한다.
디자인 기준은 `design-prompts/00-design-system.md`로 통일하며,
화면 순서대로 프롬프트를 전달해 일관된 스타일을 유지한다.

**디자인 방향**: 깔끔 모던 + iOS Native 감성
**핵심 색상**: `#007AFF` (iOS systemBlue) 단 하나
**배경**: `#F2F2F7` (iOS systemGroupedBackground)

---

## 작업 순서

### Step 0 — 디자인 시스템 공유 (필수 선행)

> `design-prompts/00-design-system.md`

이 파일에는 모든 화면에서 공통으로 사용하는 기준이 담겨 있다:
- CSS 변수 팔레트 (색상, 텍스트, 테두리)
- 타이포그래피 스케일 및 폰트 패밀리
- 공간 / 패딩 단위
- Card, Button, Input, Terminal, Spinner 공통 컴포넌트 CSS
- 전체 페이지 레이아웃 템플릿
- 애니메이션 원칙 (transition 값, shake, fade+slide-up)

**이 파일을 기준으로 잡은 뒤 각 화면 작업을 시작한다.**

---

### Step 1 — 모델 선택 화면

**프롬프트 파일**: `design-prompts/01-model-selection.md`

| 항목 | 내용 |
|------|------|
| 화면 경로 | `/` (앱 첫 화면) |
| 핵심 요소 | 앱 로고, GPT/Claude 선택 카드 2개 |
| 주요 상태 | 기본 / Hover / Active |
| 참고 포인트 | 카드 hover 시 `border-color: accent` + `translateY(-1px)` |

---

### Step 2 — CLI 다운로드 화면

**프롬프트 파일**: `design-prompts/02-cli-download.md`

| 항목 | 내용 |
|------|------|
| 화면 경로 | `/download` |
| 핵심 요소 | 스피너, 터미널 로그 박스, 상태 아이콘 |
| 주요 상태 | 설치 중 / 설치 완료 / 설치 실패 (3가지 분기) |
| 참고 포인트 | 성공 체크 아이콘: `scale(0.5→1)` 300ms spring 등장 |

---

### Step 3 — 인증 화면

**프롬프트 파일**: `design-prompts/03-auth.md`

| 항목 | 내용 |
|------|------|
| 화면 경로 | `/auth` |
| 핵심 요소 | API 키 입력 필드, 탭 UI (Claude 전용), 비밀번호 토글 |
| 주요 상태 | GPT 입력 / Claude 탭 A(API키) / Claude 탭 B(CLI 로그인) / 오류 / 로딩 / 완료 |
| 참고 포인트 | 오류 시 입력 필드 shake 애니메이션 + 빨간 테두리 |

---

### Step 4 — 프롬프트 입력 화면

**프롬프트 파일**: `design-prompts/04-prompt-input.md`

| 항목 | 내용 |
|------|------|
| 화면 경로 | `/prompt` |
| 핵심 요소 | 자동 확장 textarea, 카드 포커스 효과, 단축키 힌트, 글자수 카운터 |
| 주요 상태 | 기본 / 포커스 / 비활성 버튼 / 활성 버튼 |
| 참고 포인트 | 카드 전체가 포커스 영역 — textarea 포커스 시 카드 border가 accent로 변경 |

---

### Step 5 — 응답 확인 화면

**프롬프트 파일**: `design-prompts/05-response.md`

| 항목 | 내용 |
|------|------|
| 화면 경로 | `/response` |
| 핵심 요소 | 질문 말풍선, 마크다운 렌더링 카드, 코드 블록, 스트리밍 커서 |
| 주요 상태 | 스트리밍 중 / 완료 / 오류 |
| 참고 포인트 | 코드 블록 헤더에 언어 라벨 + 복사 버튼 포함, 하단 버튼 영역 blur 처리 |

---

## 화면 흐름 다이어그램

```
앱 시작
  │
  ▼
[01] 모델 선택  ──────────────────────────────────────────────────────┐
  │  GPT 또는 Claude 카드 선택                                        │
  │                                                                   │
  ▼                                                                   │
[02] CLI 다운로드                                                      │
  │  설치 중 → 완료 → 자동 이동 (3초)                                  │
  │  실패 시 → 다시 시도 / 뒤로(01)                                    │
  │                                                                   │
  ▼                                                                   │
[03] 인증                                                              │
  │  모델별 CLI 로그인 진행                                            │
  │  성공 → 이동 / 뒤로(01)                                            │
  │                                                                   │
  ▼                                                                   │
[04] 프롬프트 입력  ◄─────────────────────────────────────────────────┤
  │  질문 작성 후 제출                                                  │
  │  설정 아이콘 → (03) 인증으로                                        │
  │                                                                   │
  ▼                                                                   │
[05] 응답 확인                                                         │
  │  스트리밍 수신 → 완료                                              │
  │  새 질문하기 → (04)                                               │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 프롬프트 전달 체크리스트

Claude Design과 세션을 시작할 때 아래 순서로 파일을 전달한다.

- [ ] `00-design-system.md` 전달 → 디자인 시스템 합의
- [ ] `01-model-selection.md` 전달 → 모델 선택 화면 완성
- [ ] `02-cli-download.md` 전달 → CLI 다운로드 화면 완성
- [ ] `03-auth.md` 전달 → 인증 화면 완성
- [ ] `04-prompt-input.md` 전달 → 프롬프트 입력 화면 완성
- [ ] `05-response.md` 전달 → 응답 확인 화면 완성

---

## 디렉터리 구조

```
docs/design/
├── design-plan.md              ← 이 파일 (작업 계획)
└── design-prompts/
    ├── README.md               ← 전달 순서 요약
    ├── 00-design-system.md     ← 디자인 시스템 기준 (공통)
    ├── 01-model-selection.md   ← 화면 1
    ├── 02-cli-download.md      ← 화면 2
    ├── 03-auth.md              ← 화면 3
    ├── 04-prompt-input.md      ← 화면 4
    └── 05-response.md          ← 화면 5
```
