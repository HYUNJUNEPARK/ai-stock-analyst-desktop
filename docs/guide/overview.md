# 프로젝트 구조 가이드

> AI Stock Analytics — 처음 보는 사람을 위한 전체 구조 설명

---

## 1. 앱이 하는 일

사용자가 **GPT** 또는 **Claude** 모델을 선택하고, 주식 종목명(예: `삼성전자`)을 입력하면 AI 멀티 에이전트가 다음 분석을 순서대로 수행하고 종합 리포트를 반환한다.

| 에이전트 | 역할 |
|----------|------|
| `financial-analyst-kr` | 재무 분석 |
| `news-sentiment-analyst` | 뉴스 분석 |
| `sector-researcher` | 업종 리서치 |
| `aggressive-investment-strategist` | 투자 전략 수립 |
| `invest-type-classifier` | 투자 유형 분류 |
| `valuation-analyst` | 밸류에이션 분석 |
| `price-analyst` | 가격 분석 |

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
| 빌드 | electron-builder 26 |
| 린트/포맷 | ESLint 9 + Prettier 3 |

---

## 3. 디렉토리 구조

```
ai-stock-analytics/
├── src/
│   ├── shared/
│   │   └── ipcChannels.ts        # IPC 채널명 상수 (main·preload·renderer 공유)
│   │
│   ├── main/                     # Electron 메인 프로세스 (Node.js)
│   │   ├── index.ts              #   앱 생명주기 진입점
│   │   ├── window.ts             #   BrowserWindow 생성 및 설정
│   │   ├── constants.ts          #   경로 상수 (CLI_PREFIX, STOCK_*_DIR 등)
│   │   ├── utils/
│   │   │   ├── spawn.ts          #   child_process 실행 + 안전한 IPC 전송
│   │   │   └── cli.ts            #   CLI 명령어 경로 확인
│   │   ├── ipc/                  #   IPC 핸들러 모듈
│   │   │   ├── cli-install.ts    #     CLI npm 설치 및 상태 확인
│   │   │   ├── cli-auth.ts       #     Claude/GPT CLI 로그인
│   │   │   ├── cli-stats.ts      #     CLI 사용 통계 및 리포트 목록
│   │   │   ├── prompt.ts         #     단발 프롬프트 실행
│   │   │   ├── stock-analysis.ts #     주식 멀티 에이전트 분석
│   │   │   ├── report-files.ts   #     리포트 CRUD, PDF 저장
│   │   │   └── windows.ts        #     보조 창 열기, 외부 URL
│   │   └── ai/                   #   AI 분석 프로젝트
│   │       ├── claude/           #     Claude CLI 멀티에이전트 프로젝트
│   │       │   └── CLAUDE.md     #       Claude 설정
│   │       └── gpt/              #     GPT(Codex) 멀티에이전트 프로젝트
│   │           ├── AGENTS.md
│   │           ├── package.json
│   │           ├── scripts/
│   │           │   └── analyze-stock.mjs  # 분석 실행 스크립트
│   │           ├── prompts/      #     에이전트별 프롬프트 템플릿 (7개)
│   │           └── reports/      #     생성된 분석 결과 저장소
│   │
│   ├── preload/                  # contextBridge 레이어 (보안 경계)
│   │   ├── index.ts              #   window.api 통합 진입점
│   │   ├── index.d.ts            #   window.api 전체 타입 정의
│   │   └── ipc/                  #   모듈별 브릿지
│   │       ├── cli-install.ts
│   │       ├── cli-auth.ts
│   │       ├── cli-stats.ts
│   │       ├── prompt.ts
│   │       ├── stock-analysis.ts
│   │       ├── report-files.ts
│   │       └── windows.ts
│   │
│   └── renderer/src/             # React UI (브라우저 컨텍스트)
│       ├── main.tsx              #   React 진입점
│       ├── App.tsx               #   라우트 정의
│       ├── routes.ts             #   ROUTES 상수
│       ├── context/
│       │   └── AppContext.tsx    #   전역 상태 (selectedModel, currentPrompt, lastResponse)
│       ├── components/           #   공통 UI 컴포넌트
│       │   ├── NavBar.tsx
│       │   ├── PageFooter.tsx
│       │   ├── ReportSidePanel.tsx
│       │   ├── ComingSoonDialog.tsx
│       │   └── ConfirmDialog.tsx
│       ├── hooks/                #   커스텀 React 훅
│       │   ├── useReportList.ts
│       │   └── useReportDeletion.ts
│       ├── assets/               #   이미지, CSS
│       ├── data/                 #   가이드 데이터 등 정적 데이터
│       └── pages/
│           ├── ai-model/
│           │   └── ModelSelectionPage.tsx   # GPT/Claude 선택 (/)
│           ├── landing/
│           │   └── LandingPage.tsx          # CLI 상태 체크 → 라우팅 허브 (/landing)
│           ├── download/
│           │   ├── CliDownloadPage.tsx      # 설치 상태 관리 (/download)
│           │   ├── InstallingState.tsx
│           │   ├── SuccessState.tsx
│           │   └── ErrorState.tsx
│           ├── auth/
│           │   ├── AuthPage.tsx             # 모델별 auth 분기 (/auth)
│           │   ├── ClaudeAuthPage.tsx
│           │   ├── GptAuthPage.tsx
│           │   └── hooks/
│           │       └── useGptLogin.ts
│           ├── prompt/
│           │   ├── PromptPage.tsx           # 종목 입력 (/prompt)
│           │   └── components/
│           │       ├── PromptInput.tsx
│           │       └── RecentReportModal.tsx
│           ├── response/
│           │   ├── ResponsePage.tsx         # 분석 실행 + 결과 표시 (/response)
│           │   ├── types.ts
│           │   ├── constants.ts             # AGENT_CONFIG
│           │   └── components/
│           │       ├── AnalysisProgressView.tsx
│           │       ├── AnalysisCompleteView.tsx
│           │       ├── AnalysisCancelledView.tsx
│           │       └── ErrorResponseView.tsx
│           ├── report/
│           │   ├── RecentReportPage.tsx     # 리포트 목록 (/reports/latest)
│           │   ├── ReportDetailPage.tsx     # 리포트 상세 (/reports/:name)
│           │   ├── ReportView.tsx
│           │   └── MarkdownRenderer.tsx
│           ├── guide/
│           │   ├── investment/
│           │   │   └── InvestmentTypePage.tsx   # 투자 유형 가이드 (/guide/investment)
│           │   └── valuation/
│           │       └── ValuationTermsPage.tsx   # 밸류에이션 용어 (/guide/valuation)
│           └── info/
│               └── InfoPage.tsx             # 앱 정보 (/info)
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
- `/info` — 앱 정보 및 설정
- `/reports/latest` — 리포트 목록
- `/reports/:name` — 리포트 상세 조회
- `/guide/investment` — 투자 유형 가이드
- `/guide/valuation` — 밸류에이션 용어 가이드

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
- 새 IPC 채널 추가 시 `shared/ipcChannels.ts` → `main/ipc/*.ts` → `preload/ipc/*.ts` → `preload/index.d.ts` 수정
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

채널명 상수는 `src/shared/ipcChannels.ts`에 정의되어 있으며 main·preload·renderer 3곳에서 공유한다.

### CLI 설치

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `start-cli-install` | render → main | CLI npm 설치 시작 |
| `install-progress` | main → render | 설치 로그 스트리밍 |
| `install-complete` | main → render | 설치 완료/실패 |
| `check-cli-status` | render ↔ main (invoke) | CLI 설치·인증 상태 확인 |

### CLI 인증

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `run-claude-login` | render → main | `claude login` 실행 |
| `run-gpt-login` | render → main | `codex login` 실행 |
| `cli-login-progress` | main → render | 로그인 터미널 출력 스트리밍 |
| `cli-login-complete` | main → render | 로그인 완료/실패 |

### 단발 프롬프트

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `run-prompt` | render → main | 단일 프롬프트 실행 |
| `prompt-response-chunk` | main → render | 응답 청크 스트리밍 |
| `prompt-response-done` | main → render | 응답 완료/실패 |

### 주식 멀티에이전트 분석

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `run-stock-analysis` | render → main | 멀티에이전트 주식 분석 시작 |
| `cancel-stock-analysis` | render → main | 분석 프로세스 중단 |
| `stock-analysis-agent` | main → render | 에이전트 상태 변경 이벤트 |
| `stock-analysis-chunk` | main → render | 결과 청크 스트리밍 |
| `stock-analysis-done` | main → render | 분석 완료/실패 |

### 통계 및 리포트 관리

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `check-cli-stats` | render ↔ main (invoke) | 주간 토큰 사용량 통계 조회 |
| `list-gpt-report-files` | render ↔ main (invoke) | GPT 리포트 파일 목록 |
| `read-gpt-report-file` | render ↔ main (invoke) | 특정 GPT 리포트 파일 읽기 |
| `read-artifact-files` | render ↔ main (invoke) | artifact 역할별 분석 결과 읽기 |
| `save-report-pdf` | render ↔ main (invoke) | 보고서 PDF 저장 |
| `delete-gpt-report-file` | render ↔ main (invoke) | 리포트 폴더 삭제 |

### 윈도우 및 유틸리티

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `open-external-url` | render ↔ main (invoke) | 시스템 기본 브라우저로 URL 열기 |
| `get-model-info` | render ↔ main (invoke) | 선택된 모델의 정확한 모델명 조회 |
| `open-guide-window` | render ↔ main (invoke) | 투자/밸류에이션 가이드 새 창 |
| `open-reports-window` | render ↔ main (invoke) | 리포트 목록 새 창 |
| `open-report-detail-window` | render ↔ main (invoke) | 리포트 상세 새 창 |

---

## 8. 핵심 파일 역할 요약

| 파일 | 한 줄 설명 |
|------|-----------|
| `src/shared/ipcChannels.ts` | IPC 채널명 상수 (3개 레이어 공유) |
| `src/main/index.ts` | 앱 생명주기 진입점, IPC 모듈 등록 |
| `src/main/constants.ts` | CLI 설치 경로, AI 프로젝트 경로 상수 |
| `src/main/ipc/stock-analysis.ts` | GPT·Claude 분기 멀티에이전트 분석 핸들러 (핵심) |
| `src/main/ipc/report-files.ts` | 리포트 CRUD 및 PDF 저장 |
| `src/preload/index.ts` | `window.api` 통합 노출 진입점 |
| `src/preload/index.d.ts` | `window.api` 전체 타입 정의 |
| `src/renderer/src/App.tsx` | 라우트 정의 (12개 경로) |
| `src/renderer/src/context/AppContext.tsx` | 전역 상태 Provider + `useApp()` 훅 |
| `src/renderer/src/pages/landing/LandingPage.tsx` | CLI 상태 체크 후 적절한 화면으로 리다이렉트 |
| `src/renderer/src/pages/response/ResponsePage.tsx` | 멀티에이전트 분석 실행 및 스트리밍 처리 |

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

## 10. AI 분석 실행 방식

### GPT (Codex)

1. `analyze-stock.mjs`를 `node` 프로세스로 직접 실행
2. 스크립트 내부에서 Codex CLI를 에이전트별로 순차 호출
3. stdout에 구조화된 마커 출력:
   - `[start] <에이전트명>` — 에이전트 시작
   - `[done] <에이전트명>` — 에이전트 완료
   - `최종 리포트 저장 완료: <파일경로>` — 전체 완료
4. 결과는 `reports/yymmdd/회사명/` 폴더에 에이전트별 `.md`로 저장

### Claude

1. Claude CLI를 `--output-format stream-json --verbose` 옵션으로 실행
2. stdout으로 JSON Lines 스트림 수신:
   - `assistant` + `tool_use` — 서브에이전트 시작
   - `user` + `tool_result` — 서브에이전트 완료
   - `result` — 전체 분석 완료 (최종 리포트 포함)
3. `agentToolMap`으로 `tool_use id` → 에이전트명 매핑

---

## 11. 개발 시작하기

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

## 12. 보안 주의사항

- `child_process.spawn()`은 반드시 배열 방식 사용 — 문자열 shell 인자 금지 (command injection 방지)
- `console.log`에 API 키 변수 포함 금지
- 프로덕션 빌드에서 DevTools 비활성화 (`is.dev` 조건 확인)
- API 키 평문 저장 위험 인지 — 추후 `electron-store` encrypt 옵션 적용 고려
