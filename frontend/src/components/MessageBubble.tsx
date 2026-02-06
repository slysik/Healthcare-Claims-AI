import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@/lib/api'
import AgentTrace from './AgentTrace'
import SqlViewer from './SqlViewer'
import ResultsTable from './ResultsTable'
import ChartView from './ChartView'
import Citations from './Citations'

interface Props {
  message: ChatMessage
}

export default function MessageBubble({ message }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-br from-bcbs-500 to-bcbs-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-md">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    )
  }

  const data = message.response_data

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-3">
        {/* Intent badge */}
        {data && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              data.intent === 'nl2sql'
                ? 'bg-bcbs-50 text-bcbs-600 ring-1 ring-bcbs-200'
                : data.intent === 'rag'
                ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}>
              {data.intent === 'nl2sql' ? 'Data Query' : data.intent === 'rag' ? 'Document Search' : 'Clarification'}
            </span>
            {data.timing_ms && (
              <span className="text-xs text-bcbs-400">
                {(data.timing_ms / 1000).toFixed(1)}s
              </span>
            )}
            {data.sql_retries != null && data.sql_retries > 0 && (
              <span className="text-xs text-amber-500">
                {data.sql_retries} retry
              </span>
            )}
          </div>
        )}

        {/* Agent trace */}
        {data?.agent_trace && data.agent_trace.length > 0 && (
          <AgentTrace events={data.agent_trace} />
        )}

        {/* Answer */}
        <div className="bg-white rounded-xl ring-1 ring-bcbs-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* SQL viewer */}
        {data?.sql && <SqlViewer sql={data.sql} />}

        {/* Results table */}
        {data?.query_results && data.query_results.length > 0 && (
          <ResultsTable data={data.query_results} />
        )}

        {/* Chart */}
        {data?.chart_type && data?.query_results && data.query_results.length > 0 && (
          <ChartView
            data={data.query_results}
            chartType={data.chart_type}
          />
        )}

        {/* Citations */}
        {data?.citations && data.citations.length > 0 && (
          <Citations citations={data.citations} />
        )}
      </div>
    </div>
  )
}
