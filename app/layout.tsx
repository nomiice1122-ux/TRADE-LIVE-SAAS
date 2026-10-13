import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TradeZella Pro - Trading Journal SaaS',
  description: 'Professional futuristic trading journal with custom capital and fee engine.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-[#070312]">
      <body className="h-full text-purple-100 font-sans antialiased bg-[#070312]">
        {children}
      </body>
    </html>
  )
}
