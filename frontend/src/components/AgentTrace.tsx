import { Check, Loader2, AlertCircle } from 'lucide-react'
import type { TraceEvent } from '@/lib/api'

const NODE_LABELS: Record<string, string> = {
  classify: 'Classify',
  generate_sql: 'Generate SQL',
  execute_query: 'Execute',
  fix_sql: 'Fix SQL',
  search_docs: 'Search Docs',
  synthesize: 'Synthesize',
}

interface Props {
  events: TraceEvent[]
}

export default function AgentTrace({ events }: Props) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1
        const label = NODE_LABELS[event.node] || event.node

        return (
          <div key={event.node} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                event.status === 'running'
                  ? 'bg-bcbs-blue/10 text-bcbs-blue border border-bcbs-blue/20 animate-pulse'
                  : event.status === 'complete'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {event.status === 'running' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : event.status === 'complete' ? (
                <Check className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {label}
              {event.timing_ms && (
                <span className="text-[10px] opacity-60">
                  {event.timing_ms < 1000
                    ? `${Math.round(event.timing_ms)}ms`
                    : `${(event.timing_ms / 1000).toFixed(1)}s`}
                </span>
              )}
            </div>
            {!isLast && (
              <div className="w-3 h-px bg-gray-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}
