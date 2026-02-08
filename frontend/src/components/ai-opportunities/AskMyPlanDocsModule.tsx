import { useState, useCallback } from 'react'
import { FileText, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/cn'
import { ConfidenceIndicator, AiDisclaimer, HandoffCTA } from './shared'
import {
  SAMPLE_PLAN_QUESTIONS,
  MOCK_PLAN_RESPONSES,
  type PlanResponse,
  type Citation,
} from '@/mocks/aiOpportunities'

// ---------------------------------------------------------------------------
// Follow-up mock responses
// ---------------------------------------------------------------------------

const FOLLOWUP_RESPONSES: Record<string, PlanResponse> = {
  fallback: {
    answer:
      'Based on your plan documents, I can help clarify that. Your Blue Options Gold PPO plan provides comprehensive coverage for most medically necessary services. For the most accurate answer to your specific question, I recommend checking the Schedule of Benefits on pages 12-18 of your plan booklet or calling Member Services at 1-800-868-2528.',
    citations: [
      { text: 'This plan provides coverage for medically necessary services as defined in the Certificate of Coverage.', page: 8, section: 'General Provisions', relevance: 0.72 },
    ],
    confidence: 0.68,
  },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CitationsPanel({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span>Citations ({citations.length} sources)</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <ul className="divide-y divide-gray-200">
          {citations.map((c, i) => (
            <li key={i} className="px-4 py-3 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-xs font-semibold text-gray-700">
                  p.{c.page} &mdash; {c.section}
                </span>
                <div className="w-32">
                  <ConfidenceIndicator score={c.relevance * 100} label="Relevance" />
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">&ldquo;{c.text}&rdquo;</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Conversation types
// ---------------------------------------------------------------------------

type Message = {
  role: 'user' | 'assistant'
  content: string
  response?: PlanResponse
}

type ModuleState = 'idle' | 'loading' | 'ready'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AskMyPlanDocsModule() {
  const [input, setInput] = useState('')
  const [state, setState] = useState<ModuleState>('idle')
  const [messages, setMessages] = useState<Message[]>([])

  const submitQuestion = useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return

      setInput('')
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setState('loading')

      // Simulate search delay
      await new Promise<void>((resolve) => setTimeout(resolve, 1500))

      const mock =
        MOCK_PLAN_RESPONSES[trimmed] ?? FOLLOWUP_RESPONSES['fallback']
      if (!mock) return // should never happen, but satisfies strictness

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: mock.answer, response: mock },
      ])
      setState('ready')
    },
    [],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitQuestion(input)
  }

  const maxFollowups = 3
  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const canAsk = userMessageCount < maxFollowups || state === 'idle'

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bcbs-100 text-bcbs-600">
          <FileText className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Ask My Plan Documents</h2>
      </div>

      {/* Sample questions (only show when idle) */}
      {messages.length === 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_PLAN_QUESTIONS.map((sq) => (
            <button
              key={sq.question}
              type="button"
              onClick={() => void submitQuestion(sq.question)}
              disabled={state === 'loading'}
              className={cn(
                'shrink-0 rounded-full border border-bcbs-200 bg-bcbs-50 px-3 py-1.5',
                'text-xs font-medium text-bcbs-700 whitespace-nowrap',
                'hover:bg-bcbs-100 hover:border-bcbs-300 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {sq.question}
            </button>
          ))}
        </div>
      )}

      {/* Conversation thread */}
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((msg, i) => {
            if (msg.role === 'user') {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-bcbs-600 px-4 py-2.5 text-sm text-white">
                    {msg.content}
                  </div>
                </div>
              )
            }

            const resp = msg.response
            return (
              <div key={i} className="space-y-3">
                {/* Answer with markdown */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {resp && (
                    <ConfidenceIndicator score={resp.confidence * 100} label="Confidence" />
                  )}
                </div>

                {/* Citations */}
                {resp && resp.citations.length > 0 && (
                  <CitationsPanel citations={resp.citations} />
                )}

                {/* Inline disclaimer with privacy note */}
                <AiDisclaimer variant="banner" />
              </div>
            )
          })}
        </div>
      )}

      {/* Loading */}
      {state === 'loading' && (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-bcbs-500" />
          Searching plan documents...
        </div>
      )}

      {/* Input */}
      {canAsk ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              messages.length === 0
                ? 'Ask a question about your plan documents...'
                : 'Ask a follow-up question...'
            }
            disabled={state === 'loading'}
            className={cn(
              'flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5',
              'text-sm text-gray-800 placeholder:text-gray-400',
              'focus:border-bcbs-400 focus:ring-2 focus:ring-bcbs-200 focus:outline-none',
              'disabled:opacity-50 transition-colors',
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || state === 'loading'}
            aria-label="Send follow-up question"
            className={cn(
              'flex items-center justify-center rounded-lg bg-bcbs-600 px-4 py-2.5',
              'text-white hover:bg-bcbs-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-500">
          Follow-up limit reached. Start a new conversation or contact Member Services.
        </p>
      )}

      {/* Handoff CTA */}
      <div className="pt-2">
        <HandoffCTA
          label="Questions about your benefits? Talk to a specialist"
          context="ask-my-plan-docs"
        />
      </div>
    </section>
  )
}
