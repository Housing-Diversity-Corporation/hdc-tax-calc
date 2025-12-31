import { Dot } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="justify-left flex space-x-1">
      <div className="rounded-xl p-3 backdrop-blur-xl border border-white/30 shadow-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <div className="flex -space-x-2.5">
          <Dot className="h-5 w-5 text-white animate-typing-dot-bounce" />
          <Dot className="h-5 w-5 text-white animate-typing-dot-bounce [animation-delay:90ms]" />
          <Dot className="h-5 w-5 text-white animate-typing-dot-bounce [animation-delay:180ms]" />
        </div>
      </div>
    </div>
  )
}
