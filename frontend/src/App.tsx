import { useState } from 'react'
import Layout from './components/Layout'
import ChatPanel from './components/ChatPanel'
import UploadPanel from './components/UploadPanel'

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'upload'>('chat')

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div key={activeTab} className="animate-fadeIn h-full">
        {activeTab === 'chat' ? <ChatPanel /> : <UploadPanel />}
      </div>
    </Layout>
  )
}
