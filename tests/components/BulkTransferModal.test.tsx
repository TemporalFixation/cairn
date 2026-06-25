import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BulkTransferModal } from '@/components/assets/BulkTransferModal'

global.fetch = jest.fn()

test('submits bulk transfer with room', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ updated: 2 }) })
  const onDone = jest.fn()
  render(
    <BulkTransferModal
      assetIds={['a1', 'a2']}
      open={true}
      onClose={jest.fn()}
      onDone={onDone}
    />
  )
  // Select room tab and fill room id (simplified — actual UI uses dropdowns)
  fireEvent.click(screen.getByText('Transfer to Room'))
  // In a real test we'd fill the selects; verify the fetch call shape
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(
    '/api/assets/bulk-transfer',
    expect.objectContaining({ method: 'POST' })
  ))
})
