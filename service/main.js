const { app, BrowserWindow } = require('electron');
const path = require('path');
// const iconFile = path.join(__dirname, 'imgs', 'favicon.png');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function creteWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		// icon: iconFile,
		// resizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'preload.js'),
		},
	});
	win.loadFile('./service/index.html');
	win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
	creteWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			creteWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});