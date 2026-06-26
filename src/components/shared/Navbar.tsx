import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ThemeToggle } from './ThemeToggle'
import { SignOutButton } from './SignOutButton'
import { prisma } from '@/lib/prisma'

async function getAppName() {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: 'appName' } })
    return row?.value ?? 'Cairn'
  } catch {
    return 'Cairn'
  }
}

export async function Navbar() {
  const [session, appName] = await Promise.all([auth(), getAppName()])
  const isAdmin = session?.user?.role === 'Admin'
  return (
    <nav style={{ backgroundColor: 'var(--navbar-bg)' }} className="px-6 py-0 flex items-stretch">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 py-4 mr-8 text-white font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Cairn: 4 stacked stones, organic taper, gold top */}
          <rect x="1"   y="15"  width="18" height="4"   rx="2"    fill="white"/>
          <rect x="3.5" y="10"  width="13" height="4"   rx="2"    fill="white" fillOpacity="0.9"/>
          <rect x="6"   y="5.5" width="8"  height="4"   rx="2"    fill="white" fillOpacity="0.8"/>
          <rect x="8"   y="1.5" width="4"  height="3.5" rx="1.75" fill="#CD9A3B"/>
        </svg>
        <span>{appName}</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-stretch gap-1">
        <NavLink href="/assets">Assets</NavLink>
        <NavLink href="/tickets">Tickets</NavLink>
        <NavLink href="/reports">Reports</NavLink>
        <NavLink href="/kiosk">Kiosk</NavLink>
        {isAdmin && <AdminMenu />}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-link flex items-center px-4 text-white/75 hover:text-white text-sm font-medium tracking-wide transition-colors border-b-2 border-transparent">
      {children}
    </Link>
  )
}

function AdminMenu() {
  return (
    <div className="relative group flex items-stretch">
      <button className="flex items-center gap-1 px-4 text-white/70 hover:text-white text-sm font-medium tracking-wide transition-colors border-b-2 border-transparent group-hover:border-white/30 group-hover:text-white">
        Admin
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-60 mt-0.5">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50 min-w-[180px]">
        <div className="rounded-md border shadow-lg overflow-hidden bg-card text-card-foreground">
          <DropdownLink href="/admin/rooms">Rooms</DropdownLink>
          <DropdownLink href="/admin/users">Users</DropdownLink>
          <div className="border-t border-border" />
          <p className="px-3 pt-2 pb-1 text-xs font-mono tracking-widest text-muted-foreground uppercase">Table Config</p>
          <DropdownLink href="/admin/config?tab=assets">Asset Fields</DropdownLink>
          <DropdownLink href="/admin/config?tab=tickets">Ticket Options</DropdownLink>
          <DropdownLink href="/admin/config?tab=parts">Parts Inventory</DropdownLink>
          <div className="border-t border-border" />
          <p className="px-3 pt-2 pb-1 text-xs font-mono tracking-widest text-muted-foreground uppercase">Tools</p>
          <DropdownLink href="/admin/retag">Replace Asset Tag</DropdownLink>
          <div className="border-t border-border" />
          <DropdownLink href="/admin/settings">App Settings</DropdownLink>
          <DropdownLink href="/admin/updates">Updates</DropdownLink>
        </div>
      </div>
    </div>
  )
}

function DropdownLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2 text-sm hover:bg-secondary transition-colors">
      {children}
    </Link>
  )
}
