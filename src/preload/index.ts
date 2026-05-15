import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    // api는 실제 IPC 핸들러가 구현된 뒤 여기에 추가합니다.
    // 개발 중에는 renderer/src/mock/mockApi.ts 가 window.api 를 주입합니다.
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
