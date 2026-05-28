# 프로젝트 구조 가이드

> AI Stock Analytics — 처음 보는 사람을 위한 전체 구조 설명

---

## 1. 앱이 하는 일

사용자가 **GPT** 또는 **Claude** 모델을 선택하고, 주식 종목명(예: `삼성전자`)을 입력하면 AI 멀티 에이전트가 다음 4가지 분석을 순서대로 수행하고 종합 리포트를 반환한다.

| 에이전트 | 역할 |
|----------|------|
| `financial-analyst-kr` | 재무 분석 |
| `news-sentiment-analyst` | 뉴스 분석 |
| `sector-researcher` | 업종 리서치 |
| `aggressive-investment-strategist` | 투자 전략 수립 |

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 데스크탑 런타임 | Electron 39 |
| UI | React 19 + TypeScript |
| 번들러 | electron-vite + Vite 7 |
| 라우팅 | react-router-dom 7 (HashRouter) |
| AI CLI (Claude) | `@anthropic-ai/claude-code` |
| AI CLI (GPT) | `@openai/codex` |

---

## 3. 디렉토리 구조

```
ai-stock-analytics/
├── src/
│   ├── main/                     # Electron 메인 프로세스 (Node.js)
│   │   ├── index.ts              #   IPC 핸들러, CLI 실행, 파일 저장
│   │   ├── claude/               #   Claude 멀티에이전트 분석 프로젝트
│   │   │   ├── .claude/          #     에이전트 설정·메모리
│   │   │   └── reports/          #     생성된 투자 리포트 저장
│   │   └── gpt/                  #   GPT 분석 프로젝트
│   │       ├── prompts/          #     에이전트 프롬프트 정의
│   │       ├── reports/          #     생성된 분석 리포트 저장
│   │       └── scripts/          #     분석 실행 스크립트
│   │
│   ├── preload/                  # contextBridge 레이어 (보안 경계)
│   │   ├── index.ts              #   window.api 노출
│   │   └── index.d.ts            #   window.api 타입 정의
│   │
│   └── renderer/src/             # React UI (브라우저 컨텍스트)
│       ├── App.tsx               #   라우트 정의
│       ├── main.tsx              #   React 진입점
│       ├── context/
│       │   └── AppContext.tsx    #   전역 상태 (selectedModel, prompt, response)
│       ├── components/           #   공통 UI 컴포넌트
│       │   ├── EyeIcons.tsx
│       │   └── PageFooter.tsx
│       ├── assets/               #   이미지, CSS
│       └── pages/
│           ├── ModelSelectionPage.tsx   # GPT/Claude 선택
│           ├── LandingPage.tsx          # CLI 상태 체크 → 라우팅 허브
│           ├── PromptPage.tsx           # 종목 입력
│           ├── SettingsPage.tsx         # 설정 및 사용량 통계
│           ├── RecentReportPage.tsx     # 이전 리포트 목록
│           ├── auth/
│           │   ├── AuthPage.tsx         # 모델별 auth 분기
│           │   ├── ClaudeAuthPage.tsx   # claude login 실행
│           │   └── GptAuthPage.tsx      # codex login 실행
│           ├── download/
│           │   ├── CliDownloadPage.tsx  # 설치 상태 관리
│           │   ├── InstallingState.tsx  # 설치 중 화면
│           │   ├── SuccessState.tsx     # 설치 성공 화면
│           │   └── ErrorState.tsx       # 설치 실패 화면
│           └── response/
│               ├── ResponsePage.tsx         # 분석 실행 + 결과 표시
│               ├── types.ts                 # Status, AgentStatus 타입
│               ├── constants.ts             # AGENT_CONFIG, 개발 미리보기
│               └── components/
│                   ├── ResponseCard.tsx
│                   ├── StreamingResponseView.tsx
│                   ├── MarkdownRenderer.tsx
│                   ├── AgentStatusBar.tsx
│                   ├── PromptBubble.tsx
│                   ├── CodeBlock.tsx
│                   └── ErrorResponseView.tsx
│
├── docs/
│   ├── guide/           # ← 지금 읽고 있는 이 파일들
│   ├── development/     # 개발 로드맵, 단계별 AI 협업 프롬프트
│   ├── design/          # UI/UX 설계 문서
│   └── error/           # 발생했던 에러 기록
│
├── CLAUDE.md            # Claude Code용 프로젝트 지침
├── AGENTS.md            # 에이전트 문서
└── package.json
```

---

## 4. 화면 흐름

```
/ (ModelSelection)
    │  모델 선택 (GPT / Claude)
    ▼
/landing (LandingPage)
    │  CLI 설치 여부·인증 여부 확인
    ├─ 미설치 → /download (CliDownload)
    │               │  npm install 완료
    │               ▼
    └─ 미인증 → /auth (Auth)
                    │  claude login / codex login 완료
                    ▼
               /prompt (Prompt)
                    │  종목명 입력 후 제출
                    ▼
               /response (Response)
                    │  멀티에이전트 분석 스트리밍
                    ▼
               /prompt 으로 복귀 (재질의 가능)
```

부가 화면:
- `/settings` — 모델 설정·사용량 통계
- `/reports/latest` — GPT 리포트 목록

---

## 5. 3-레이어 아키텍처

Electron 보안 모델에 따라 반드시 3개 레이어를 거친다.

