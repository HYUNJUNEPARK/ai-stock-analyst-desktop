# 단계 6 - CLI 실행 및 응답 출력 화면 구현

## 목표
- main process에서 선택한 모델의 CLI를 실행하고 응답을 수신
- 응답을 마크다운으로 렌더링하여 표시
- 새 질문 버튼으로 프롬프트 입력 화면으로 돌아가기

## 프롬프트

```
CLI 실행 로직과 응답 출력 화면을 구현해 주세요.

[Main Process 추가 - src/main/index.ts]

1. ipcMain 핸들러 'run-prompt':
   - 파라미터: { model: 'gpt' | 'claude', prompt: string, apiKey: string }

   - Claude인 경우:
     - ANTHROPIC_API_KEY 환경변수를 설정하고
     - `claude -p "{prompt}" --output-format text` 명령 실행
     - (claude-code CLI의 non-interactive 모드 사용)

   - GPT인 경우:
     - OPENAI_API_KEY 환경변수를 설정하고
     - Node.js 스크립트로 OpenAI API 직접 호출 (CLI가 없으므로)
     - 또는 main process에서 직접 fetch로 OpenAI Chat Completions API 호출
       POST https://api.openai.com/v1/chat/completions
       model: "o4-mini", messages: [{role: "user", content: prompt}]

   - stdout 데이터를 `event.sender.send('prompt-response-chunk', chunk)` 로 스트리밍 전송
   - 완료 시 `event.sender.send('prompt-response-done', { success: boolean, error?: string })`

2. preload에 노출:
   - runPrompt(params): void
   - onResponseChunk(callback: (chunk: string) => void): void
   - onResponseDone(callback: (result) => void): void

[Renderer - ResponsePage.tsx]

1. 진입 즉시 window.electron.runPrompt({ model, prompt, apiKey }) 호출

2. 로딩 상태:
   - 스피너 또는 "응답을 생성 중입니다..." 애니메이션 텍스트

3. 응답 스트리밍 표시:
   - 청크가 올 때마다 텍스트를 누적하여 화면에 표시
   - react-markdown 패키지로 마크다운 렌더링
   - 코드 블록은 react-syntax-highlighter로 하이라이팅

4. 완료 후 버튼:
   - "새 질문하기" → /prompt로 이동 (currentPrompt 초기화)
   - "응답 복사하기" → 클립보드에 복사

5. 오류 발생 시:
   - 오류 메시지 표시
   - "다시 시도" 버튼

패키지 설치: react-markdown, react-syntax-highlighter, @types/react-syntax-highlighter
```
