import { useState, useEffect, useRef } from 'react'
import { Search, Copy, Trash2, Clipboard, Plus, Pencil, Check, X, FileText, Settings, Keyboard, AlertCircle } from 'lucide-react'

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

type TabType = 'history' | 'snippets' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [snippets, setSnippets] = useState<SnippetItem[]>([])
  const [shortcut, setShortcut] = useState('Command+Shift+V')
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Snippet form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  // Settings state
  const [followCursor, setFollowCursor] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filtered history
  const filteredHistory = history.filter(item =>
    item.content.toLowerCase().includes(search.toLowerCase())
  )

  // Filtered snippets
  const filteredSnippets = snippets.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.content.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    // Listen for updates from main process
    const handleHistoryUpdate = (_event: any, newHistory: HistoryItem[]) => {
      setHistory(newHistory)
    }

    const handleSnippetsUpdate = (_event: any, newSnippets: SnippetItem[]) => {
      setSnippets(newSnippets)
    }

    const handleShortcutUpdate = (_event: any, newShortcut: string) => {
      setShortcut(newShortcut)
      setIsRecording(false)
      setError(null)
    }

    const handleShortcutError = (_event: any, message: string) => {
      setError(message)
      setIsRecording(false)
    }

    const handleSettingsUpdate = (_event: any, settings: { followCursor?: boolean }) => {
      if (settings.followCursor !== undefined) {
        setFollowCursor(settings.followCursor)
      }
    }

    window.ipcRenderer.on('history-update', handleHistoryUpdate)
    window.ipcRenderer.on('snippets-update', handleSnippetsUpdate)
    window.ipcRenderer.on('shortcut-update', handleShortcutUpdate)
    window.ipcRenderer.on('shortcut-error', handleShortcutError)
    window.ipcRenderer.on('settings-update', handleSettingsUpdate)

    // Initial fetch
    window.ipcRenderer.send('get-shortcut')

    return () => {
      window.ipcRenderer.off('history-update', handleHistoryUpdate)
      window.ipcRenderer.off('snippets-update', handleSnippetsUpdate)
      window.ipcRenderer.off('shortcut-update', handleShortcutUpdate)
      window.ipcRenderer.off('shortcut-error', handleShortcutError)
      window.ipcRenderer.off('settings-update', handleSettingsUpdate)
    }
  }, [])

  // Reset selected index when search changes or tab changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search, activeTab])

  // Focus search on mount (unless on settings tab)
  useEffect(() => {
    if (activeTab !== 'settings') {
      searchInputRef.current?.focus()
    }
  }, [activeTab])

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut recording mode
      if (isRecording) {
        e.preventDefault()
        e.stopPropagation()

        const keys: string[] = []
        if (e.metaKey) keys.push('Command')
        if (e.ctrlKey) keys.push('Control')
        if (e.altKey) keys.push('Alt')
        if (e.shiftKey) keys.push('Shift')

        // Add the main key (avoiding lonely modifiers)
        const mainKey = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
          keys.push(mainKey)
          const newShortcut = keys.join('+')
          window.ipcRenderer.send('update-shortcut', newShortcut)
        }
        return
      }

      // Don't navigate when editing or adding
      if (editingId || showAddForm) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const len = activeTab === 'history' ? filteredHistory.length : activeTab === 'snippets' ? filteredSnippets.length : 0
        if (len > 0) setSelectedIndex(prev => (prev + 1) % len)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const len = activeTab === 'history' ? filteredHistory.length : activeTab === 'snippets' ? filteredSnippets.length : 0
        if (len > 0) setSelectedIndex(prev => (prev - 1 + len) % len)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeTab === 'history' && filteredHistory[selectedIndex]) {
          pasteItem(filteredHistory[selectedIndex])
        } else if (activeTab === 'snippets' && filteredSnippets[selectedIndex]) {
          copySnippet(filteredSnippets[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        window.ipcRenderer.send('hide-window')
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setActiveTab(prev => {
          if (prev === 'history') return 'snippets'
          if (prev === 'snippets') return 'settings'
          return 'history'
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [filteredHistory, filteredSnippets, selectedIndex, activeTab, editingId, showAddForm, isRecording])

  const pasteItem = (item: HistoryItem) => {
    window.ipcRenderer.send('paste-item', item)
  }

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    window.ipcRenderer.send('delete-item', id)
  }

  const clearHistory = () => {
    if (confirm('Clear all history?')) {
      window.ipcRenderer.send('clear-history')
    }
  }

  // Snippet actions
  const addSnippet = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    window.ipcRenderer.send('add-snippet', { title: newTitle.trim(), content: newContent.trim() })
    setNewTitle('')
    setNewContent('')
    setShowAddForm(false)
  }

  const startEditing = (e: React.MouseEvent, snippet: SnippetItem) => {
    e.stopPropagation()
    setEditingId(snippet.id)
    setEditTitle(snippet.title)
    setEditContent(snippet.content)
  }

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editTitle.trim() || !editContent.trim()) return
    window.ipcRenderer.send('update-snippet', { id: editingId, title: editTitle.trim(), content: editContent.trim() })
    setEditingId(null)
  }

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const deleteSnippet = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    window.ipcRenderer.send('delete-snippet', id)
  }

  const copySnippet = (snippet: SnippetItem) => {
    window.ipcRenderer.send('copy-snippet', snippet.content)
    setCopiedId(snippet.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const toggleFollowCursor = () => {
    const newValue = !followCursor
    setFollowCursor(newValue)
    window.ipcRenderer.send('update-settings', { followCursor: newValue })
  }

  return (
    <div className="h-screen w-full bg-gray-900 text-gray-100 flex flex-col overflow-hidden">
      {/* Header + Tabs */}
      <div
        className="border-b border-gray-800 bg-gray-900/95 backdrop-blur z-10 sticky top-0"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-800" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'history'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5" />
              History
            </div>
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'snippets'
              ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Snippets
              {snippets.length > 0 && (
                <span className="text-[10px] bg-gray-700 px-1.5 rounded-full ml-1">{snippets.length}</span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'settings'
              ? 'text-gray-200 border-b-2 border-gray-400 bg-gray-400/5'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </div>
          </button>
        </div>

        {/* Search (only for history and snippets) */}
        {activeTab !== 'settings' && (
          <div className="p-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                placeholder={activeTab === 'history' ? 'Search clipboard history...' : 'Search snippets...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'history' ? (
          /* History Tab */
          <>
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Clipboard className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              filteredHistory.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => pasteItem(item)}
                  className={`
                    group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${index === selectedIndex ? 'bg-indigo-600/20 border border-indigo-500/50' : 'hover:bg-gray-800 border border-transparent'}
                  `}
                >
                  <div className="mt-0.5">
                    {index === selectedIndex ? (
                      <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">↵</span>
                      </div>
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm break-all line-clamp-2 ${index === selectedIndex ? 'text-indigo-100' : 'text-gray-300'}`}>
                      {item.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-600">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 uppercase tracking-wider">
                        Text
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteItem(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </>
        ) : activeTab === 'snippets' ? (
          /* Snippets Tab */
          <>
            {/* Add Form */}
            {showAddForm && (
              <div className="p-3 rounded-lg bg-gray-800/50 border border-emerald-500/30 space-y-2 mb-2">
                <input
                  type="text"
                  placeholder="Title..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-500"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowAddForm(false); setNewTitle(''); setNewContent('') } }}
                />
                <textarea
                  placeholder="Content to copy..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-500 resize-none"
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowAddForm(false); setNewTitle(''); setNewContent('') } }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowAddForm(false); setNewTitle(''); setNewContent('') }}
                    className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addSnippet}
                    disabled={!newTitle.trim() || !newContent.trim()}
                    className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {filteredSnippets.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No snippets yet</p>
                <p className="text-xs mt-1">Click + to add a snippet</p>
              </div>
            ) : (
              filteredSnippets.map((snippet, index) => (
                <div
                  key={snippet.id}
                  onClick={() => !editingId && copySnippet(snippet)}
                  className={`
                    group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${editingId === snippet.id
                      ? 'bg-gray-800/80 border border-emerald-500/30'
                      : index === selectedIndex
                        ? 'bg-emerald-600/15 border border-emerald-500/40'
                        : 'hover:bg-gray-800 border border-transparent'
                    }
                  `}
                >
                  {editingId === snippet.id ? (
                    /* Edit Mode */
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                      />
                      <textarea
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={saveEdit}
                          className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
                      <div className="mt-0.5">
                        {copiedId === snippet.id ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        ) : index === selectedIndex ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Copy className="w-2.5 h-2.5 text-white" />
                          </div>
                        ) : (
                          <FileText className="w-4 h-4 text-gray-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${index === selectedIndex ? 'text-emerald-100' : 'text-gray-200'}`}>
                          {snippet.title}
                        </p>
                        <p className="text-xs text-gray-500 break-all line-clamp-2 mt-0.5">
                          {snippet.content}
                        </p>
                      </div>

                      <div className="flex gap-0.5">
                        <button
                          onClick={(e) => startEditing(e, snippet)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-700 hover:text-gray-200 text-gray-500 rounded transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => deleteSnippet(e, snippet.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </>
        ) : (
          /* Settings Tab */
          <div className="p-4 space-y-6">
            {/* Behavior Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Settings className="w-4 h-4" />
                Behavior
              </div>

              <div
                onClick={toggleFollowCursor}
                className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:border-gray-600 transition-colors"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-200">Follow Cursor</div>
                  <div className="text-[11px] text-gray-500">Show the window at your current mouse position</div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${followCursor ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${followCursor ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            </div>

            {/* Shortcut Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Keyboard className="w-4 h-4" />
                Global Shortcut
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => setIsRecording(true)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all cursor-pointer text-center group
                    ${isRecording
                      ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  {isRecording ? (
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <span className="text-indigo-400 font-bold tracking-wider text-lg">RECORDING...</span>
                      <span className="text-xs text-gray-500 italic">Press your desired key combination</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-1.5">
                        {shortcut.split('+').map((key, i) => (
                          <kbd key={i} className="px-2 py-1 bg-gray-700 border-b-2 border-gray-900 rounded text-sm font-sans text-gray-100 shadow-sm">
                            {key}
                          </kbd>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500 group-hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to change shortcut
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-800/30 rounded-xl space-y-3">
                <div className="text-[11px] text-gray-400 leading-relaxed uppercase tracking-widest font-bold">How to use</div>
                <ul className="space-y-2">
                  <li className="text-xs text-gray-500 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                    Press global shortcut from anywhere to open.
                  </li>
                  <li className="text-xs text-gray-500 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    If "Follow Cursor" is ON, it spawns at your mouse.
                  </li>
                  <li className="text-xs text-gray-500 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                    If OFF, it remembers where you last dragged it.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-center">
              <span className="text-[10px] text-gray-600 italic">MacPaste v1.1.0 — Built by Antigravity</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-2 border-t border-gray-800 bg-gray-900 text-[10px] text-gray-500 flex justify-between px-4"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <span>Quit: <kbd className="font-sans text-gray-400">Cmd+Q</kbd></span>
          <span>Close: <kbd className="font-sans text-gray-400">Esc</kbd></span>
          <span>Switch: <kbd className="font-sans text-gray-400">Tab</kbd></span>
        </div>
        {activeTab === 'history' ? (
          <button
            onClick={clearHistory}
            className="hover:text-red-400 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            Clear All
          </button>
        ) : activeTab === 'snippets' ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <Plus className="w-3 h-3" />
            Add Snippet
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default App