```
Renderer (React)
    │  window.api.xxx()
    ▼
Preload (contextBridge)
    │  ipcRenderer.invoke / ipcMain.handle
    ▼
Main (Node.js)
    │  child_process.spawn — CLI 실행, 파일 R/W
    ▼
  OS / AI CLI (claude / codex)
```

**규칙**
- Renderer에서 Node.js API 직접 사용 금지
- 새 IPC 채널 추가 시 `main/index.ts` → `preload/index.ts` → `preload/index.d.ts` 3곳 동시 수정
- `contextIsolation: true`, `nodeIntegration: false` 유지

---

## 6. 전역 상태 (AppContext)

```typescript
{
  selectedModel: 'gpt' | 'claude' | null  // 선택된 모델
  currentPrompt: string                   // 입력한 종목명
  lastResponse: string                    // 마지막 분석 결과
}
```

`useApp()` 훅으로 접근한다. Provider 바깥에서 호출하면 런타임 에러가 발생한다.

---

## 7. IPC 채널 전체 목록

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `start-cli-install` | render → main | CLI npm 설치 시작 |
| `install-progress` | main → render | 설치 로그 스트리밍 |
| `install-complete` | main → render | 설치 완료/실패 |
| `check-cli-status` | render → main | CLI 설치·인증 상태 확인 |
| `check-cli-stats` | render → main | 주간 사용량 통계 조회 |
| `list-gpt-report-files` | render → main | GPT 리포트 파일 목록 |
| `open-report-detail-window` | render → main | 보고서 상세를 별도 창으로 열기 |
| `run-claude-login` | render → main | `claude login` 실행 |
| `run-gpt-login` | render → main | `codex login` 실행 |
| `cli-login-progress` | main → render | 로그인 터미널 출력 스트리밍 |
| `cli-login-complete` | main → render | 로그인 완료/실패 |
| `run-prompt` | render → main | 단일 프롬프트 실행 |
| `prompt-response-chunk` | main → render | 응답 청크 스트리밍 |
| `prompt-response-done` | main → render | 응답 완료/실패 |
| `run-stock-analysis` | render → main | 멀티에이전트 주식 분석 시작 |
| `cancel-stock-analysis` | render → main | 분석 프로세스 중단 |
| `stock-analysis-agent` | main → render | 에이전트 상태 변경 이벤트 |
| `stock-analysis-chunk` | main → render | 결과 청크 스트리밍 |
| `stock-analysis-done` | main → render | 분석 완료/실패 |

---

## 8. 핵심 파일 역할 요약

| 파일 | 한 줄 설명 |
|------|-----------|
| `src/main/index.ts` | 모든 IPC 핸들러 등록, CLI 프로세스 관리, 파일 I/O |
| `src/preload/index.ts` | `window.api` 노출, 이벤트 콜백 라우팅 |
| `src/preload/index.d.ts` | `window.api` 전체 타입 정의 |
| `src/renderer/src/App.tsx` | 라우트 정의 (8개 경로) |
| `src/renderer/src/context/AppContext.tsx` | 전역 상태 Provider + `useApp()` 훅 |
| `src/renderer/src/pages/LandingPage.tsx` | CLI 상태 체크 후 적절한 화면으로 리다이렉트 |
| `src/renderer/src/pages/response/ResponsePage.tsx` | 멀티에이전트 분석 실행 및 스트리밍 처리 |
| `src/renderer/src/pages/response/constants.ts` | 에이전트 설정 (`AGENT_CONFIG`) |
| `src/main/ai/claude/` | Claude 에이전트 프로젝트 (설정·리포트) |
| `src/main/ai/gpt/` | GPT 에이전트 프로젝트 (프롬프트·스크립트·리포트) |

---

## 9. CLI 설치 위치

```
~/.ai-cli-launcher/    # CLI가 설치되는 위치 (node_modules 포함)
~/.claude/             # Claude 인증 정보 (.credentials.json, stats-cache.json)
~/.codex/              # GPT 인증 정보 (auth.json, SQLite DB)
```

개발/프로덕션에 따라 에이전트 프로젝트 경로가 다르다.

```typescript
// 개발
src/main/ai/claude/    (앱 소스 트리 내)
src/main/ai/gpt/

// 프로덕션
{process.resourcesPath}/ai/claude/
{process.resourcesPath}/ai/gpt/
```

---

## 10. 개발 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 (HMR 포함)
npm run dev

# 타입 체크
npm run typecheck

# 린트
npm run lint

# 프로덕션 빌드
npm run build
npm run build:mac   # macOS 패키징
npm run build:win   # Windows NSIS 인스톨러
npm run build:linux # Linux AppImage
```

> **개발 모드 전용 기능**: `PromptPage`에 미리보기(Preview) 버튼이 노출되며, `ResponsePage`에서 실제 CLI 호출 없이 목(mock) 응답으로 UI를 테스트할 수 있다.

---

## 11. 보안 주의사항

- `child_process.spawn()`은 반드시 배열 방식 사용 — 문자열 shell 인자 금지 (command injection 방지)
- `console.log`에 API 키 변수 포함 금지
- 프로덕션 빌드에서 DevTools 비활성화 (`is.dev` 조건 확인)
- API 키 평문 저장 위험 인지 — 추후 `electron-store` encrypt 옵션 적용 고려
