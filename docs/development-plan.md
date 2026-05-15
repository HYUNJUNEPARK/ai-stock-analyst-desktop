# AI CLI Launcher - 개발 계획

## 프로젝트 개요

사용자가 PC에 설치하면:
1. GPT 또는 Claude 모델을 선택
2. OS에 맞는 사고 모델 CLI를 자동 다운로드
3. API 키 등록 또는 로그인 완료
4. 프롬프트 입력 화면에서 단발성 질의 후 응답 확인

**기술 스택**: Electron + React + TypeScript (electron-vite 기반)

---

## 개발 단계

| 단계 | 내용 | 프롬프트 파일 |
|------|------|--------------|
| 1 | 앱 전체 화면 흐름 및 라우팅 설계 | [01-routing.md](prompts/01-routing.md) |
| 2 | 모델 선택 화면 구현 | [02-model-selection.md](prompts/02-model-selection.md) |
| 3 | OS 감지 및 CLI 자동 다운로드 모듈 | [03-cli-downloader.md](prompts/03-cli-downloader.md) |
| 4 | API 키 등록 / 로그인 화면 구현 | [04-auth.md](prompts/04-auth.md) |
| 5 | 프롬프트 입력 화면 구현 | [05-prompt-input.md](prompts/05-prompt-input.md) |
| 6 | CLI 실행 및 응답 출력 화면 구현 | [06-response-output.md](prompts/06-response-output.md) |
| 7 | 전체 UI 스타일링 및 UX 다듬기 | [07-styling.md](prompts/07-styling.md) |
| 8 | 빌드 및 배포 설정 | [08-build.md](prompts/08-build.md) |

---

## 화면 흐름

```
[앱 시작]
    ↓
[모델 선택 화면]
  - GPT (o3/o4-mini 등) 선택
  - Claude (claude-code CLI) 선택
    ↓
[CLI 다운로드 화면]
  - OS 감지 (macOS / Windows / Linux)
  - 해당 CLI 자동 다운로드 & 설치
  - 진행 상태 표시
    ↓
[인증 화면]
  - GPT 선택 시: OpenAI API 키 입력
  - Claude 선택 시: Anthropic API 키 입력 또는 claude login
  - 인증 성공 확인
    ↓
[프롬프트 입력 화면]
  - 텍스트 입력창
  - 제출 버튼
    ↓
[응답 확인 화면]
  - 모델 응답 출력 (마크다운 렌더링)
  - 새 질문하기 버튼 (프롬프트 입력 화면으로 돌아가기)
```

---

## 핵심 아키텍처 결정사항

- **CLI 실행**: Electron main process에서 `child_process.spawn`으로 CLI 실행
- **IPC**: main ↔ renderer 간 `ipcMain` / `ipcRenderer` 통신
- **상태 관리**: React 내장 `useState` / `useContext` (단순한 앱이므로 외부 라이브러리 불필요)
- **설정 저장**: `electron-store` 또는 main process에서 직접 파일 저장 (API 키, 선택한 모델)
- **라우팅**: `react-router-dom` (Hash Router 사용, Electron 환경 호환)
