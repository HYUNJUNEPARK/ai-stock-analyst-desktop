# 단계 1 - 앱 전체 화면 흐름 및 라우팅 설계

## 목표
- react-router-dom 설치 및 HashRouter 설정
- 각 화면에 대응하는 페이지 컴포넌트 파일 뼈대 생성
- App.tsx에 전체 라우팅 구조 설정
- 선택한 모델 정보를 전역으로 공유할 Context 생성

## 프롬프트

```
현재 Electron + React + TypeScript (electron-vite) 프로젝트가 있습니다.
src/renderer/src/ 하위에 아래 작업을 진행해 주세요.

1. react-router-dom을 설치하고 App.tsx에 HashRouter 기반 라우팅을 설정합니다.
   라우트 구성:
   - /            → ModelSelectionPage  (모델 선택)
   - /download    → CliDownloadPage     (CLI 다운로드)
   - /auth        → AuthPage            (API 키 / 로그인)
   - /prompt      → PromptPage          (프롬프트 입력)
   - /response    → ResponsePage        (응답 확인)

2. pages/ 폴더를 만들고 위 5개 페이지 컴포넌트를 각각 파일로 생성합니다.
   각 파일은 페이지 이름을 h1으로 보여주는 최소한의 뼈대 컴포넌트로 작성합니다.

3. context/AppContext.tsx 파일을 만들어 아래 전역 상태를 관리합니다:
   - selectedModel: 'gpt' | 'claude' | null
   - apiKey: string
   - setSelectedModel, setApiKey 함수 포함

4. main.tsx에서 AppProvider로 앱 전체를 감쌉니다.

패키지 설치 명령어도 알려주세요.
```
