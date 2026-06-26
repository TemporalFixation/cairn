import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/shared/Navbar'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { Providers } from '@/components/shared/Providers'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Cairn',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        <Providers>
          <ThemeProvider>
            <Navbar />
            <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
