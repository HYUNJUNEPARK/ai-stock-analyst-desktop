# 단계 4 - API 키 등록 / 로그인 화면 구현

## 목표
- 선택한 모델에 따라 인증 방식 분기
  - GPT: OpenAI API 키 입력 후 유효성 검증
  - Claude: Anthropic API 키 입력 또는 `claude login` 실행
- 인증 성공 시 API 키를 안전하게 로컬 저장
- 인증 완료 후 /prompt 화면으로 이동

## 프롬프트

```
인증 화면과 관련 main process 로직을 구현해 주세요.

[Main Process 추가 - src/main/index.ts]

1. ipcMain 핸들러 'validate-api-key':
   - 파라미터: { model: 'gpt' | 'claude', apiKey: string }
   - GPT: OpenAI API에 간단한 테스트 요청으로 키 유효성 확인
     (fetch로 https://api.openai.com/v1/models 호출, Authorization: Bearer {apiKey})
   - Claude: Anthropic API에 테스트 요청으로 키 유효성 확인
     (fetch로 https://api.anthropic.com/v1/models 호출, x-api-key: {apiKey})
   - 결과: { valid: boolean, error?: string } 반환

2. ipcMain 핸들러 'save-api-key':
   - 파라미터: { model: string, apiKey: string }
   - electron-store 또는 app.getPath('userData')에 JSON 파일로 저장
   - 저장 경로 예: {userData}/config.json

3. ipcMain 핸들러 'load-api-key':
   - 저장된 API 키 반환 (없으면 null)

4. (Claude 전용) ipcMain 핸들러 'run-claude-login':
   - `claude login` 명령을 실행하고 stdout을 실시간 전송
   - 완료 시 성공/실패 이벤트 전송

5. preload에 위 핸들러들에 대응하는 함수를 노출합니다.

[Renderer - AuthPage.tsx]

1. selectedModel이 'gpt'인 경우:
   - "OpenAI API 키를 입력하세요" 안내 문구
   - password 타입 input (눈 아이콘으로 토글 가능)
   - "확인" 버튼 → validateApiKey 호출 → 성공 시 saveApiKey 후 /prompt 이동
   - 오류 메시지 표시

2. selectedModel이 'claude'인 경우:
   - 탭 또는 라디오 버튼으로 두 가지 옵션 선택:
     (A) "API 키로 인증" - GPT와 동일한 방식
     (B) "claude login으로 인증" - 버튼 클릭 시 터미널 스타일 로그 표시
   - 인증 완료 시 /prompt로 이동

3. 저장된 API 키가 있으면 자동으로 채워줍니다 (loadApiKey 호출).

4. "뒤로가기" 버튼으로 모델 선택 화면으로 돌아갈 수 있습니다.

패키지: electron-store 설치 필요 여부를 확인하고 설치 명령어를 알려주세요.
```
