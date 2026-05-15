# npm install -g 실패 — exit code 243

## 발생 위치

`src/main/index.ts` — `start-cli-install` IPC 핸들러

## 증상

CLI 다운로드 화면에서 설치 중 다음 오류 발생:

```
설치 중 오류가 발생했습니다. (exit code: 243)
```

터미널 로그에 아래 메시지가 함께 출력됨:

```
npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path /usr/local/lib/node_modules
npm ERR! errno EACCES
```

## 원인

`npm install -g` 는 시스템 전역 node_modules 디렉토리(`/usr/local/lib/node_modules` 또는 `/opt/homebrew/lib/node_modules`)에 패키지를 설치한다.

해당 디렉토리는 **root 소유**인 경우가 많아, 일반 사용자 권한으로 실행되는 Electron 앱에서는 쓰기가 거부된다.

npm은 이 `EACCES` (Permission Denied) 오류를 **exit code 243** 으로 반환한다.

## 해결 방법

`npm install -g` 대신 `--prefix` 옵션으로 **사용자 홈 디렉토리 하위의 앱 전용 경로**에 설치한다.

```
~/.ai-cli-launcher/
└── node_modules/
    └── .bin/
        ├── claude   ← claude CLI 실행 파일
        └── openai   ← openai CLI 실행 파일
```

### 변경 전

```typescript
spawn(npmCmd, ['install', '-g', pkg], { env: { ...process.env } })
```

### 변경 후

```typescript
const installPrefix = join(homedir(), '.ai-cli-launcher')
spawn(npmCmd, ['install', '--prefix', installPrefix, pkg], { env: { ...process.env } })
```

CLI 실행 시에도 prefix 경로의 `.bin/` 디렉토리를 사용:

```typescript
const cliPath = join(homedir(), '.ai-cli-launcher', 'node_modules', '.bin', cliName)
spawn(cliPath, args, { env })
```

## 영향 범위

- `src/main/index.ts` — CLI 설치 및 실행 핸들러
