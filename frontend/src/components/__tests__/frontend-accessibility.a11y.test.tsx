import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import HandoffCTA from '@/components/ai-opportunities/shared/HandoffCTA'
import FeatureCard from '@/components/ai-opportunities/shared/FeatureCard'
import ResultsTable from '@/components/ResultsTable'
import { Database } from 'lucide-react'

describe('Frontend accessibility', () => {
  it('has no detectable axe violations for key interactive surfaces', async () => {
    const { container } = render(
      <div>
        <HandoffCTA label="Talk to support" />
        <FeatureCard
          icon={Database}
          title="Ask My Claims"
          description="Natural-language claims analytics"
          businessValue="Reduce portal friction"
          onClick={() => {}}
        />
        <ResultsTable
          data={[
            { provider: 'Alpha', total: 250 },
            { provider: 'Beta', total: 100 },
          ]}
        />
      </div>,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
