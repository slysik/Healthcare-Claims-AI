import { useEffect, useState } from 'react'
import { MessageSquare, Upload, Activity } from 'lucide-react'
import type { ConfigResponse } from '@/lib/api'
import { fetchConfig } from '@/lib/api'

interface LayoutProps {
  children: React.ReactNode
  activeTab: 'chat' | 'upload'
  onTabChange: (tab: 'chat' | 'upload') => void
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [config, setConfig] = useState<ConfigResponse | null>(null)

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => {})
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-bcbs-600 to-bcbs-800 shadow-xl text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-auto sm:h-16 flex-wrap">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8" />
              <h1 className="text-xl font-bold">BCBS Claims AI</h1>
            </div>

            {/* Tabs */}
            <nav className="flex gap-1 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => onTabChange('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  activeTab === 'chat'
                    ? 'bg-white/15 backdrop-blur-sm text-white shadow-inner'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
                {activeTab === 'chat' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full" />
                )}
              </button>
              <button
                onClick={() => onTabChange('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  activeTab === 'upload'
                    ? 'bg-white/15 backdrop-blur-sm text-white shadow-inner'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload
                {activeTab === 'upload' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full" />
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-bcbs-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500 flex-col sm:flex-row gap-2 sm:gap-0 text-center sm:text-left">
          <span>Powered by Claude + LangGraph</span>
          <div className="flex items-center gap-2">
            {config ? (
              <>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-bcbs-50 text-bcbs-600 font-medium">
                  {config.llm_provider}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  {config.rag_engine}
                </span>
                {config.demo_mode && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    demo
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="inline-block w-16 h-5 bg-gray-200 rounded-full animate-pulse" />
                <span className="inline-block w-16 h-5 bg-gray-200 rounded-full animate-pulse" />
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
