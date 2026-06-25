import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export async function Navbar() {
  const session = await auth()
  return (
    <nav className="border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg">K-12 Inventory</Link>
        <Link href="/assets" className="text-sm text-slate-600 hover:text-slate-900">Assets</Link>
        <Link href="/tickets" className="text-sm text-slate-600 hover:text-slate-900">Tickets</Link>
        {session?.user.role === 'Admin' && (
          <Link href="/admin/rooms" className="text-sm text-slate-600 hover:text-slate-900">Rooms</Link>
        )}
      </div>
      <form action={async () => { 'use server'; await signOut({ redirectTo: '/auth/signin' }) }}>
        <Button variant="ghost" size="sm" type="submit">Sign out</Button>
      </form>
    </nav>
  )
}
