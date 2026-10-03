"use client"

import { useEffect, useRef, useState, type ComponentType } from "react"

import ErcIcon from "@/components/icons/ErcIcon"
import GaucIcon from "@/components/icons/StableCoinIcon" // file draws the red GAUC mark
import GauIcon from "@/components/icons/ReserveCoinIcon" // file draws the gold GAU mark

type Token = "base" | "neutron" | "proton"

/*
 * Single source of truth for token identity. Neutron (stable) is gold, Proton is red,
 * matching the explorer, create form and the global --neutron / --proton tokens.
 * To flip the pairing, swap the two icon entries and the two colour entries here.
 */
const TOKENS: Record<Token, { label: string; Icon: ComponentType<{ className?: string }>; color: string }> = {
  base: { label: "Base token", Icon: ErcIcon, color: "var(--foreground)" },
  neutron: { label: "Neutron", Icon: GauIcon, color: "var(--neutron)" },
  proton: { label: "Proton", Icon: GaucIcon, color: "var(--proton)" },
}

const REACTIONS: { name: string; description: string; from: Token[]; to: Token[] }[] = [
  {
    name: "Fission",
    description: "Splits base tokens into Neutron and Proton.",
    from: ["base"],
    to: ["neutron", "proton"],
  },
  {
    name: "Fusion",
    description: "Merges Neutron and Proton back into base tokens.",
    from: ["neutron", "proton"],
    to: ["base"],
  },
  {
    name: "Transmute β⁺",
    description: "Converts Proton into Neutron with a dynamic fee based on recent transmutation activity and the reactor reserve.",
    from: ["proton"],
    to: ["neutron"],
  },
  {
    name: "Transmute β⁻",
    description: "Converts Neutron into Proton with a dynamic fee based on recent transmutation activity and the reactor reserve.",
    from: ["neutron"],
    to: ["proton"],
  },
]

type Beam = { d: string; x1: number; x2: number; from: Token; to: Token }

function TokenNode({ token, nodeRef }: { token: Token; nodeRef: (el: HTMLSpanElement | null) => void }) {
  const { Icon, label } = TOKENS[token]
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        ref={nodeRef}
        aria-hidden="true"
        className="relative grid size-9 place-items-center rounded-full bg-background ring-1 ring-border"
      >
        <Icon className="size-9" />
      </span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  )
}

function ReactionDiagram({ from, to, index, active }: { from: Token[]; to: Token[]; index: number; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fromRefs = useRef<(HTMLSpanElement | null)[]>([])
  const toRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [beams, setBeams] = useState<Beam[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const box = container.getBoundingClientRect()
      const centre = (el: HTMLSpanElement | null) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, r: r.width / 2 }
      }
      const next: Beam[] = []
      from.forEach((f, i) => {
        to.forEach((t, j) => {
          const a = centre(fromRefs.current[i])
          const b = centre(toRefs.current[j])
          if (!a || !b) return
          const sx = a.x + a.r + 4
          const ex = b.x - b.r - 4
          const mx = (sx + ex) / 2
          next.push({ d: `M ${sx} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${ex} ${b.y}`, x1: sx, x2: ex, from: f, to: t })
        })
      })
      setSize({ w: box.width, h: box.height })
      setBeams(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [from, to])

  return (
    <div ref={containerRef} className="relative flex h-36 items-center justify-between rounded-xl border border-border bg-background px-5 sm:px-7">
      <svg
        aria-hidden="true"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
        className="pointer-events-none absolute inset-0"
        fill="none"
      >
        <defs>
          {beams.map((beam, i) => (
            <linearGradient
              key={i}
              id={`reaction-${index}-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={beam.x1}
              x2={beam.x2}
              y1={0}
              y2={0}
            >
              <stop offset="0%" stopColor={TOKENS[beam.from].color} />
              <stop offset="100%" stopColor={TOKENS[beam.to].color} />
            </linearGradient>
          ))}
        </defs>
        {beams.map((beam, i) => (
          <g key={i}>
            <path d={beam.d} stroke="var(--line-strong)" strokeWidth={1.25} strokeLinecap="round" />
            {active && (
              <path
                d={beam.d}
                pathLength={1}
                stroke={`url(#reaction-${index}-${i})`}
                strokeWidth={2}
                strokeLinecap="round"
                className="reaction-pulse"
                style={{ animationDelay: `${index * 0.35 + i * 0.25}s` }}
              />
            )}
          </g>
        ))}
      </svg>

      <div className="relative z-10 flex flex-col gap-3">
        {from.map((token, i) => (
          <TokenNode key={`from-${token}`} token={token} nodeRef={(el) => { fromRefs.current[i] = el }} />
        ))}
      </div>
      <div className="relative z-10 flex flex-col gap-3">
        {to.map((token, i) => (
          <TokenNode key={`to-${token}`} token={token} nodeRef={(el) => { toRefs.current[i] = el }} />
        ))}
      </div>
    </div>
  )
}

export default function ReactionFlows() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  // Beams only animate while the section is on screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "80px" })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="grid gap-4 sm:grid-cols-2">
      {REACTIONS.map((reaction, index) => (
        <article key={reaction.name} className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5">
          <ReactionDiagram from={reaction.from} to={reaction.to} index={index} active={active} />
          <h3 className="mt-4 font-semibold text-foreground">{reaction.name}</h3>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">{reaction.description}</p>
        </article>
      ))}
    </div>
  )
}
