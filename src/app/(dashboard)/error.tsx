'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Something went wrong!</h2>
        <p className="text-sm text-white/50">An error occurred while loading the dashboard.</p>
      </div>
      <Button
        variant="outline"
        onClick={() => reset()}
        className="border-[#333] hover:bg-[#111] text-[#999]"
      >
        Try again
      </Button>
    </div>
  )
}
