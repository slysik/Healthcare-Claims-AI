import { useState, useRef, useEffect } from 'react'
import { Send, Square, RotateCcw, Sparkles } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import AgentTrace from './AgentTrace'

const SUGGESTED_QUERIES = [
  'What are total charges by claim status?',
  'Which providers have denied claims?',
  'Show claims by member',
  'What is the deductible for this plan?',
  'Is telehealth covered under this plan?',
]

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const {
    messages,
    isStreaming,
    currentTrace,
    currentAnswer,
    error,
    sendMessage,
    cancelStream,
    retry,
    clearError,
  } = useChat()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentAnswer, currentTrace])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = input.trim()
    if (!query || isStreaming) return
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = '42px'
    }
    sendMessage(query)
  }

  const handleSuggestionClick = (query: string) => {
    if (isStreaming) return
    sendMessage(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea
    const target = e.target
    target.style.height = '42px'
    const scrollHeight = target.scrollHeight
    target.style.height = Math.min(scrollHeight, 128) + 'px'
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-8 space-y-5">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-16 w-16 text-bcbs-400/40 mb-4" />
            <h2 className="text-xl font-semibold text-bcbs-800 mb-2">
              BCBS Claims AI
            </h2>
            <p className="text-sm text-bcbs-600/70 mb-6 max-w-md">
              Query claims data with natural language, search policy documents,
              or get answers about plan benefits.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {SUGGESTED_QUERIES.map((query) => (
                <button
                  key={query}
                  onClick={() => handleSuggestionClick(query)}
                  className="text-sm px-3 py-1.5 rounded-full border border-bcbs-200 text-bcbs-600 shadow-sm ring-1 ring-bcbs-200 hover:ring-bcbs-300 hover:shadow-md hover:bg-bcbs-50 transition-all duration-200"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {/* Streaming state */}
        {isStreaming && (
          <div className="space-y-3">
            {currentTrace.length > 0 && (
              <AgentTrace events={currentTrace} />
            )}
            {currentAnswer && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="prose prose-sm max-w-none">
                  {currentAnswer}
                  <span className="inline-block w-0.5 h-4 bg-bcbs-500 animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}
            {!currentAnswer && currentTrace.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-bcbs-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-bcbs-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-bcbs-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-red-700">{error}</span>
            <div className="flex gap-2">
              <button
                onClick={clearError}
                className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
              >
                Dismiss
              </button>
              <button
                onClick={retry}
                className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries bar (when messages exist) */}
      {messages.length > 0 && !isStreaming && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_QUERIES.slice(0, 3).map((query) => (
              <button
                key={query}
                onClick={() => handleSuggestionClick(query)}
                className="text-xs px-3 py-1 rounded-full border border-bcbs-200 text-bcbs-600 hover:bg-bcbs-50 transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-bcbs-100 bg-white p-3 sm:p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about claims data or plan benefits..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-bcbs-200 focus:outline-none focus:ring-2 focus:ring-bcbs-300 focus:border-bcbs-400 text-sm resize-none max-h-32 min-h-[42px]"
            disabled={isStreaming}
            rows={1}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={cancelStream}
              className="px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors min-h-[48px] sm:min-h-0"
              title="Cancel"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-bcbs-500 to-bcbs-600 text-white hover:from-bcbs-600 hover:to-bcbs-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm min-h-[48px] sm:min-h-0"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
