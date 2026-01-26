import { useState, useEffect, useRef } from 'react'
import { Search, Copy, Trash2, Clipboard } from 'lucide-react'

interface HistoryItem {
  id: string
  content: string
  timestamp: number
  type: 'text'
}

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filtered history
  const filteredHistory = history.filter(item =>
    item.content.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    // Listen for history updates
    const handleUpdate = (_event: any, newHistory: HistoryItem[]) => {
      setHistory(newHistory)
    }

    window.ipcRenderer.on('history-update', handleUpdate)

    return () => {
      window.ipcRenderer.off('history-update', handleUpdate)
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
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredHistory.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredHistory.length) % filteredHistory.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredHistory[selectedIndex]) {
          pasteItem(filteredHistory[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        window.ipcRenderer.send('hide-window')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredHistory, selectedIndex])

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

  return (
    <div className="h-screen w-full bg-gray-900 text-gray-100 flex flex-col overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur z-10 sticky top-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            placeholder="Search clipboard history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-800 bg-gray-900 text-[10px] text-gray-500 flex justify-between px-4">
        <div className="flex gap-3">
          <span>Quit: <kbd className="font-sans text-gray-400">Cmd+Q</kbd></span>
          <span>Close: <kbd className="font-sans text-gray-400">Esc</kbd></span>
        </div>
        <button onClick={clearHistory} className="hover:text-red-400 transition-colors">Clear All</button>
      </div>
    </div>
  )
}

export default App
