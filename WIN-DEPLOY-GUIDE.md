# Windows 배포 가이드

이 문서는 Windows 사용자가 설치해서 사용할 수 있도록 배포용 설치파일을 만들고 전달하는 방법을 정리합니다.

## 1. 배포 전 확인

배포 작업은 개발 PC의 프로젝트 루트에서 진행합니다.

필수 준비:

- Node.js LTS 설치
- npm 사용 가능
- 프로젝트 의존성 설치 완료

확인 명령:

```powershell
node -v
npm -v
```

## 2. 버전 번호 확인

배포 전에 `package.json`의 `version` 값을 확인합니다.

예:

```json
{
  "version": "1.0.0"
}
```

현재 버전이 `0.0.0`이면 설치파일 이름도 `ai-stock-analytics-0.0.0-setup.exe`처럼 생성됩니다. 실제 사용자 배포 전에는 의미 있는 버전 번호로 변경하는 것을 권장합니다.

## 3. Windows 설치파일 빌드

프로젝트 루트에서 아래 명령을 실행합니다.

```powershell
npm install
npm run build:win
```

빌드가 성공하면 `dist` 폴더에 Windows 설치파일이 생성됩니다.

설정 기준 예상 파일명:

```text
dist\ai-stock-analytics-<version>-setup.exe
```

예:

```text
dist\ai-stock-analytics-1.0.0-setup.exe
```

## 4. 사용자에게 전달할 파일

사용자에게는 소스코드, `node_modules`, `out`, `src` 폴더를 전달하지 않습니다.

전달 대상:

```text
ai-stock-analytics-<version>-setup.exe
INSTALL-GUIDE.md
```

권장 압축 파일 구성:

```text
ai-stock-analytics-windows.zip
├── ai-stock-analytics-<version>-setup.exe
└── INSTALL-GUIDE.md
```

## 5. 전달 방법

파일 크기와 배포 대상에 따라 아래 방식 중 하나를 사용합니다.

- Google Drive, OneDrive, Dropbox에 ZIP 파일 업로드 후 링크 전달
- 사내 메신저 또는 이메일로 ZIP 파일 전달
- GitHub Releases에 설치파일 또는 ZIP 파일 업로드
- 별도 웹사이트나 다운로드 페이지에 업로드

이메일 첨부는 파일 크기 제한이나 보안 차단이 있을 수 있으므로, 일반적으로 Drive/OneDrive 링크 전달이 더 안정적입니다.

## 6. 사용자 안내 문구

사용자에게 설치파일을 전달할 때 아래 내용을 함께 안내합니다.

```text
1. 먼저 INSTALL-GUIDE.md를 열어 Windows 설치 전 준비사항을 확인해 주세요.
2. Node.js LTS를 설치해 주세요.
3. PowerShell에서 node -v, npm -v가 정상 출력되는지 확인해 주세요.
4. 그 다음 ai-stock-analytics-<version>-setup.exe를 실행해 앱을 설치해 주세요.
5. 앱 실행 후 GPT 또는 Claude를 선택하고, 화면 안내에 따라 CLI 설치와 로그인을 진행해 주세요.
```

## 7. 주의사항

현재 앱은 설치파일만으로 완전히 독립 실행되는 구조가 아닙니다. 사용자의 Windows PC에는 앱 실행 전 Node.js와 npm이 설치되어 있어야 합니다.

또한 코드 서명 인증서를 적용하지 않은 설치파일은 Windows SmartScreen 경고가 표시될 수 있습니다. 정식 외부 배포를 계획한다면 Windows 코드 서명 인증서 적용을 권장합니다.

## 8. 최종 배포 체크리스트

- `package.json` 버전 번호 확인
- `npm install` 완료
- `npm run build:win` 성공
- `dist\ai-stock-analytics-<version>-setup.exe` 생성 확인
- `INSTALL-GUIDE.md` 최신 내용 확인
- 설치파일과 `INSTALL-GUIDE.md`를 ZIP으로 묶기
- 사용자에게 설치 전 Node.js LTS 필요 안내
