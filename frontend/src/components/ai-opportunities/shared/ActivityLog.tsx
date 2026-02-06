import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ActivityLogEntry } from '@/mocks/aiOpportunities'

export interface ActivityLogProps {
  entries: ActivityLogEntry[]
  /** Number of entries visible before "Show more" (default 5) */
  maxVisible?: number
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function sourceColor(source: string): string {
  switch (source) {
    case 'Ask My Claims':
      return 'bg-bcbs-100 text-bcbs-700'
    case 'Ask My Plan Docs':
      return 'bg-purple-100 text-purple-700'
    case 'Health Spend Insights':
      return 'bg-emerald-100 text-emerald-700'
    case 'AI Workflows':
      return 'bg-amber-100 text-amber-700'
    case 'Recommendations':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export default function ActivityLog({ entries, maxVisible = 5 }: ActivityLogProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  const visible = expanded ? sorted : sorted.slice(0, maxVisible)
  const hasMore = sorted.length > maxVisible

  return (
    <div className="rounded-lg border border-bcbs-100 bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3',
          'text-sm font-semibold text-bcbs-700 hover:bg-bcbs-50/50 transition-colors',
        )}
      >
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Log
          <span className="text-xs font-normal text-gray-400">({sorted.length})</span>
        </span>
        {hasMore &&
          (expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ))}
      </button>

      {/* Entries */}
      <ul className="divide-y divide-bcbs-50">
        {visible.map((entry, i) => (
          <li key={`${entry.timestamp}-${i}`} className="px-4 py-2.5 text-sm hover:bg-gray-50/50">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-800">{entry.action}</span>
              <span className="shrink-0 text-xs text-gray-400">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{entry.detail}</p>
            <span
              className={cn(
                'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                sourceColor(entry.source),
              )}
            >
              {entry.source}
            </span>
          </li>
        ))}
      </ul>

      {/* Show more / less toggle */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full border-t border-bcbs-50 px-4 py-2 text-xs font-medium text-bcbs-500 hover:bg-bcbs-50/50 transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${sorted.length} entries`}
        </button>
      )}
    </div>
  )
}
