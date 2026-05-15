# AI CLI Launcher - Claude Code 가이드

## 프로젝트 개요

사용자가 PC에 설치하는 Electron 데스크탑 앱.
GPT 또는 Claude 모델을 선택하면 OS에 맞는 CLI를 자동 설치하고,
API 키 인증 후 단발성 프롬프트 질의 → 응답 확인 흐름으로 동작한다.

**기술 스택**: Electron 39 + React 19 + TypeScript + electron-vite

---

## 프로젝트 구조

```
src/
├── main/
│   └── index.ts          # Electron main process (IPC 핸들러, CLI 실행, 파일 저장)
├── preload/
│   ├── index.ts          # contextBridge로 renderer에 API 노출
│   └── index.d.ts        # window.electron / window.api 타입 정의
└── renderer/
    └── src/
        ├── App.tsx        # 라우팅 루트
        ├── main.tsx       # React 진입점
        ├── context/       # 전역 상태 (AppContext)
        ├── pages/         # 화면 컴포넌트
        └── assets/        # CSS, SVG

docs/
├── development-plan.md   # 전체 개발 순서 및 화면 흐름
└── prompts/              # 단계별 AI 협업 프롬프트 (01~08)
```

---

## 3-레이어 아키텍처 원칙

이 앱은 Electron의 보안 모델에 따라 반드시 3개 레이어를 통해 통신한다.

```
renderer (React UI)
    ↕  window.api.xxx() 호출
preload (contextBridge)
    ↕  ipcRenderer.invoke / ipcMain.handle
main (Node.js, child_process, fs)
```

### 규칙
- **renderer에서 Node.js API 직접 사용 금지** — 반드시 preload를 통해 호출
- **새 IPC 채널 추가 시** main → preload → renderer.d.ts 순서로 3곳 모두 수정
- `contextIsolation: true`, `nodeIntegration: false` 유지 (현재 설정 그대로)
- `sandbox: false`는 child_process 사용을 위해 허용된 설정

---

## 화면 흐름

```
/ (ModelSelection) → /download (CliDownload) → /auth (Auth) → /prompt (Prompt) → /response (Response)
```

라우팅: `react-router-dom` HashRouter (Electron 환경에서 file:// 프로토콜 호환)

---

## IPC 채널 목록

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `start-cli-install` | renderer→main | 모델 CLI npm 설치 시작 |
| `install-progress` | main→renderer | 설치 로그 스트리밍 |
| `install-complete` | main→renderer | 설치 완료/실패 |
| `validate-api-key` | renderer→main | API 키 유효성 검증 |
| `save-api-key` | renderer→main | API 키 로컬 저장 |
| `load-api-key` | renderer→main | 저장된 API 키 로드 |
| `run-prompt` | renderer→main | CLI 실행 및 응답 요청 |
| `prompt-response-chunk` | main→renderer | 응답 스트리밍 |
| `prompt-response-done` | main→renderer | 응답 완료/실패 |

---

## 보안 주의사항

- **API 키는 로그에 출력하지 않는다** — `console.log`에 apiKey 변수 절대 포함 금지
- **child_process 인자는 반드시 검증** — 사용자 입력을 shell 명령어에 직접 삽입 금지, `spawn` 배열 방식 사용
- **프로덕션 빌드에서 DevTools 비활성화** — `is.dev` 조건 확인
- API 키 저장 시 평문 저장 위험 인지 — 추후 암호화 고려 (`electron-store` encrypt 옵션)

---

## 개발 명령어

```bash
npm run dev          # 개발 서버 시작 (HMR 포함)
npm run build        # 타입 체크 + 프로덕션 빌드
npm run build:mac    # macOS 배포용 빌드 + 코드 서명
npm run build:win    # Windows NSIS 인스톨러 빌드
npm run build:linux  # Linux AppImage 빌드
npm run typecheck    # main + renderer 타입 체크
npm run lint         # ESLint 검사
```

---

## 개발 진행 상태

개발 순서 및 각 단계별 AI 협업 프롬프트는 `docs/prompts/` 참고.

현재 상태: **boilerplate** (electron-vite 기본 템플릿, 앱 로직 미구현)
