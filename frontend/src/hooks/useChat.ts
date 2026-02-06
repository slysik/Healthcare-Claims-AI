// src/hooks/useChat.ts
import { useState, useCallback, useRef } from 'react'
import type { AgentResponse, ChatMessage, TraceEvent } from '@/lib/api'

interface UseChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  currentTrace: TraceEvent[]
  currentAnswer: string
  error: string | null
  sendMessage: (query: string) => void
  cancelStream: () => void
  retry: () => void
  clearError: () => void
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentTrace, setCurrentTrace] = useState<TraceEvent[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastQueryRef = useRef<string>('')
  const conversationIdRef = useRef<string>(crypto.randomUUID())

  const sendMessage = useCallback((query: string) => {
    lastQueryRef.current = query
    setError(null)
    setCurrentTrace([])
    setCurrentAnswer('')
    setIsStreaming(true)

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    // Create abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    const processStream = async () => {
      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            conversation_id: conversationIdRef.current,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedAnswer = ''
        let traceEvents: TraceEvent[] = []
        let finalResponse: AgentResponse | null = null
        let currentEvent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim()
              continue
            }
            if (!line.trim()) {
              // Blank line terminates one SSE event block
              currentEvent = ''
              continue
            }
            if (!line.startsWith('data: ')) continue

            const dataStr = line.slice(6).trim()
            if (!dataStr) continue

            if (currentEvent === 'answer_chunk') {
              // Backend streams plain text chunks for answer tokens.
              accumulatedAnswer += dataStr
              setCurrentAnswer(accumulatedAnswer)
              continue
            }

            try {
              const data = JSON.parse(dataStr)

              // Determine event type from the data structure
              if (data.node && data.status) {
                // Trace event
                const traceEvent: TraceEvent = data
                traceEvents = [...traceEvents]
                const existingIdx = traceEvents.findIndex(
                  t => t.node === traceEvent.node
                )
                if (existingIdx >= 0) {
                  traceEvents[existingIdx] = traceEvent
                } else {
                  traceEvents.push(traceEvent)
                }
                setCurrentTrace([...traceEvents])
              } else if (data.text !== undefined) {
                // Answer chunk
                accumulatedAnswer += data.text
                setCurrentAnswer(accumulatedAnswer)
              } else if (data.intent) {
                // Complete event
                finalResponse = data as AgentResponse
              } else if (data.message && data.recoverable !== undefined) {
                // Error event
                setError(data.message)
              }
              // Ignore heartbeat events
            } catch {
              // Skip malformed JSON
            }
          }
        }

        // Finalize the assistant message
        if (finalResponse) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: finalResponse.answer,
            response_data: finalResponse,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMessage])
        } else if (accumulatedAnswer) {
          // Fallback: use accumulated answer
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: accumulatedAnswer,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMessage])
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled
          const cancelMessage: ChatMessage = {
            role: 'assistant',
            content: '*Request cancelled*',
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, cancelMessage])
        } else {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error'
          setError(errorMsg)
        }
      } finally {
        setIsStreaming(false)
        setCurrentAnswer('')
        setCurrentTrace([])
        abortControllerRef.current = null
      }
    }

    processStream()
  }, [])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const retry = useCallback(() => {
    if (lastQueryRef.current) {
      // Remove the last user message and any error response
      setMessages(prev => {
        let lastUserIdx = -1
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i]?.role === 'user') { lastUserIdx = i; break }
        }
        if (lastUserIdx >= 0) {
          return prev.slice(0, lastUserIdx)
        }
        return prev
      })
      sendMessage(lastQueryRef.current)
    }
  }, [sendMessage])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    messages,
    isStreaming,
    currentTrace,
    currentAnswer,
    error,
    sendMessage,
    cancelStream,
    retry,
    clearError,
  }
}
