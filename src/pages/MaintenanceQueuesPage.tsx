import { listCallList, listDueSoon, listOverdue } from '../api/client'
import { MaintenanceListPage } from './MaintenanceListPage'

export function DueSoonPage() {
  return (
    <MaintenanceListPage
      title="Due soon"
      description="Vehicles with at least one item approaching its configured interval."
      fetchPage={listDueSoon}
    />
  )
}

export function OverduePage() {
  return (
    <MaintenanceListPage
      title="Overdue"
      description="Vehicles past a configured distance or time interval."
      fetchPage={listOverdue}
    />
  )
}

export function CallListPage() {
  return (
    <MaintenanceListPage
      title="Customer call list"
      description="Display-only queue for staff outreach — no automatic calls or bookings."
      fetchPage={listCallList}
    />
  )
}
