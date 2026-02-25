import { useState, useEffect, useRef } from 'react'
import { Search, Copy, Trash2, Clipboard, Plus, Pencil, Check, X, FileText } from 'lucide-react'

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

type TabType = 'history' | 'snippets'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [snippets, setSnippets] = useState<SnippetItem[]>([])
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
    // Listen for history updates
    const handleUpdate = (_event: any, newHistory: HistoryItem[]) => {
      setHistory(newHistory)
    }

    const handleSnippetsUpdate = (_event: any, newSnippets: SnippetItem[]) => {
      setSnippets(newSnippets)
    }

    window.ipcRenderer.on('history-update', handleUpdate)
    window.ipcRenderer.on('snippets-update', handleSnippetsUpdate)

    return () => {
      window.ipcRenderer.off('history-update', handleUpdate)
      window.ipcRenderer.off('snippets-update', handleSnippetsUpdate)
    }
  }, [])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate when editing or adding
      if (editingId || showAddForm) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const len = activeTab === 'history' ? filteredHistory.length : filteredSnippets.length
        if (len > 0) setSelectedIndex(prev => (prev + 1) % len)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const len = activeTab === 'history' ? filteredHistory.length : filteredSnippets.length
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
        setActiveTab(prev => prev === 'history' ? 'snippets' : 'history')
        setSelectedIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredHistory, filteredSnippets, selectedIndex, activeTab, editingId, showAddForm])

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

  return (
    <div className="h-screen w-full bg-gray-900 text-gray-100 flex flex-col overflow-hidden">
      {/* Search Bar + Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur z-10 sticky top-0">
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => { setActiveTab('history'); setSelectedIndex(0); setSearch('') }}
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
            onClick={() => { setActiveTab('snippets'); setSelectedIndex(0); setSearch('') }}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'snippets'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Snippets
              {snippets.length > 0 && (
                <span className="text-[10px] bg-gray-700 px-1.5 rounded-full">{snippets.length}</span>
              )}
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
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
        ) : (
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
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-800 bg-gray-900 text-[10px] text-gray-500 flex justify-between px-4">
        <div className="flex gap-3">
          <span>Quit: <kbd className="font-sans text-gray-400">Cmd+Q</kbd></span>
          <span>Close: <kbd className="font-sans text-gray-400">Esc</kbd></span>
          <span>Tab: <kbd className="font-sans text-gray-400">Tab</kbd></span>
        </div>
        {activeTab === 'history' ? (
          <button onClick={clearHistory} className="hover:text-red-400 transition-colors">Clear All</button>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Snippet
          </button>
        )}
      </div>
    </div>
  )
}

export default App
