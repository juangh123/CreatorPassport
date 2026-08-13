import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        <p className="text-sm text-white/50">Loading dashboard...</p>
      </div>
    </div>
  )
}
