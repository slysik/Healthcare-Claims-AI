import { cn } from '@/lib/cn'

export interface ConfidenceIndicatorProps {
  /** Confidence score from 0 to 100 */
  score: number
  /** Optional label displayed next to the bar */
  label?: string
}

function getColor(score: number) {
  if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-100' }
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' }
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-100' }
}

export default function ConfidenceIndicator({ score, label }: ConfidenceIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const color = getColor(clamped)

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className={cn('text-xs font-medium', color.text)}>{label}</span>
      )}
      <div
        className={cn('relative h-2 flex-1 min-w-[60px] rounded-full overflow-hidden', color.bg)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${clamped}%` : `Confidence: ${clamped}%`}
      >
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', color.bar)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={cn('text-xs font-semibold tabular-nums', color.text)}>
        {clamped}%
      </span>
    </div>
  )
}
