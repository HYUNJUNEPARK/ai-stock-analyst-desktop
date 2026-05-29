/**
 * src/main/ipc/windows.ts — 보조 창(BrowserWindow) 열기 및 외부 URL IPC 핸들러
 *
 * 담당 채널:
 *   - open-external-url        : 시스템 기본 브라우저로 URL 열기 (양방향)
 *   - open-reports-window      : 보고서 목록 새 창 열기 (양방향)
 *   - open-report-detail-window: 보고서 상세 새 창 열기 (양방향)
 *   - open-guide-window        : 투자 가이드 새 창 열기 (양방향)
 */

import { ipcMain, BrowserWindow, shell } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

function createReportsWindow(): void {
  const reportsWindow = new BrowserWindow({
    width: 560,
    height: 720,
    minWidth: 480,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    title: '이전 보고서',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  reportsWindow.on('ready-to-show', () => {
    reportsWindow.show()
  })

  const hash = `/reports/latest?mode=window`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    reportsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    reportsWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function createGuideWindow(guide: string): void {
  const guideWindow = new BrowserWindow({
    width: 860,
    height: 940,
    minWidth: 700,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: '투자 가이드',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  guideWindow.on('ready-to-show', () => {
    guideWindow.show()
  })

  const hash = `/guide/${guide}?mode=window`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    guideWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    guideWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function createReportDetailWindow(name: string, model: string): void {
  const reportWindow = new BrowserWindow({
    width: 860,
    height: 940,
    minWidth: 840,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    title: '보고서',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  reportWindow.on('ready-to-show', () => {
    reportWindow.show()
  })

  const hash = `/reports/${encodeURIComponent(name)}?mode=window&model=${encodeURIComponent(model)}`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    reportWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    reportWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

/**
 * 보조 창 열기 및 외부 URL IPC 핸들러를 등록한다.
 */
export function registerWindowsHandlers(): void {

  /**
   * IPC 채널: 'open-external-url'
   * 방향: renderer → main (handle = 양방향)
   * 용도: 보고서 내 웹 링크를 시스템 기본 브라우저로 열기
   *
   * http:// 또는 https:// URL만 허용하며, 그 외 스킴은 무시한다.
   */
  ipcMain.handle(IPC.OPEN_EXTERNAL_URL, (_event, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
  })

  ipcMain.handle(IPC.OPEN_REPORTS_WINDOW, () => {
    console.log('[open-reports-window] 보고서 목록 새 창 열기')
    try {
      createReportsWindow()
      return { success: true }
    } catch (error) {
      console.error('[open-reports-window] 보고서 목록 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_REPORT_DETAIL_WINDOW, (_event, name: string, model: string) => {
    console.log(`[open-report-detail-window] 보고서 새 창 열기: ${name}`)
    try {
      createReportDetailWindow(name, model)
      return { success: true }
    } catch (error) {
      console.error('[open-report-detail-window] 보고서 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_GUIDE_WINDOW, (_event, guide: string) => {
    console.log(`[open-guide-window] 가이드 새 창 열기: ${guide}`)
    try {
      createGuideWindow(guide)
      return { success: true }
    } catch (error) {
      console.error('[open-guide-window] 가이드 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
