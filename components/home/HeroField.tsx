import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/*
 * The reserve's field: five evenly spaced rings around the dial, each carrying
 * exactly one particle. Gold (Neutron) and red (Proton) alternate outwards,
 * directions alternate, and outer rings orbit slower (period ∝ r^1.5).
 * Units match the dial: 1 unit here = 1 unit of the dial's 400-wide viewBox.
 */
const C = 700
const INNER = 205
const GAP = 60
const COUNT = 5
// Start angles (0° = right, 90° = down) chosen so no particle starts under the control panel.
const STARTS = [200, 320, 250, 20, 160]

const RINGS = Array.from({ length: COUNT }, (_, i) => {
  const r = INNER + i * GAP
  return {
    r,
    kind: i % 2 === 0 ? ("neutron" as const) : ("proton" as const),
    start: STARTS[i],
    reverse: i % 2 === 1,
    duration: Math.round(70 * Math.pow(r / INNER, 1.5)),
  }
})

export default function HeroField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      style={{
        // Fully opaque past the outermost ring; fades only beyond it.
        WebkitMaskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)",
        maskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)",
      }}
    >
      <svg viewBox="0 0 1400 1400" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="hero-field-glow">
            <stop offset="0%" stopColor="var(--neutron)" style={{ stopOpacity: "var(--field-glow)" } as CSSProperties} />
            <stop offset="100%" stopColor="var(--neutron)" stopOpacity={0} />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={420} fill="url(#hero-field-glow)" />

        {RINGS.map(({ r }) => (
          <circle
            key={r}
            cx={C}
            cy={C}
            r={r}
            fill="none"
            stroke="var(--field-track)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {RINGS.map(({ r, kind, start, reverse, duration }) => (
          <g key={`orbit-${r}`} transform={`rotate(${start} ${C} ${C})`}>
            <g
              className="hero-orbit"
              style={
                {
                  animationDuration: `${duration}s`,
                  animationDirection: reverse ? "reverse" : "normal",
                } as CSSProperties
              }
            >
              <circle
                cx={C + r}
                cy={C}
                r={4}
                fill={kind === "neutron" ? "var(--neutron)" : "var(--proton)"}
                stroke="var(--background)"
                strokeWidth={1.5}
              />
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}
