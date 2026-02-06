import { Phone } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface HandoffCTAProps {
  /** Button label (default: "Talk to a Representative") */
  label?: string
  /** Optional context passed as data attribute for analytics */
  context?: string
}

export default function HandoffCTA({
  label = 'Talk to a Representative',
  context,
}: HandoffCTAProps) {
  return (
    <button
      type="button"
      data-handoff-context={context}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border-2 border-bcbs-500 px-4 py-2.5',
        'text-sm font-semibold text-bcbs-600 bg-white',
        'transition-all duration-200',
        'hover:bg-bcbs-50 hover:shadow-md hover:shadow-bcbs-200/50',
        'hover:animate-pulse',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bcbs-400 focus-visible:ring-offset-2',
        'active:scale-[0.98]',
      )}
    >
      <Phone className="h-4 w-4" />
      {label}
    </button>
  )
}
