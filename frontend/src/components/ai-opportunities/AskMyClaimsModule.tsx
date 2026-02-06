import { useState, useCallback } from 'react'
import { Database, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ConfidenceIndicator, AiDisclaimer, HandoffCTA } from './shared'
import {
  SAMPLE_CLAIMS_QUERIES,
  MOCK_CLAIMS_RESPONSES,
  type ClaimsResponse,
} from '@/mocks/aiOpportunities'

// ---------------------------------------------------------------------------
// Sub-components (inline)
// ---------------------------------------------------------------------------

function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span>Generated SQL</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <pre className="overflow-x-auto px-4 pb-3 text-xs leading-relaxed text-gray-700 font-mono whitespace-pre-wrap">
          {sql}
        </pre>
      )}
    </div>
  )
}

function SimpleTable({ rows }: { rows: Record<string, string | number>[] }) {
  const firstRow = rows[0]
  if (!firstRow) return null
  const columns = Object.keys(firstRow)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('border-b border-gray-100', i % 2 === 1 && 'bg-gray-50/50')}>
              {columns.map((col) => {
                const val = row[col]
                return (
                  <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {val !== undefined ? String(val) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type ModuleState = 'idle' | 'loading' | 'results' | 'error'

export default function AskMyClaimsModule() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<ModuleState>('idle')
  const [response, setResponse] = useState<ClaimsResponse | null>(null)

  const runQuery = useCallback(async (q: string) => {
    setQuery(q)
    setState('loading')
    setResponse(null)

    try {
      // Simulate analysis delay
      await new Promise<void>((resolve) => setTimeout(resolve, 1000))

      const mock = MOCK_CLAIMS_RESPONSES[q]
      if (mock) {
        setResponse(mock)
        setState('results')
      } else {
        // Fallback for queries without a dedicated mock
        const fallback = Object.values(MOCK_CLAIMS_RESPONSES)[0]
        if (fallback) {
          setResponse(fallback)
          setState('results')
        } else {
          setState('error')
        }
      }
    } catch {
      setState('error')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) void runQuery(query.trim())
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bcbs-100 text-bcbs-600">
          <Database className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Ask My Claims</h2>
      </div>

      {/* Query input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Show me all denied claims in the last 90 days"
          rows={2}
          className={cn(
            'w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3',
            'text-sm text-gray-800 placeholder:text-gray-400',
            'focus:border-bcbs-400 focus:ring-2 focus:ring-bcbs-200 focus:outline-none',
            'transition-colors',
          )}
        />
        <button
          type="submit"
          disabled={!query.trim() || state === 'loading'}
          className={cn(
            'rounded-lg bg-bcbs-600 px-5 py-2 text-sm font-semibold text-white',
            'hover:bg-bcbs-700 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          Analyze Claims
        </button>
      </form>

      {/* Sample prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SAMPLE_CLAIMS_QUERIES.map((sq) => (
          <button
            key={sq.query}
            type="button"
            onClick={() => void runQuery(sq.query)}
            disabled={state === 'loading'}
            className={cn(
              'shrink-0 rounded-full border border-bcbs-200 bg-bcbs-50 px-3 py-1.5',
              'text-xs font-medium text-bcbs-700 whitespace-nowrap',
              'hover:bg-bcbs-100 hover:border-bcbs-300 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {sq.query}
          </button>
        ))}
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-bcbs-500" />
          Analyzing query...
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Something went wrong. Please try again.
        </p>
      )}

      {/* Results */}
      {state === 'results' && response && (
        <div className="space-y-4">
          <AiDisclaimer variant="banner" />

          <SqlBlock sql={response.sql} />

          <SimpleTable rows={response.results} />

          {/* AI Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm leading-relaxed text-gray-700">{response.summary}</p>
            <ConfidenceIndicator score={response.confidence * 100} label="Confidence" />
          </div>
        </div>
      )}

      {/* Handoff CTA */}
      <div className="pt-2">
        <HandoffCTA
          label="Need help understanding your claims?"
          context="ask-my-claims"
        />
      </div>
    </section>
  )
}
