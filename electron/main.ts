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

interface SnippetItem {
  id: string
  title: string
  content: string
  createdAt: number
}

interface StoreSchema {
  history: HistoryItem[]
  snippets: SnippetItem[]
}

const store = new Store<StoreSchema>({
  defaults: {
    history: [],
    snippets: []
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
    // Send initial snippets
    win?.webContents.send('snippets-update', store.get('snippets'))
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
  const showAtCursor = (w: BrowserWindow) => {
    const cursorPoint = screen.getCursorScreenPoint()
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
    const { x, y, width, height } = currentDisplay.workArea
    const [winWidth, winHeight] = w.getSize()

    // Position at cursor, but clamp so it doesn't go off-screen
    let posX = cursorPoint.x
    let posY = cursorPoint.y

    // Keep within screen bounds
    if (posX + winWidth > x + width) posX = x + width - winWidth
    if (posY + winHeight > y + height) posY = y + height - winHeight
    if (posX < x) posX = x
    if (posY < y) posY = y

    w.setPosition(Math.round(posX), Math.round(posY))
    w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    w.show()
    w.focus()
    w.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true })
  }

  if (win) {
    if (win.isVisible()) {
      win.hide()
    } else {
      showAtCursor(win)
    }
  } else {
    const w = createWindow()
    showAtCursor(w)
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
    
    // 3. Simulate Paste (300ms to let macOS restore focus to previous app)
    setTimeout(() => {
        exec(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`, (error) => {
            if (error) console.error("Paste failed:", error)
        })
    }, 300)
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

  // Snippets CRUD
  ipcMain.on('add-snippet', (_event, snippet: { title: string; content: string }) => {
    const snippets = store.get('snippets')
    const newSnippet: SnippetItem = {
      id: uuidv4(),
      title: snippet.title,
      content: snippet.content,
      createdAt: Date.now()
    }
    const newSnippets = [newSnippet, ...snippets]
    store.set('snippets', newSnippets)
    win?.webContents.send('snippets-update', newSnippets)
  })

  ipcMain.on('update-snippet', (_event, updated: SnippetItem) => {
    const snippets = store.get('snippets')
    const newSnippets = snippets.map(s => s.id === updated.id ? { ...s, title: updated.title, content: updated.content } : s)
    store.set('snippets', newSnippets)
    win?.webContents.send('snippets-update', newSnippets)
  })

  ipcMain.on('delete-snippet', (_event, id: string) => {
    const snippets = store.get('snippets')
    const newSnippets = snippets.filter(s => s.id !== id)
    store.set('snippets', newSnippets)
    win?.webContents.send('snippets-update', newSnippets)
  })

  ipcMain.on('copy-snippet', (_event, content: string) => {
    clipboard.writeText(content)
    lastText = content
    
    // Hide window and simulate paste (300ms to let macOS restore focus)
    win?.hide()
    setTimeout(() => {
      exec(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`, (error) => {
        if (error) console.error("Paste failed:", error)
      })
    }, 300)
  })

})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
