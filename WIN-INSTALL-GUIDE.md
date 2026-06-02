# Windows 설치 전 준비 가이드

이 문서는 Windows용 설치파일을 실행하기 전에 사용자가 미리 준비해야 하는 항목만 정리합니다.

## 지원 환경

- Windows 10 또는 Windows 11
- 64-bit PC
- 인터넷 연결
- 기본 브라우저 사용 가능

## 1. Node.js LTS 설치

이 앱은 GPT 또는 Claude CLI를 앱 내부에서 자동 설치합니다.  
다만 CLI 설치 과정에서 `npm`을 사용하므로, 앱 설치 전에 Node.js와 npm이 먼저 설치되어 있어야 합니다.

1. Node.js 공식 사이트에 접속합니다.
   - https://nodejs.org
2. `LTS` 버전의 Windows Installer를 다운로드합니다.
3. 다운로드한 `.msi` 설치파일을 실행합니다.
4. 설치 옵션은 기본값 그대로 진행합니다.
5. 설치가 끝나면 PC를 다시 시작하거나, 최소한 열려 있던 PowerShell/명령 프롬프트를 모두 닫았다가 다시 엽니다.

## 2. Node.js 설치 확인

PowerShell을 열고 아래 명령어를 실행합니다.

```powershell
node -v
npm -v
```

두 명령어 모두 버전 번호가 출력되면 정상입니다.

예시:

```powershell
v22.12.0
10.9.0
```

## 3. AI 서비스 계정 준비

앱에서 선택할 AI 모델에 따라 계정이 필요합니다.

- GPT 사용: OpenAI 계정
- Claude 사용: Anthropic 또는 Claude 계정(개발 중)

앱 실행 후 로그인 과정에서 기본 브라우저가 열리며, 선택한 서비스 계정으로 인증해야 합니다.

## 4. 네트워크 접근 허용

앱 설치 및 사용 중 아래 작업을 위해 인터넷 연결이 필요합니다.

- GPT CLI 또는 Claude CLI 다운로드
- OpenAI 또는 Anthropic 로그인
- AI 분석 요청 실행

회사/학교/공공기관 네트워크에서는 방화벽이나 보안 프로그램 때문에 npm 패키지 설치 또는 AI 서비스 접속이 차단될 수 있습니다. 이 경우 개인 네트워크에서 다시 시도하거나 네트워크 관리자에게 문의해야 합니다.

## 준비 완료 기준

아래 조건을 모두 만족하면 Windows용 앱 설치파일을 실행할 준비가 된 상태입니다.

- Windows 10/11 64-bit PC 사용
- Node.js LTS 설치 완료
- `node -v`, `npm -v` 명령어 정상 출력
- 인터넷 연결 가능
- 기본 브라우저 사용 가능
- OpenAI 또는 Anthropic/Claude 계정 준비 완료
