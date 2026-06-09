# AI 투자 솔루션 — Desktop Agent Guide

## 프로젝트 개요

GPT/Claude 모델 기반 종목 분석 **Electron 데스크탑 앱**.
9개 전문 에이전트가 병렬·순차 파이프라인으로 종목을 분석하고, 투자 유형 분류를 거쳐 최종 투자 리포트를 생성한다.

- **제품명**: AI 투자 솔루션
- **기술 스택**: Electron 39 + React 19 + TypeScript 5.9 + electron-vite 5
- **지원 플랫폼**: Windows (NSIS), macOS (DMG), Linux (AppImage/deb/snap)
- **앱 ID**: `com.aistockanalytics.desktop`

---

## 프로젝트 구조

```
src/
├── main/                        # Electron main process
│   ├── index.ts                 # 앱 라이프사이클
│   ├── window.ts                # BrowserWindow 생성, IPC 핸들러 등록
│   ├── constants.ts             # 전역 경로 상수
│   ├── ipc/                     # IPC 핸들러 모듈 (7개)
│   │   ├── cli-install.ts       # CLI npm 설치
│   │   ├── cli-auth.ts          # Claude/GPT 로그인
│   │   ├── cli-stats.ts         # CLI 상태 확인
│   │   ├── prompt.ts            # 단발 프롬프트 실행
│   │   ├── stock-analysis.ts    # 멀티 에이전트 분석 오케스트레이션
│   │   ├── report-files.ts      # 리포트 CRUD + PDF 내보내기
│   │   └── windows.ts           # 보조 윈도우 관리
│   ├── utils/
│   │   ├── cli.ts               # CLI 경로 해석, 스트림 유틸
│   │   └── spawn.ts             # child_process 헬퍼
│   └── ai/                      # AI 모델별 에이전트 설정
│       ├── claude/              # Claude 에이전트 프로젝트
│       │   ├── CLAUDE.md
│       │   ├── .claude/agents/  # 에이전트 정의 (4개)
│       │   └── reports/         # 생성된 리포트
│       └── gpt/                 # GPT/Codex 에이전트 프로젝트
│           ├── AGENTS.md
│           ├── prompts/         # 에이전트 프롬프트 (9개)
│           ├── scripts/         # 분석 오케스트레이션 스크립트
│           └── reports/         # 생성된 리포트
├── preload/                     # contextBridge 보안 브릿지
│   ├── index.ts                 # API 노출
│   ├── index.d.ts               # window.api 타입 정의
│   └── ipc/                     # 리스너 등록 (main 미러)
├── renderer/                    # React UI
│   └── src/
│       ├── App.tsx              # 라우팅 루트
│       ├── main.tsx             # React 진입점
│       ├── routes.ts            # 라우트 경로 상수
│       ├── context/AppContext.tsx  # 전역 상태
│       ├── components/          # 공통 UI 컴포넌트
│       ├── pages/               # 라우트별 페이지
│       │   ├── ai-model/        # 모델 선택
│       │   ├── auth/            # 인증 (Claude/GPT)
│       │   ├── download/        # CLI 설치
│       │   ├── prompt/          # 프롬프트 입력
│       │   ├── response/        # 분석 진행/결과
│       │   ├── report/          # 리포트 조회/관리
│       │   ├── guide/           # 교육 가이드
│       │   ├── status-check/    # 상태 확인
│       │   └── info/            # 앱 정보
│       ├── hooks/               # 커스텀 훅
│       ├── data/                # 정적 데이터 (JSON)
│       └── assets/              # CSS, 이미지
└── shared/
    └── ipcChannels.ts           # IPC 채널 상수
```

---

## 3-레이어 아키텍처

```
renderer (React UI)
    ↕  window.api.xxx()
preload (contextBridge)
    ↕  ipcRenderer.invoke / ipcMain.handle
main (Node.js, child_process, fs)
```

### 핵심 규칙

- **renderer에서 Node.js API 직접 사용 금지** — 반드시 preload를 통해 호출
- **새 IPC 채널 추가 시** main/ipc → preload/ipc → preload/index.d.ts 순서로 3곳 모두 수정
- `contextIsolation: true`, `nodeIntegration: false` 유지
- `sandbox: false`는 child_process 사용을 위한 허용된 설정

---

## 화면 흐름

```
/ (ModelSelection) → /download → /auth → /prompt → /response → /reports
```

