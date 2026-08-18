import React from 'react'
import { DashboardNav } from '@/components/dashboard-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
