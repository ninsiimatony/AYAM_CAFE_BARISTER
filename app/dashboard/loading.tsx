export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-coffee-200 border-t-coffee-600" />
        <p className="text-sm text-coffee-400 animate-pulse">Loading…</p>
      </div>
    </div>
  )
}
