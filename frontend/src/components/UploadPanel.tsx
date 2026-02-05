import { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadCSV, uploadPDF, fetchDatasets, fetchDocuments } from '@/lib/api'

interface UploadStatus {
  type: 'success' | 'error'
  message: string
}

export default function UploadPanel() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<UploadStatus | null>(null)
  const [datasets, setDatasets] = useState<Record<string, unknown> | null>(null)
  const [documents, setDocuments] = useState<Record<string, unknown> | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [ds, docs] = await Promise.all([fetchDatasets(), fetchDocuments()])
      setDatasets(ds)
      setDocuments(docs)
    } catch {
      // Ignore errors on load
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFile = async (file: File) => {
    setUploading(true)
    setStatus(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'csv') {
        const result = await uploadCSV(file)
        setStatus({ type: 'success', message: `${result.filename}: ${result.message}` })
      } else if (ext === 'pdf') {
        const result = await uploadPDF(file)
        setStatus({ type: 'success', message: `${result.filename}: ${result.message}` })
      } else {
        setStatus({ type: 'error', message: 'Unsupported file type. Please upload a .csv or .pdf file.' })
        return
      }
      loadData()
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? 'border-bcbs-blue bg-bcbs-blue/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-bcbs-blue' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700 mb-1">
          {uploading ? 'Uploading...' : 'Drop a CSV or PDF file here'}
        </p>
        <p className="text-xs text-gray-500 mb-4">
          CSV files load into DuckDB for queries. PDF files are indexed for search.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bcbs-blue text-white text-sm font-medium hover:bg-bcbs-blue-dark cursor-pointer transition-colors">
          <Upload className="h-4 w-4" />
          Browse files
          <input
            type="file"
            accept=".csv,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Status toast */}
      {status && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          status.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {status.message}
        </div>
      )}

      {/* Loaded data info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-bcbs-blue" />
            <h3 className="font-medium text-sm">Datasets</h3>
          </div>
          {datasets ? (
            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
              {JSON.stringify(datasets, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-gray-400">No datasets loaded</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-sm">Documents</h3>
          </div>
          {documents ? (
            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
              {JSON.stringify(documents, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-gray-400">No documents indexed</p>
          )}
        </div>
      </div>
    </div>
  )
}
