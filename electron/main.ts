import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, screen } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import { exec } from 'node:child_process'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Store interface
interface HistoryItem {
  id: string
  content: string
  timestamp: number
  type: 'text'
}

interface StoreSchema {
  history: HistoryItem[]
}

const store = new Store<StoreSchema>({
  defaults: {
    history: []
  }
})

let win: BrowserWindow | null

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  
  win = new BrowserWindow({
    width: 600,
    height: 400,
    x: (width - 600) / 2,
    y: height / 4, // Position slightly higher
    frame: false, // Frameless for spotlight look
    show: false, // Startup hidden
    alwaysOnTop: true,
    movable: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Hide on blur
  win.on('blur', () => {
    if (!VITE_DEV_SERVER_URL) { // Keep open in dev for easier debugging
       win?.hide()
    }
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    // Send initial history
    win?.webContents.send('history-update', store.get('history'))
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
  
  return win
}

// Clipboard Polling
let lastText = clipboard.readText()

function startClipboardPolling() {
  setInterval(() => {
    const text = clipboard.readText()
    if (text && text !== lastText) {
      lastText = text
      addToHistory(text)
    }
  }, 1000)
}

import { v4 as uuidv4 } from 'uuid'

function addToHistory(text: string) {
  const history = store.get('history')
  const newItem: HistoryItem = {
    id: uuidv4(),
    content: text,
    timestamp: Date.now(),
    type: 'text'
  }
  
  // Filter out duplicates (optional, or just move to top)
  const newHistory = [newItem, ...history.filter(h => h.content !== text)].slice(0, 100) // Limit 100
  
  store.set('history', newHistory)
  
  if (win && !win.isDestroyed()) {
    win.webContents.send('history-update', newHistory)
  }
}


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const toggleWindow = () => {
  if (win) {
    if (win.isVisible()) {
      win.hide()
    } else {
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); // Ensure visible even over full screen apps
      win.show()
      win.focus()
      win.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true }); // Reset usually helps with focus behavior
    }
  } else {
    const w = createWindow()
    w.show()
  }
}

app.whenReady().then(() => {
  createWindow()
  
  // Register Global Shortcut
  const ret = globalShortcut.register('Command+Shift+V', () => {
    toggleWindow()
  })

  if (!ret) {
    console.log('registration failed')
  }

  startClipboardPolling()

  // IPC Handlers
  ipcMain.on('paste-item', (_event, item: HistoryItem) => {
    // 1. Write to clipboard
    clipboard.writeText(item.content)
    lastText = item.content // Update lastText checking to avoid re-adding
    
    // 2. Hide window
    win?.hide()
    
    // 3. Simulate Paste
    setTimeout(() => {
        // Use osascript to simulate Cmd+V
        exec(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`, (error) => {
            if (error) console.error("Paste failed:", error)
        })
    }, 100)
  })
  
  ipcMain.on('delete-item', (_event, id: string) => {
      const history = store.get('history')
      const newHistory = history.filter(h => h.id !== id)
      store.set('history', newHistory)
      win?.webContents.send('history-update', newHistory)
  })
  
  ipcMain.on('clear-history', () => {
      store.set('history', [])
      win?.webContents.send('history-update', [])
  })
  
  ipcMain.on('hide-window', () => {
      win?.hide()
  })

})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
