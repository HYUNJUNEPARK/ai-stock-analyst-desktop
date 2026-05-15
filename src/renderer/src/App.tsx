import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // return (
  //   <>
  //     <img alt="logo" className="logo" src={electronLogo} />
  //     <div className="creator">Powered by electron-vite</div>
  //     <div className="text">
  //       Build an Electron app with <span className="react">React</span>
  //       &nbsp;and <span className="ts">TypeScript</span>
  //     </div>
  //     <p className="tip">
  //       Please try pressing <code>F12</code> to open the devTool
  //     </p>
  //     <div className="actions">
  //       <div className="action">
  //         <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
  //           Documentation
  //         </a>
  //       </div>
  //       <div className="action">
  //         <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
  //           Send IPC
  //         </a>
  //       </div>
  //     </div>
  //     <Versions></Versions>
  //   </>
  // )

    return (
    <main style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#111827',
      color: 'white'
    }}>
      <h1>AI Desktop Client</h1>
      <p>Electron + React + TypeScript 테스트 화면입니다.</p>

      <div style={{
        marginTop: 24,
        padding: 20,
        border: '1px solid #374151',
        borderRadius: 12,
        width: 420
      }}>
        <label>모델 선택</label>

        <select style={{
          width: '100%',
          marginTop: 8,
          padding: 10,
          borderRadius: 8
        }}>
          <option>GPT</option>
          <option>Claude</option>
        </select>

        <textarea
          placeholder="프롬프트를 입력하세요"
          style={{
            width: '100%',
            height: 120,
            marginTop: 16,
            padding: 10,
            borderRadius: 8,
            boxSizing: 'border-box'
          }}
        />

        <button style={{
          width: '100%',
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer'
        }}>
          실행
        </button>
      </div>
    </main>
  )
}

export default App
