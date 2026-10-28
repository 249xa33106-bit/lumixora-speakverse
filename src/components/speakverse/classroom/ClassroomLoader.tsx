export function ClassroomLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-sv-bg z-10">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-sv-border border-t-sv-primary animate-spin" />
      </div>
      <p className="mt-4 text-sv-text-secondary text-sm font-medium">Loading classroom…</p>
    </div>
  )
}
