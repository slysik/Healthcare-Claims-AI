import { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'

interface Props {
  data: Record<string, unknown>[]
}

export default function ResultsTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const columns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]!)
  }, [data])

  const sortedData = useMemo(() => {
    if (!sortKey) return data.slice(0, 50)
    return [...data].slice(0, 50).sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (data.length === 0) return null

  return (
    <div className="ring-1 ring-bcbs-100 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm">
          <thead className="bg-bcbs-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-bcbs-700 whitespace-nowrap text-xs sm:text-sm"
                  aria-sort={
                    sortKey === col
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col)}
                    className="flex items-center gap-1 hover:bg-bcbs-100 transition-colors duration-150 rounded px-1 py-0.5 -mx-1"
                    aria-label={`Sort by ${col}`}
                  >
                    {col}
                    <ArrowUpDown className="h-3 w-3 text-bcbs-300" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bcbs-100/50">
            {sortedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-bcbs-50/50 transition-colors duration-150">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-1.5 whitespace-nowrap text-gray-700 text-xs sm:text-sm">
                    {row[col] != null ? String(row[col]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 50 && (
        <div className="px-3 py-1.5 bg-bcbs-50 text-xs text-bcbs-500 border-t border-bcbs-100">
          Showing 50 of {data.length} rows
        </div>
      )}
    </div>
  )
}
