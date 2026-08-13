import React from 'react'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 border-b border-[#333] flex justify-between items-center backdrop-blur-md sticky top-0 z-50 bg-[#0f0f0f]/80">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-white/90">
          CreatorPassport
        </Link>
        <div className="flex gap-4">
          <Link href="/campaigns/new" className="text-sm px-4 py-2 border rounded-full border-[#333] hover:bg-[#111] transition-colors">
            New Campaign
          </Link>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
