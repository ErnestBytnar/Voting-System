import { ShieldCheck, Lock, Server } from "lucide-react"

export default function SystemBar({ sessionId }: { sessionId: string }) {
  const statusItems = [
    { icon: Server, label: "Nodes Online", active: true },
    { icon: Lock, label: "TLS 1.3 Encrypted", active: true },
  ]

  return (
    <div>
      <div className="system-bar border-b-2 border-emerald-500/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-500">University Secure Vote Protocol v2.0</span>
        </div>
        <div className="flex items-center gap-4">
          {statusItems.map(({ icon: Icon, label, active }) => (
            <div key={label} className="status-badge">
              {active && <div className="status-indicator" />}
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </div>
          ))}
          <div className="status-badge">
            <span>Session ID:</span>
            <span className="mono-text text-emerald-400">{sessionId}</span>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-slate-900 via-emerald-500/30 to-slate-900" />
    </div>
  )
}
