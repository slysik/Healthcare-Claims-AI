import { Lightbulb, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Recommendation } from '@/mocks/aiOpportunities'

export interface ProactiveRecommendationsProps {
  recommendations: Recommendation[]
}

const PRIORITY_STYLES: Record<Recommendation['priority'], { badge: string; border: string }> = {
  high: {
    badge: 'bg-red-100 text-red-700',
    border: 'border-l-red-400',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-l-amber-400',
  },
  low: {
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-l-gray-300',
  },
}

export default function ProactiveRecommendations({ recommendations }: ProactiveRecommendationsProps) {
  if (recommendations.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">Recommendations for You</h3>
        <span className="rounded-full bg-bcbs-100 px-2 py-0.5 text-[10px] font-semibold text-bcbs-700">
          {recommendations.length}
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {recommendations.map((rec) => {
          const style = PRIORITY_STYLES[rec.priority]
          return (
            <div
              key={rec.id}
              className={cn(
                'flex-shrink-0 w-72 snap-start',
                'rounded-lg border border-bcbs-100 bg-white',
                'border-l-4',
                style.border,
                'p-4 space-y-2.5',
                'hover:shadow-md hover:shadow-bcbs-100/40 transition-shadow duration-200',
              )}
            >
              {/* Top row: category + priority */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider truncate">
                  {rec.category}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                    style.badge,
                  )}
                >
                  {rec.priority}
                </span>
              </div>

              {/* Title & description */}
              <h4 className="text-sm font-semibold text-gray-900 leading-snug">{rec.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{rec.description}</p>

              {/* Action button */}
              <button
                type="button"
                className={cn(
                  'mt-auto inline-flex items-center gap-1 text-xs font-semibold text-bcbs-600',
                  'hover:text-bcbs-500 transition-colors',
                )}
              >
                {rec.actionLabel}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
