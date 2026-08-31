export type UserProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'customer' | 'staff' | 'admin'
}

export type AuthToken = {
  accessToken: string
  refreshToken: string | null
  user: UserProfile
}

export type ServiceItem = {
  id: string
  code: string
  name: string
  group: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

export type ServiceHistoryLine = {
  id: string
  serviceItemId: string
  serviceItemCode: string
  serviceItemName: string
  serviceItemGroup: string
  operation: string
  quantity: number | null
  amount: string | null
  notes: string | null
}

export type ServiceHistoryItem = {
  id: string
  ownedVehicleId: string
  customerName: string
  vehicleLabel: string
  performedAt: string
  mileage: number | null
  description: string
  serviceType: string
  cost: string | null
  lines: ServiceHistoryLine[]
}

export type PaginatedHistory = {
  items: ServiceHistoryItem[]
  total: number
  page: number
  size: number
  pages: number
}

export type PriceBookEntry = {
  id: string
  serviceItemCode: string
  serviceItemName: string
  serviceItemGroup: string
  vehicleModel: string
  mileageBandKm: number
  price: string
}

export type PriceBookVersion = {
  id: string
  versionNumber: number
  status: string
  currency: string
  priceInclusive: boolean
  effectiveFrom: string | null
  disclaimer: string | null
  publishedAt: string | null
  entryCount: number
}

export type PriceBookBoard = {
  version: PriceBookVersion
  mileageBandsKm: number[]
  vehicleModels: string[]
  entries: PriceBookEntry[]
}

export type PriceImportPreview = {
  total: number
  valid: number
  failed: number
  duplicateCellsInFile: number
  replacesPublishedVersion: boolean
  currentPublishedVersion: number | null
  rows: Array<{
    row: number
    vehicleModel: string
    serviceItemCode: string
    mileageBandKm: number
    price: string
    action: string
  }>
  errors: Array<{ row: number; errors: string[] }>
}

export type PriceImportPublish = {
  versionId: string
  versionNumber: number
  publishedAt: string
  entryCount: number
  archivedPreviousVersionId: string | null
}
