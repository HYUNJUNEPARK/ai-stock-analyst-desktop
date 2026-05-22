# AI CLI Launcher - 개발 계획

## 프로젝트 개요

사용자가 PC에 설치하면:
1. GPT 또는 Claude 모델을 선택
2. OS에 맞는 사고 모델 CLI를 자동 다운로드
3. API 키 등록 또는 로그인 완료
4. 프롬프트 입력 화면에서 단발성 질의 후 응답 확인

**기술 스택**: Electron + React + TypeScript (electron-vite 기반)

---

## 진행 상태

| 단계 | 내용 | 상태 | 비고 |
|------|------|------|------|
| 1 | 앱 전체 화면 흐름 및 라우팅 설계 | ✅ 완료 | HashRouter, 5개 페이지, AppContext, AppProvider 모두 구현 완료 |
| 2 | 모델 선택 화면 구현 | ✅ 완료 | UI + 모델 선택 → /download 네비게이션 로직 완료 |
| 3 | CLI 자동 설치 모듈 (main process IPC) | ✅ 완료 | main: spawn으로 npm install -g 실행, preload: contextBridge로 api 노출 |
| 4 | API 키 등록 / 로그인 화면 구현 | ✅ 완료 | validate/save/load-api-key, run-claude-login, run-gpt-login 핸들러 연결 완료 |
| 5 | 프롬프트 입력 화면 구현 | ✅ 완료 | UI + navigate 로직 완료 |
| 6 | CLI 실행 및 응답 출력 화면 구현 | ✅ 완료 | run-prompt 핸들러(spawn), prompt-response-chunk/done 스트리밍, preload 노출 완료 |
| 7 | 전체 UI 스타일링 및 UX 다듬기 | ✅ 완료 | 모든 페이지 UI/스타일 완성 상태 |
| 8 | 빌드 및 배포 설정 | ⏳ 대기 | 미시작 |

---

## 단계 3 상세 — CLI 자동 설치 모듈 ✅

### 구현 내용

**`src/main/index.ts`**
- `start-cli-install` 핸들러: `child_process.spawn`으로 `npm install -g` 실행
- `install-progress` 이벤트: stdout/stderr 라인 단위로 renderer에 전송
- `install-complete` 이벤트: 성공(exit code 0) / 실패 결과 전송
- 플랫폼별 npm 경로 처리 (win32: npm.cmd)

**`src/preload/index.ts`**
- `contextBridge.exposeInMainWorld('api', {...})` 로 renderer에 노출
- `startCliInstall`, `onInstallProgress`, `onInstallComplete` 연결
- IPC 이벤트 리스너를 모듈 최상위에 등록 (콜백 패턴)

### CLI 패키지 매핑
- `gpt` → `npm install -g @openai/codex`
- `claude` → `npm install -g @anthropic-ai/claude-code`

---

## 단계 4 상세 — API 키 등록 / 로그인 ✅

### 구현 내용

**`src/main/index.ts`**
- `validate-api-key`: 모델별 API 키 형식 검증 (GPT: `sk-`, Claude: `sk-ant-`)
- `save-api-key`: API 키를 `app.getPath('userData')/config/apikey.json`에 저장
- `load-api-key`: 모델별 저장된 API 키 로드
- `run-claude-login`: `claude login` 실행, stdout/stderr 스트리밍
- `run-gpt-login`: `codex login` 실행, stdout/stderr 스트리밍

**`src/preload/index.ts`**
- 위 채널들을 `window.api`에 추가 노출

---

## 단계 6 상세 — CLI 실행 및 응답 출력 ✅

### 구현 내용

**`src/main/index.ts`**
- `run-prompt` 핸들러: 모델별 CLI 명령 spawn
  - GPT: `codex exec ...` 기반 단일 실행
  - Claude: `claude -p <prompt> --output-format text`
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` 환경변수로 API 키 전달
- stdout 청크 → `prompt-response-chunk` 이벤트로 스트리밍
- 종료 코드 → `prompt-response-done` 이벤트 전송
- `run-stock-analysis` 핸들러: Claude는 기존 멀티 에이전트 JSON 스트림, GPT는 `src/main/ai/gpt/scripts/analyze-stock.mjs` 실행

**`src/preload/index.ts`**
- `runPrompt`, `onResponseChunk`, `onResponseDone` 노출

---

## 다음 단계

| 단계 | 내용 |
|------|------|
| 8 | 빌드 및 배포 설정 (`electron-builder`, 플랫폼별 패키저) |

---

## 화면 흐름

```
[앱 시작]
    ↓
[모델 선택 화면] ✅
  - GPT (Codex 기반 분석) 선택
  - Claude (claude-code CLI) 선택
    ↓
[CLI 다운로드 화면] 🔄
  - OS 감지 (macOS / Windows / Linux)
  - 해당 CLI 자동 다운로드 & 설치
  - 진행 상태 표시
    ↓
[인증 화면] ⏳
  - GPT 선택 시: Codex 로그인 또는 OpenAI API 키 입력
  - Claude 선택 시: claude login
  - 인증 성공 확인
    ↓
[프롬프트 입력 화면] ✅
  - 텍스트 입력창
  - 제출 버튼
    ↓
[응답 확인 화면] ⏳
  - 모델 응답 출력 (마크다운 렌더링, GPT/Claude 모두 멀티 에이전트 분석 가능)
  - 새 질문하기 버튼 (프롬프트 입력 화면으로 돌아가기)
```

---

## 핵심 아키텍처 결정사항

- **CLI 실행**: Electron main process에서 `child_process.spawn`으로 CLI 실행
- **IPC**: main ↔ renderer 간 `ipcMain` / `ipcRenderer` 통신
- **상태 관리**: React 내장 `useState` / `useContext` (단순한 앱이므로 외부 라이브러리 불필요)
- **설정 저장**: main process에서 직접 파일 저장 (API 키, 선택한 모델)
- **라우팅**: `react-router-dom` (Hash Router 사용, Electron 환경 호환)
