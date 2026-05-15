# 단계 8 - 빌드 및 배포 설정

## 목표
- macOS / Windows / Linux 각 플랫폼별 빌드 검증
- 앱 아이콘 및 메타데이터 설정
- 자동 업데이트 또는 배포 준비

## 프롬프트

```
앱 빌드 및 배포 설정을 완성해 주세요.

[electron-builder.yml 설정]

1. 앱 정보 업데이트:
   - appId: com.yourname.aicli-launcher
   - productName: AI CLI Launcher
   - copyright: Copyright © 2025

2. 플랫폼별 설정:
   - macOS: dmg 포맷, 코드 서명 설정 안내 (현재 package.json의 build:mac 스크립트 참고)
   - Windows: nsis 인스톨러 설정
   - Linux: AppImage 포맷

3. resources/ 폴더 구성:
   - resources/icons/ 하위에 각 플랫폼용 아이콘 파일 경로 안내
     (macOS: icon.icns, Windows: icon.ico, Linux: icon.png 512x512)

4. extraResources 설정:
   - CLI 바이너리를 앱 내에 번들할 경우를 대비한 설정 예시

[package.json 빌드 스크립트 개선]

5. 현재 스크립트:
   - build:mac: electron-vite build → electron-builder --mac → codesign
   - build:win: electron-vite build → electron-builder --win
   - build:linux: electron-vite build → electron-builder --linux

   다음을 추가:
   - build:all: 세 플랫폼 모두 빌드 (cross-platform 환경에서 가능한 범위)

[Electron main process 보안 설정 확인]

6. src/main/index.ts에서 다음을 확인/수정합니다:
   - nodeIntegration: false (기본값 유지)
   - contextIsolation: true (기본값 유지)
   - sandbox: false (child_process 사용을 위해 필요한 경우)
   - webSecurity: true 유지

7. 앱 창 설정:
   - 최소 너비/높이: 800x600
   - 기본 크기: 1000x700
   - 타이틀바: 기본 또는 hiddenInset (macOS 스타일)

[배포 체크리스트]

8. 다음 항목을 점검하는 체크리스트를 출력해 주세요:
   - API 키가 메모리에만 존재하고 로그에 출력되지 않는지
   - child_process 실행 시 인자 검증이 되는지 (command injection 방지)
   - electron-store 암호화 여부
   - 프로덕션 빌드에서 devTools 비활성화
```
