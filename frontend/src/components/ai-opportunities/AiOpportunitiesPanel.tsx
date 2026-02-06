import { useState } from 'react'
import { Database, FileText, TrendingUp, Zap, ArrowLeft } from 'lucide-react'
import { FeatureCard, ProactiveRecommendations, ActivityLog } from './shared'
import { MOCK_RECOMMENDATIONS, MOCK_ACTIVITY_LOG } from '@/mocks/aiOpportunities'
import AskMyClaimsModule from './AskMyClaimsModule'
import AskMyPlanDocsModule from './AskMyPlanDocsModule'
import HealthSpendInsightsModule from './HealthSpendInsightsModule'
import AiWorkflowsModule from './AiWorkflowsModule'

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------

type ModuleKey = 'claims' | 'plan-docs' | 'spend-insights' | 'workflows'

interface ModuleConfig {
  key: ModuleKey
  title: string
  description: string
  businessValue: string
  icon: typeof Database
}

const MODULES: ModuleConfig[] = [
  {
    key: 'claims',
    title: 'Ask My Claims',
    description: 'Natural-language claims analytics',
    businessValue:
      'Enable members to query claims data using conversational language instead of complex portal navigation',
    icon: Database,
  },
  {
    key: 'plan-docs',
    title: 'Ask My Plan Documents',
    description: 'AI-powered document Q&A with citations',
    businessValue:
      'Instant answers from benefits documents with source citations, reducing call center volume by 40%',
    icon: FileText,
  },
  {
    key: 'spend-insights',
    title: 'Health Spend Insights',
    description: 'AI-generated spending analysis and recommendations',
    businessValue:
      'Proactive cost insights that help members save money and improve health outcomes',
    icon: TrendingUp,
  },
  {
    key: 'workflows',
    title: 'AI Workflows',
    description: 'Automated multi-step task execution',
    businessValue:
      'Automate appeals, cost comparisons, and verifications that currently require phone calls',
    icon: Zap,
  },
]

// ---------------------------------------------------------------------------
// Module renderer
// ---------------------------------------------------------------------------

function ActiveModuleRenderer({ moduleKey }: { moduleKey: ModuleKey }) {
  switch (moduleKey) {
    case 'claims':
      return <AskMyClaimsModule />
    case 'plan-docs':
      return <AskMyPlanDocsModule />
    case 'spend-insights':
      return <HealthSpendInsightsModule />
    case 'workflows':
      return <AiWorkflowsModule />
  }
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export default function AiOpportunitiesPanel() {
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Future of Member AI</h1>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed max-w-3xl">
            Explore AI capabilities that transform the member experience &mdash; from intelligent
            claims analysis to proactive health insights.
          </p>
        </div>

        {/* Active module view */}
        {activeModule !== null && (
          <div className="space-y-6 animate-slideIn">
            {/* Back button */}
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-bcbs-600 hover:text-bcbs-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to AI Opportunities
            </button>

            {/* Proactive recommendations above the module */}
            <ProactiveRecommendations recommendations={MOCK_RECOMMENDATIONS.slice(0, 4)} />

            {/* Module component */}
            <ActiveModuleRenderer moduleKey={activeModule} />
          </div>
        )}

        {/* Grid view (no active module) */}
        {activeModule === null && (
          <div className="space-y-6">
            {/* Feature cards grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {MODULES.map((mod) => (
                <FeatureCard
                  key={mod.key}
                  icon={mod.icon}
                  title={mod.title}
                  description={mod.description}
                  businessValue={mod.businessValue}
                  onClick={() => setActiveModule(mod.key)}
                />
              ))}
            </div>

            {/* Proactive recommendations below the grid */}
            <ProactiveRecommendations recommendations={MOCK_RECOMMENDATIONS} />

            {/* Activity log (collapsible) */}
            <ActivityLog entries={MOCK_ACTIVITY_LOG} maxVisible={5} />
          </div>
        )}
      </div>
    </div>
  )
}
