# 단계 5 - 프롬프트 입력 화면 구현

## 목표
- 사용자가 질문을 입력하고 제출하는 화면
- 선택한 모델 정보와 현재 사용 중인 API 키 상태를 헤더에 표시
- 제출 시 CLI 실행을 main process에 요청하고 /response로 이동

## 프롬프트

```
src/renderer/src/pages/PromptPage.tsx를 구현해 주세요.

요구사항:

1. 상단 헤더 영역:
   - 현재 선택된 모델 표시 (예: "GPT o3" 또는 "Claude Code")
   - 설정 아이콘 버튼 → 클릭 시 /auth로 이동 (API 키 변경용)

2. 메인 입력 영역:
   - 넓은 textarea (최소 6줄, 자동 높이 조절)
   - placeholder: "AI에게 질문을 입력하세요..."
   - Ctrl+Enter (또는 Cmd+Enter) 단축키로 제출 가능

3. 하단 액션 영역:
   - "제출" 버튼 (textarea가 비어있으면 비활성화)
   - 글자 수 카운터 (우측 하단)

4. 제출 처리:
   - AppContext에 현재 prompt 텍스트 저장 (AppContext에 prompt: string 추가 필요)
   - useNavigate로 /response로 이동
   - (실제 CLI 실행은 ResponsePage에서 처리)

5. AppContext에 다음 상태를 추가합니다:
   - currentPrompt: string
   - setCurrentPrompt: (v: string) => void
   - lastResponse: string
   - setLastResponse: (v: string) => void
```
