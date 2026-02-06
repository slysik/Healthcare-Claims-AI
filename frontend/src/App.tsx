import { lazy, Suspense, useState } from 'react'
import Layout from './components/Layout'
import type { TabId } from './components/Layout'
import ChatPanel from './components/ChatPanel'
import UploadPanel from './components/UploadPanel'
import { ENABLE_AI_OPPORTUNITIES } from '@/config/featureFlags'

const AiOpportunitiesPanel = lazy(() => import('./components/ai-opportunities/AiOpportunitiesPanel'))

function TabContent({ activeTab }: { activeTab: TabId }) {
  if (activeTab === 'chat') return <ChatPanel />
  if (activeTab === 'upload') return <UploadPanel />
  if (activeTab === 'ai' && ENABLE_AI_OPPORTUNITIES) {
    return (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Loading AI Opportunities...
          </div>
        }
      >
        <AiOpportunitiesPanel />
      </Suspense>
    )
  }
  return <ChatPanel />
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('chat')

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div key={activeTab} className="animate-fadeIn h-full">
        <TabContent activeTab={activeTab} />
      </div>
    </Layout>
  )
}
