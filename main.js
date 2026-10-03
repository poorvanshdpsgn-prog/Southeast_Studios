const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { createStaticServer } = require('./botforge/desktop/server');

const PORT = 4173;
const server = createStaticServer(__dirname, PORT);

function createWindow() {
    const win = new BrowserWindow({ width: 1440, height: 940, minWidth: 900, minHeight: 650, backgroundColor: '#080f15' });
    win.loadURL(`http://localhost:${PORT}/pages/index.html`);
}

app.whenReady().then(() => {
    server.once('error', error => {
        dialog.showErrorBox('Southeast Studios could not start', error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use. Close the app using that port and try again.` : error.message);
        app.quit();
    });
    server.listen(PORT, 'localhost', createWindow);
});
app.on('before-quit', () => server.close());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
