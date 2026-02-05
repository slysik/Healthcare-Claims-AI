// src/lib/api.ts
export interface TraceEvent {
  node: string
  status: 'running' | 'complete' | 'error'
  result?: Record<string, unknown>
  timing_ms?: number
}

export interface Citation {
  text: string
  page?: number
  doc_name?: string
  score?: number
}

export interface AgentResponse {
  intent: 'nl2sql' | 'rag' | 'clarify'
  answer: string
  sql?: string
  query_results?: Record<string, unknown>[]
  chart_type?: 'bar' | 'line' | 'pie'
  citations?: Citation[]
  agent_trace: TraceEvent[]
  timing_ms?: number
  sql_retries?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  response_data?: AgentResponse
  timestamp?: string
}

export interface HealthResponse {
  status: string
  duckdb: string
  vectorstore: Record<string, unknown>
  llm_provider: string
  aws_enabled: boolean
  demo_mode: boolean
}

export interface ConfigResponse {
  llm_provider: string
  anthropic_model_id: string
  bedrock_model_id: string
  rag_engine: string
  enable_aws: boolean
  demo_mode: boolean
  sql_max_retries: number
}

export interface UploadResponse {
  filename: string
  status: string
  message: string
  rows?: number
}

const API_BASE = '/api'

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch(`${API_BASE}/config`)
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchSchema(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/schema`)
  if (!res.ok) throw new Error(`Schema fetch failed: ${res.status}`)
  return res.json()
}

export async function sendChat(query: string, conversationId?: string): Promise<AgentResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, conversation_id: conversationId }),
  })
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
  return res.json()
}

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/upload/csv`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`CSV upload failed: ${res.status}`)
  return res.json()
}

export async function uploadPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/upload/pdf`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`PDF upload failed: ${res.status}`)
  return res.json()
}

export async function fetchDatasets(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/datasets`)
  if (!res.ok) throw new Error(`Datasets fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchDocuments(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/documents`)
  if (!res.ok) throw new Error(`Documents fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchChatHistory(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/chat/history/${conversationId}`)
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`)
  return res.json()
}
