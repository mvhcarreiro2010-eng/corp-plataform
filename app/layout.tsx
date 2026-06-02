import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CorpHub — Plataforma Corporativa',
  description: 'Aprenda, colabore e cresça junto com sua equipe.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
