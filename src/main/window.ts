/**
 * src/main/window.ts — Electron BrowserWindow 생성
 *
 * 메인 윈도우의 생성과 초기화를 담당한다.
 * 앱 생명주기(index.ts)와 분리해 창 관련 설정 변경이 이 파일에만 영향을 주도록 한다.
 */
import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerCliInstallHandlers } from './ipc/cli-install'
import { registerCliStatsHandlers } from './ipc/cli-stats'
import { registerReportFilesHandlers } from './ipc/report-files'
import { registerWindowsHandlers } from './ipc/windows'
import { registerCliAuthHandlers } from './ipc/cli-auth'
import { registerPromptHandlers } from './ipc/prompt'
import { registerStockAnalysisHandlers } from './ipc/stock-analysis'
import { writeTerminalLog } from './utils/spawn'
import icon from '../../resources/icon.png?asset'

/**
 * Electron 메인 윈도우를 생성하고 초기화한다.
 *
 * 주요 설정:
 * - sandbox: false  → child_process 사용을 위해 필요 (contextIsolation은 유지)
 * - preload         → renderer와 main 사이의 브릿지 스크립트 지정
 * - autoHideMenuBar → 상단 메뉴바 자동 숨김 (앱처럼 보이게)
 *
 * 개발 환경에서는 Vite 개발 서버 URL을 로드하고,
 * 프로덕션에서는 빌드된 index.html 파일을 로드한다.
 */
export function createWindow(): BrowserWindow {
  writeTerminalLog('[createWindow] 메인 윈도우 생성 시작')

  const mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    show: false,          // 창이 준비되기 전에 빈 화면이 보이는 것을 방지
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false      // child_process 사용을 위해 허용
    }
  })

  // 창 콘텐츠가 완전히 로드된 후 표시 → 흰 화면 깜빡임 방지
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 앱 내부 링크 클릭 시 새 창 대신 OS 기본 브라우저로 열기
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }   // Electron 내부 새 창 생성은 차단
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])  // Vite HMR 서버
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))  // 빌드 결과물
  }

  return mainWindow
}

/**
 * 모든 IPC 핸들러를 등록한다. 앱 전체 생명주기 동안 딱 한 번만 호출해야 한다.
 * ipcMain.handle()은 전역 등록이므로 창 재생성 시 중복 등록하면 에러가 발생한다.
 *
 * 새 IPC 채널을 추가할 때:
 *   1. ipc/ 하위에 새 파일을 만들어 register*Handlers 함수를 구현한다.
 *   2. 이 함수에서 import 후 호출한다.
 */
export function registerHandlers(win: BrowserWindow): void {
  registerCliInstallHandlers(win)    // CLI 설치, 설치/인증 상태 확인
  registerCliStatsHandlers()         // CLI 사용 통계
  registerReportFilesHandlers()      // 보고서 파일 CRUD + PDF 저장
  registerWindowsHandlers()          // 보조 창 열기, 외부 URL
  registerCliAuthHandlers(win)       // Claude/GPT 로그인
  registerPromptHandlers(win)        // 단발 프롬프트 실행
  registerStockAnalysisHandlers(win) // 주식 멀티 에이전트 분석
}

/**
 * 앱 초기화 시 호출되는 설정 함수
 * optimizer.watchWindowShortcuts: 개발 환경에서 F12 DevTools 단축키 등을 활성화한다.
 */
export function setupApp(): void {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
}
