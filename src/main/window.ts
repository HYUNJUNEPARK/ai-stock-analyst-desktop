/**
 * src/main/window.ts — Electron BrowserWindow 생성
 *
 * 메인 윈도우의 생성과 초기화를 담당한다.
 * 앱 생명주기(index.ts)와 분리해 창 관련 설정 변경이 이 파일에만 영향을 주도록 한다.
 */
import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
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
export function createWindow(): void {
  console.log('[createWindow] 메인 윈도우 생성 시작')

  const mainWindow = new BrowserWindow({
    width: 1040,
    height: 780,
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

  // 윈도우가 만들어진 직후 IPC 핸들러를 등록한다.
  // win 참조가 필요한 핸들러들이 있으므로 createWindow 내부에서 호출한다.
  registerIpcHandlers(mainWindow)
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
