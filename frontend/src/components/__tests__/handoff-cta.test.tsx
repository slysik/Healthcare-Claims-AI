import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HandoffCTA from '@/components/ai-opportunities/shared/HandoffCTA'

describe('HandoffCTA', () => {
  it('renders as demo-only and disabled when no action is provided', () => {
    render(<HandoffCTA label="Talk to support" context="demo-context" />)

    const button = screen.getByRole('button', { name: /talk to support \(demo only\)/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('data-handoff-context', 'demo-context')
    expect(button).toHaveAttribute('title', 'Demo only action')
  })

  it('calls onClick when handoff action is available', () => {
    const onClick = vi.fn()
    render(<HandoffCTA label="Connect now" onClick={onClick} />)

    const button = screen.getByRole('button', { name: /connect now/i })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
