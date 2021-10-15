const { app, BrowserWindow } = require('electron')
const path = require('path')
const iconFile = path.join(__dirname, 'service', 'favicon.png')
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
function creteWindow() {
  const win = new BrowserWindow({
    width: 400,
    // minWidth: 400,
    // maxWidth: 400,
    height: 500,
    minHeight: 500,
    icon: iconFile,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  win.loadFile('./service/index.html')
  win.setMenuBarVisibility(false)
}
app.whenReady().then(() => {
  creteWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      creteWindow()
    }
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
