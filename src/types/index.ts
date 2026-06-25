import type { Asset, Room, RepairTicket, ITUser, Building, Condition, TicketStatus, UserRole } from '@prisma/client'

export type { Asset, Room, RepairTicket, ITUser, Building, Condition, TicketStatus, UserRole }

export type PersonSnapshot = {
  name: string
  email: string
  ou: 'Staff' | 'Student'
}

export type AssetWithRelations = Asset & {
  room: Room | null
  repairTickets: RepairTicket[]
}

export type TicketWithRelations = RepairTicket & {
  asset: Asset
  submittedBy: ITUser
  assignedTo: ITUser | null
}
