import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  businessValue: string
  onClick: () => void
  isActive?: boolean
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  businessValue,
  onClick,
  isActive = false,
}: FeatureCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipId = `feature-card-tooltip-${title.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-bcbs-100/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bcbs-400 focus-visible:ring-offset-2',
        isActive
          ? 'border-bcbs-500 bg-bcbs-50/80 shadow-md shadow-bcbs-100/40'
          : 'border-bcbs-100 bg-white hover:border-bcbs-300',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          isActive ? 'bg-bcbs-500 text-white' : 'bg-bcbs-50 text-bcbs-500 group-hover:bg-bcbs-100',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>

      {/* Business value badge with tooltip */}
      <div
        className="relative mt-auto"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        <span
          tabIndex={0}
          aria-describedby={showTooltip ? tooltipId : undefined}
          className={cn(
            'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
            isActive ? 'bg-bcbs-500/10 text-bcbs-700' : 'bg-gray-100 text-gray-600',
          )}
        >
          {businessValue}
        </span>

        {showTooltip && (
          <div
            role="tooltip"
            id={tooltipId}
            className={cn(
              'absolute bottom-full left-0 mb-2 z-10',
              'w-48 rounded-lg bg-gray-900 px-3 py-2',
              'text-xs text-white leading-relaxed shadow-lg',
              'animate-fadeIn',
            )}
          >
            <span className="font-medium">Business Value:</span> {businessValue}
            <div className="absolute top-full left-4 h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    </button>
  )
}
