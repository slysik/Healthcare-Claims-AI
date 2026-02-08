import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ResultsTable from '@/components/ResultsTable'
import SqlViewer from '@/components/SqlViewer'

describe('Keyboard interaction flows', () => {
  it('sorts results table by keyboard', async () => {
    const user = userEvent.setup()
    render(
      <ResultsTable
        data={[
          { provider: 'Zulu Health', total: 300 },
          { provider: 'Alpha Health', total: 120 },
        ]}
      />,
    )

    await user.tab()
    await user.keyboard('{Enter}')

    const rows = screen.getAllByRole('row')
    const firstDataRow = rows[1]
    expect(firstDataRow).toBeDefined()
    expect(within(firstDataRow!).getByText('Alpha Health')).toBeInTheDocument()
  })

  it('opens SQL viewer with keyboard and exposes copy action', async () => {
    const user = userEvent.setup()
    render(<SqlViewer sql="SELECT * FROM claims;" />)

    const toggle = screen.getByRole('button', { name: /sql query/i })
    expect(screen.queryByText(/select \* from claims;/i)).not.toBeInTheDocument()

    toggle.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByText(/select \* from claims;/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy sql query/i })).toBeInTheDocument()
  })
})
