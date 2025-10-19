import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ProjectHub Academy - Academic Project Marketplace',
  description: 'Get your dream academic project - built or ready. 500+ pre-built projects, custom projects in 7 days.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50">
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  )
}