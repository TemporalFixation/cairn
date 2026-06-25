import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BuildingRoomSelect } from '@/components/shared/BuildingRoomSelect'

global.fetch = jest.fn()

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ rooms: [{ id: 'r1', name: 'Room 101', building: 'MHS' }] }),
  })
})

test('fetches rooms when building is selected', async () => {
  const onBuildingChange = jest.fn()
  const onRoomChange = jest.fn()
  render(
    <BuildingRoomSelect
      buildingValue=""
      roomValue=""
      onBuildingChange={onBuildingChange}
      onRoomChange={onRoomChange}
    />
  )
  fireEvent.change(screen.getByLabelText('Building'), { target: { value: 'MHS' } })
  expect(onBuildingChange).toHaveBeenCalledWith('MHS')
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/rooms?building=MHS'))
})
