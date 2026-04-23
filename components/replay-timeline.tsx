type TimelineItem = {
  id: string
  type: string
  status: string
  createdAt?: string
  detail?: string
}

export function ReplayTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-zinc-100">
          <div className="flex items-center justify-between gap-4">
            <strong>{item.type}</strong>
            <span className="text-xs uppercase tracking-wide text-zinc-400">{item.status}</span>
          </div>
          {item.detail ? <p className="mt-2 text-sm text-zinc-400">{item.detail}</p> : null}
        </div>
      ))}
    </div>
  )
}