라우팅: `react-router-dom` HashRouter (file:// 호환)

---

## 멀티 에이전트 파이프라인

### 9개 에이전트

| 에이전트 | 역할 |
|---------|------|
| `input-validator` | 입력 검증 (유효한 종목 요청인지 판단, 정식 기업명·티커 추출) |
| `price-fetcher` | 기준 주가 확정 (교차 검증 후 모든 에이전트에 공통 가격 제공) |
| `financial-analyst-kr` | 재무제표 분석 (매출, 영업이익률, PER, PBR, ROE, 부채비율) |
| `sector-researcher` | 업종 리서치 (글로벌 시장, 경쟁사, 정책, 업종 전망) |
| `news-sentiment-analyst` | 뉴스 감성 분석 (호재·악재, 시장 심리) |
| `price-analyst` | 기술적 분석 (이동평균, RSI, MACD, 볼린저밴드, 지지·저항) |
| `valuation-analyst` | 밸류에이션 (목표주가, 적정주가 시나리오) |
| `invest-type-classifier` | 투자 유형 분류 (6가지 유형) |
| `aggressive-investment-strategist` | 최종 투자 판단 (매수/관망/매도, 목표가/손절가) |

### 실행 순서

```
Wave 0 (순차):  input-validator → price-fetcher (입력 검증 + 기준 주가 확정)
Wave 1 (병렬):  financial-analyst-kr, sector-researcher, news-sentiment-analyst, price-analyst
Wave 1b:        valuation-analyst (financial + sector 완료 후)
Wave 2-1:       invest-type-classifier (5개 완료 후)
Wave 2-2:       aggressive-investment-strategist (모든 분석 + 유형 분류 후)
```

> Wave 0에서 확정된 기준 주가(`CURRENT_PRICE`)는 Wave 1 이후 모든 에이전트에 주입되어 가격 일관성을 보장한다.

---

## IPC 채널 목록

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `start-cli-install` | R→M | CLI npm 설치 시작 |
| `install-progress` | M→R | 설치 로그 스트리밍 |
| `install-complete` | M→R | 설치 완료/실패 |
| `check-cli-status` | R→M | CLI 설치 상태 확인 |
| `run-claude-login` | R→M | Claude 로그인 |
| `run-gpt-login` | R→M | GPT 로그인 |
| `cli-login-progress` | M→R | 로그인 진행 |
| `cli-login-complete` | M→R | 로그인 완료 |
| `run-prompt` | R→M | 단발 프롬프트 |
| `prompt-response-chunk` | M→R | 응답 스트리밍 |
| `prompt-response-done` | M→R | 응답 완료 |
| `run-stock-analysis` | R→M | 멀티 에이전트 분석 시작 |
| `cancel-stock-analysis` | R→M | 분석 취소 |
| `stock-analysis-agent` | M→R | 에이전트 상태 |
| `stock-analysis-chunk` | M→R | 분석 스트리밍 |
| `stock-analysis-done` | M→R | 분석 완료 |
| `list-gpt-report-files` | R→M | 리포트 목록 |
| `read-gpt-report-file` | R→M | 리포트 읽기 |
| `delete-gpt-report-file` | R→M | 리포트 삭제 |
| `save-report-pdf` | R→M | PDF 내보내기 |

---

## UI/디자인 규칙

- iOS 스타일 디자인 시스템 (`base.css` 변수 기반)
- 주요 변수: `--accent: #007aff`, `--bg-primary: #f2f2f7`, `--text-primary: #1c1c1e`
- CSS 변수 재사용: `--accent`, `--bg-*`, `--text-*`, `--space-*`
- 데스크탑 고정 윈도우 레이아웃 기준

---

## 보안 규칙

- API 키/토큰 로그 출력 금지
- `spawn` 배열 방식 사용 (shell 문자열 삽입 금지)
- 파일 쓰기는 앱 소유 경로(`userData`)로 제한
- stderr에 민감 정보 노출 금지

---

## 개발 명령어

```bash
npm run dev          # 개발 서버 (HMR)
npm run dev:win      # Windows 개발 (UTF-8)
npm run build        # 타입 체크 + 빌드
npm run build:mac    # macOS DMG 패키징
npm run build:win    # Windows NSIS 인스톨러
npm run build:linux  # Linux AppImage
npm run typecheck    # 타입 체크 (main + web)
npm run lint         # ESLint
npm run format       # Prettier
```

---

## Codex Login Completion

GPT/Codex login completes when either `codex login` exits successfully or
`~/.codex/auth.json` contains a usable session. The auth-file check lets Windows
advance after browser authentication without waiting for the browser window to
close.

The GPT auth check treats API keys as usable, JWT access/id tokens as usable
only before their `exp` time, and refresh tokens as a refreshable session. If a
later Codex execution reports an authentication failure, the renderer shows a
reauthentication action and routes the user back to `/auth`.

---

## 코드 규칙

- TypeScript strict 모드, `any` 지양
- PascalCase: React 컴포넌트 / camelCase: 함수, 변수
- IPC 채널 추가 시 `src/shared/ipcChannels.ts`에 상수 정의
- 페이지 컴포넌트는 오케스트레이션, 자식 컴포넌트는 시각적 상태 블록
- 반복 로직은 헬퍼/유틸로 추출
- 불필요한 코드, 주석 제거
