# 단계 2 - 모델 선택 화면 구현

## 목표
- 사용자가 GPT 또는 Claude 중 하나를 선택하는 첫 화면 구현
- 선택 후 /download 라우트로 이동
- AppContext의 selectedModel 상태 업데이트

## 프롬프트

```
src/renderer/src/pages/ModelSelectionPage.tsx를 구현해 주세요.

요구사항:
1. 화면 중앙에 "AI 모델을 선택하세요" 제목을 표시합니다.

2. 두 개의 선택 카드를 나란히 배치합니다:
   - GPT 카드: 아이콘(또는 텍스트 로고),
   - Claude 카드: 아이콘(또는 텍스트 로고),

3. 카드 클릭 시:
   - AppContext의 setSelectedModel 호출 ('gpt' 또는 'claude')
   - useNavigate로 '/download'로 이동

4. 선택된 카드는 테두리 또는 배경색이 강조되도록 합니다 (hover 포함).

5. 스타일은 인라인 스타일 또는 CSS 모듈 중 프로젝트에 맞는 방식을 사용합니다.
   현재 프로젝트는 src/renderer/src/assets/main.css를 사용하고 있습니다.
```
