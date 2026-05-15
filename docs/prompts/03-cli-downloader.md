# 단계 3 - OS 감지 및 CLI 자동 다운로드 모듈

## 목표
- Electron main process에서 OS를 감지하고 선택한 모델에 맞는 CLI를 자동 설치
- 설치 진행 상태를 renderer에 실시간으로 전달 (IPC)
- 설치 완료 후 /auth 화면으로 이동

## 프롬프트

```
Electron main process(src/main/index.ts)와 renderer(src/renderer/src/pages/CliDownloadPage.tsx)를 함께 구현해 주세요.

[Main Process - src/main/index.ts 추가 작업]

1. ipcMain 핸들러 'start-cli-install'을 등록합니다.
   - 파라미터: model ('gpt' | 'claude')
   - OS 감지: process.platform ('darwin' | 'win32' | 'linux')

2. 모델별 설치 명령어:
   - claude (모든 OS): `npm install -g @anthropic-ai/claude-code`
   - gpt (모든 OS): `npm install -g openai` (openai CLI가 없으므로 일단 패키지만 설치)
     → 실제로는 추후 변경 가능하도록 설치 명령어를 상수로 분리

3. child_process.spawn으로 명령 실행, stdout/stderr 데이터를
   `event.sender.send('install-progress', data)` 로 renderer에 전송

4. 설치 완료 시 `event.sender.send('install-complete', { success: true })`
   오류 시 `event.sender.send('install-complete', { success: false, error: message })`

5. preload(src/preload/index.ts)에 다음을 노출합니다:
   - startCliInstall(model: string): void
   - onInstallProgress(callback: (data: string) => void): void
   - onInstallComplete(callback: (result: {success: boolean, error?: string}) => void): void

[Renderer - CliDownloadPage.tsx]

1. 진입 시 자동으로 window.electron.startCliInstall(selectedModel) 호출

2. 설치 로그를 스크롤 가능한 터미널 스타일 박스에 실시간으로 표시

3. 설치 완료 시:
   - 성공: "설치 완료!" 메시지 + '/auth'로 이동 버튼 또는 자동 이동 (3초 후)
   - 실패: 오류 메시지 표시 + "다시 시도" 버튼

4. 로딩 스피너 또는 진행 표시를 포함합니다.
```
