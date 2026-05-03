import type { Metadata } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { CloudFog } from '@/components/CloudFog'

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Abyss — Mantle, in plain English',
  description:
    'Understand what your wallet is doing on Mantle. Translate any transaction or check your token approvals.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Fog layer — fixed, z-0, screen blend */}
        <CloudFog />
        {/* Content layer — above fog */}
        <div className="relative flex flex-col min-h-full" style={{ zIndex: 1 }}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}
