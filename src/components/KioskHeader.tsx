import type { ReactNode } from 'react'
import elizadeLogo from '../assets/elizade-logo.png'

type KioskHeaderProps = {
  meta?: ReactNode
}

export function KioskHeader({ meta }: KioskHeaderProps) {
  return (
    <header className="kiosk-header">
      <div className="kiosk-brand">
        <img src={elizadeLogo} alt="Elizade" className="kiosk-logo" />
        <div>
          <h1>Service Board</h1>
          <p>Periodic maintenance &amp; service prices</p>
        </div>
      </div>
      {meta}
    </header>
  )
}
