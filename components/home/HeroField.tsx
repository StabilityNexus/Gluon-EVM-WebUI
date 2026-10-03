"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

/*
 * The reserve's field: rings around the dial, each carrying one particle.
 * It is laid out from real measurements, so the rings always fit the space
 * they have instead of running off smaller screens:
 *  - side-by-side hero (laptop/desktop): every ring stays inside the section,
 *    the area under the navbar, and the right edge of the viewport;
 *  - stacked hero (phone/tablet): rings may extend just past the screen sides,
 *    where they fade out softly.
 * Ring count (up to 5) and spacing adapt to the room available.
 */

const MAX_RINGS = 5
const NAV_ZONE = 80 // px of page above the hero (main's top padding under the nav)
const EDGE = 16 // breathing room from any edge
const STARTS = [200, 320, 250, 20, 160] // degrees; 0 = right, 90 = down

type Layout = {
  w: number
  h: number
  cx: number
  cy: number
  dialR: number
  rings: number[]
  stacked: boolean
}

function computeLayout(section: DOMRect, dial: DOMRect): Layout {
  const w = section.width
  const h = section.height + NAV_ZONE
  const cx = dial.left - section.left + dial.width / 2
  const cy = dial.top - section.top + dial.height / 2 + NAV_ZONE
  const dialR = (dial.width * 150) / 400 // the dial's circle is r=150 in a 400 viewBox

  const stacked = cx < w * 0.6 // dial is centred under the copy
  const inner = dialR * 1.37
  const idealGap = dialR * 0.4
  const minGap = dialR * 0.26
  const outerLimit = dialR * 2.97

  const vertical = Math.min(cy - EDGE, h - cy - EDGE)
  const horizontal = stacked ? w * 0.62 : w - cx - EDGE
  const room = Math.min(outerLimit, vertical, horizontal)

  const rings: number[] = []
  if (room >= inner) {
    const count = Math.min(MAX_RINGS, 1 + Math.floor((room - inner) / minGap))
    const gap = count > 1 ? Math.min(idealGap, (room - inner) / (count - 1)) : 0
    for (let i = 0; i < count; i++) rings.push(inner + i * gap)
  }
  return { w, h, cx, cy, dialR, rings, stacked }
}

export default function HeroField() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout | null>(null)

  useEffect(() => {
    const host = hostRef.current
    const section = host?.parentElement
    const dial = section?.querySelector<SVGSVGElement>("[data-reserve-dial]")
    if (!host || !section || !dial) return

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setLayout(computeLayout(section.getBoundingClientRect(), dial.getBoundingClientRect()))
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(section)
    observer.observe(dial)
    // The entrance animation moves the dial by a few px; settle after it ends.
    section.addEventListener("animationend", measure)
    document.fonts?.ready.then(measure).catch(() => {})

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      section.removeEventListener("animationend", measure)
    }
  }, [])

  const sideFade = "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)"

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 select-none transition-opacity duration-700"
      style={{
        top: -NAV_ZONE,
        opacity: layout ? 1 : 0,
        WebkitMaskImage: layout?.stacked ? sideFade : undefined,
        maskImage: layout?.stacked ? sideFade : undefined,
      }}
    >
      {layout && (
        <svg width={layout.w} height={layout.h} viewBox={`0 0 ${layout.w} ${layout.h}`} className="block">
          <defs>
            <radialGradient id="hero-field-glow">
              <stop offset="0%" stopColor="var(--neutron)" style={{ stopOpacity: "var(--field-glow)" } as CSSProperties} />
              <stop offset="100%" stopColor="var(--neutron)" stopOpacity={0} />
            </radialGradient>
          </defs>

          <circle cx={layout.cx} cy={layout.cy} r={layout.dialR * 2.8} fill="url(#hero-field-glow)" />

          {layout.rings.map((r) => (
            <circle
              key={`ring-${r}`}
              cx={layout.cx}
              cy={layout.cy}
              r={r}
              fill="none"
              stroke="var(--field-track)"
              strokeWidth={1}
            />
          ))}

          {layout.rings.map((r, i) => {
            const inner = layout.rings[0]
            const duration = Math.round(70 * Math.pow(r / inner, 1.5))
            return (
              <g key={`orbit-${i}`} transform={`rotate(${STARTS[i]} ${layout.cx} ${layout.cy})`}>
                <g
                  className="hero-orbit"
                  style={
                    {
                      transformBox: "view-box",
                      transformOrigin: `${layout.cx}px ${layout.cy}px`,
                      animationDuration: `${duration}s`,
                      animationDirection: i % 2 === 1 ? "reverse" : "normal",
                    } as CSSProperties
                  }
                >
                  <circle
                    cx={layout.cx + r}
                    cy={layout.cy}
                    r={4}
                    fill={i % 2 === 0 ? "var(--neutron)" : "var(--proton)"}
                    stroke="var(--background)"
                    strokeWidth={1.5}
                  />
                </g>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
