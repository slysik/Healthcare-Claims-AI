import { useState } from 'react'
import Layout from './components/Layout'
import ChatPanel from './components/ChatPanel'
import UploadPanel from './components/UploadPanel'

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'upload'>('chat')

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'chat' ? <ChatPanel /> : <UploadPanel />}
    </Layout>
  )
}
