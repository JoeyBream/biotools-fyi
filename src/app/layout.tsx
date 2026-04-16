import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'biotools.fyi — AI tools for biological research',
  description:
    'A searchable directory of AI-enabled tools for biology, with open-source status, provenance, and risk context.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground">
        <header className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              biotools.fyi
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted">
              <Link href="/" className="hover:text-foreground transition-colors">
                Directory
              </Link>
              <a
                href="https://github.com/JoeyBream/biotools-fyi"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            Built by{' '}
            <a
              href="https://sentinelbio.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Sentinel Bio
            </a>
            . Data sourced from public literature and repositories.
          </div>
        </footer>
      </body>
    </html>
  )
}
