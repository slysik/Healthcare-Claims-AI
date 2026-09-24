import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface AiDisclaimerProps {
  /** 'inline' renders compact text; 'banner' renders a full-width card */
  variant?: 'inline' | 'banner'
}

const DISCLAIMER_TEXT =
  'AI-generated results are for informational purposes only and do not constitute medical or benefits advice. Always verify with your official plan documents or contact Member Services.'

const PRIVACY_NOTE =
  'Queries are sent to the configured LLM provider (Anthropic API or AWS Bedrock). This demo runs on synthetic data only (no PHI); a production deployment would add HIPAA-compliant hosting, access controls, and audit logging.'

export default function AiDisclaimer({ variant = 'inline' }: AiDisclaimerProps) {
  if (variant === 'inline') {
    return (
      <p className="flex items-start gap-1.5 text-xs text-gray-500 leading-relaxed">
        <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-400" />
        <span>{DISCLAIMER_TEXT}</span>
      </p>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-brand-100 bg-brand-50/50 p-4',
        'flex items-start gap-3',
      )}
    >
      <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-brand-500" />
      <div className="space-y-1.5">
        <p className="text-sm text-gray-700 leading-relaxed">{DISCLAIMER_TEXT}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{PRIVACY_NOTE}</p>
      </div>
    </div>
  )
}
