import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

interface Props {
  sql: string
}

export default function SqlViewer({ sql }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
      >
        <div className="flex items-center gap-2 text-gray-600">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-medium">SQL Query</span>
        </div>
        {isOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        )}
      </button>
      {isOpen && (
        <pre className="px-3 py-2 text-xs bg-gray-900 text-green-400 overflow-x-auto">
          <code>{sql}</code>
        </pre>
      )}
    </div>
  )
}
