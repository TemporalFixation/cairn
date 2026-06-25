import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BulkTransferModal } from '@/components/assets/BulkTransferModal'

global.fetch = jest.fn()

jest.mock('@/components/shared/BuildingRoomSelect', () => ({
  BuildingRoomSelect: ({ onBuildingChange, onRoomChange }: any) => {
    return (
      <div>
        <button onClick={() => { onBuildingChange('MHS'); onRoomChange('r1') }}>
          Select Room
        </button>
      </div>
    )
  }
}))

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
  // Select room tab
  fireEvent.click(screen.getByText('Transfer to Room'))
  // Set building and room using mocked BuildingRoomSelect
  fireEvent.click(screen.getByText('Select Room'))
  // Now click Confirm with room selected
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(
    '/api/assets/bulk-transfer',
    expect.objectContaining({ method: 'POST' })
  ))
})
