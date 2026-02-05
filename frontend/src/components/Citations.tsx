import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import type { Citation } from '@/lib/api'

interface Props {
  citations: Citation[]
}

export default function Citations({ citations }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 transition-colors text-sm text-green-700"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <BookOpen className="h-4 w-4" />
        <span className="font-medium">
          {citations.length} Source{citations.length !== 1 ? 's' : ''}
        </span>
      </button>
      {isOpen && (
        <div className="divide-y divide-gray-100">
          {citations.map((citation, idx) => (
            <div key={idx} className="px-3 py-2">
              <button
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    {citation.doc_name || 'Document'}
                    {citation.page != null ? ` p.${citation.page}` : ''}
                  </span>
                  {citation.score != null && (
                    <span className="text-xs text-gray-400">
                      {(citation.score * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
              </button>
              {expandedIdx === idx && (
                <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2">
                  {citation.text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
