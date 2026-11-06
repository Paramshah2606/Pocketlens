// Skeleton shown while an app page loads (keeps the shell visible, avoids a blank screen)
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-24 rounded-3xl bg-white border border-slate-100" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-36 rounded-3xl bg-slate-200/70" />
        <div className="h-36 rounded-3xl bg-white border border-slate-100" />
        <div className="h-36 rounded-3xl bg-white border border-slate-100" />
      </div>
      <div className="h-80 rounded-3xl bg-white border border-slate-100" />
    </div>
  )
}
