"use client"

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react"
import { Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * An explanatory model of a single reactor, not live data.
 * The circle is the reserve. Neutron's claim is fixed in value, so its share of the
 * reserve shrinks as the base asset appreciates; Proton holds whatever is left.
 */

const C = 200 // centre
const R = 150 // reserve radius
const RATIO_AT_START = 1.5 // reserve ratio at the starting price: the protocol's initial reserve ratio (150%)
const CRITICAL_RATIO = 1.2 // illustrative 120%; the contract requires 100% <= critical < 200%
const NORMAL_MAX_RATIO = 2 // reserve ratios at or above 200% are outside the normal operating range
const MIN_CHANGE = -50
const MAX_CHANGE = 50

const circleArea = Math.PI * R * R

function segmentFraction(height: number) {
  const d = R - height
  const area = R * R * Math.acos(d / R) - d * Math.sqrt(Math.max(0, R * R - d * d))
  return area / circleArea
}

function heightForFraction(fraction: number) {
  if (fraction <= 0) return 0
  if (fraction >= 1) return 2 * R
  let lo = 0
  let hi = 2 * R
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (segmentFraction(mid) < fraction) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

const reserveRatio = (change: number) => RATIO_AT_START * (1 + change / 100)
const neutronShare = (change: number) => Math.min(1, 1 / reserveRatio(change))
const autoplayChange = (t: number) => 18 * Math.sin(t * 0.42) + 6 * Math.sin(t * 1.07 + 1)

const criticalY = C + R - heightForFraction(1 / CRITICAL_RATIO)
const criticalHalf = Math.sqrt(R * R - (criticalY - C) ** 2)

const ticks = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2
  const major = i % 6 === 0
  const r1 = R + 12
  const r2 = R + (major ? 22 : 17)
  return {
    x1: C + Math.cos(a) * r1,
    y1: C + Math.sin(a) * r1,
    x2: C + Math.cos(a) * r2,
    y2: C + Math.sin(a) * r2,
    major,
  }
})

const formatChange = (value: number) => {
  const rounded = Math.round(value)
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded)}%`
}

export default function ReserveInstrument({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "")
  const clipId = `reserve-clip-${uid}`
  const hatchId = `proton-hatch-${uid}`

  const svgRef = useRef<SVGSVGElement>(null)
  const neutronRef = useRef<SVGRectElement>(null)
  const protonWashRef = useRef<SVGRectElement>(null)
  const protonHatchRef = useRef<SVGRectElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const markerRef = useRef<SVGCircleElement>(null)
  const changeRef = useRef<HTMLOutputElement>(null)
  const ratioRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const rangeRef = useRef<HTMLSpanElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)

  const [playing, setPlaying] = useState(true)
  const sim = useRef({
    playing: true,
    target: 0,
    shown: 0,
    shownShare: 0,
    clock: 0,
    reduce: false,
    visible: true,
    raf: 0,
    last: 0,
  })

  const render = useCallback(() => {
    const s = sim.current
    const height = heightForFraction(s.shownShare)
    const y = C + R - height
    const half = Math.sqrt(Math.max(0, R * R - (y - C) ** 2))
    neutronRef.current?.setAttribute("y", String(y))
    neutronRef.current?.setAttribute("height", String(C + R - y))
    const protonHeight = String(Math.max(0, y - (C - R)))
    protonWashRef.current?.setAttribute("height", protonHeight)
    protonHatchRef.current?.setAttribute("height", protonHeight)
    if (lineRef.current) {
      lineRef.current.setAttribute("x1", String(C - half))
      lineRef.current.setAttribute("x2", String(C + half))
      lineRef.current.setAttribute("y1", String(y))
      lineRef.current.setAttribute("y2", String(y))
    }
    markerRef.current?.setAttribute("cx", String(C + half))
    markerRef.current?.setAttribute("cy", String(y))

    const ratio = reserveRatio(s.shown)
    const belowCritical = ratio < CRITICAL_RATIO
    const aboveNormal = ratio >= NORMAL_MAX_RATIO
    if (changeRef.current) changeRef.current.textContent = formatChange(s.shown)
    if (ratioRef.current) ratioRef.current.textContent = `${Math.round(ratio * 100)}%`
    if (statusRef.current) statusRef.current.hidden = !belowCritical
    if (rangeRef.current) rangeRef.current.hidden = !aboveNormal
    if (svgRef.current) svgRef.current.dataset.state = belowCritical ? "critical" : "healthy"
    if (s.playing && sliderRef.current) sliderRef.current.value = String(Math.round(s.shown))
  }, [])

  const frame = useCallback(
    (now: number) => {
      const s = sim.current
      const dt = Math.min(0.05, (now - (s.last || now)) / 1000)
      s.last = now

      if (s.playing) {
        s.clock += dt
        s.target = autoplayChange(s.clock)
      }

      const k = s.reduce ? 1 : 1 - Math.exp(-dt * 6)
      s.shown += (s.target - s.shown) * k
      const targetShare = neutronShare(s.shown)
      s.shownShare += (targetShare - s.shownShare) * (s.reduce ? 1 : 1 - Math.exp(-dt * 3.2))
      render()

      const settled =
        Math.abs(s.target - s.shown) < 0.01 && Math.abs(neutronShare(s.shown) - s.shownShare) < 0.0005
      if (s.visible && (s.playing || !settled)) {
        s.raf = requestAnimationFrame(frame)
      } else {
        s.raf = 0
        s.last = 0
      }
    },
    [render],
  )

  const wake = useCallback(() => {
    const s = sim.current
    if (!s.raf && s.visible) s.raf = requestAnimationFrame(frame)
  }, [frame])

  useEffect(() => {
    const s = sim.current
    s.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (s.reduce) {
      s.playing = false
      s.target = 0
      setPlaying(false)
    }

    const svg = svgRef.current
    const observer = new IntersectionObserver(([entry]) => {
      s.visible = entry.isIntersecting && document.visibilityState === "visible"
      if (s.visible) wake()
    })
    if (svg) observer.observe(svg)

    const onVisibility = () => {
      s.visible = document.visibilityState === "visible"
      if (s.visible) wake()
    }
    document.addEventListener("visibilitychange", onVisibility)

    wake()
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [wake])

  const setPlayback = (next: boolean) => {
    sim.current.playing = next
    setPlaying(next)
    wake()
  }

  const onSlide = (value: number) => {
    const s = sim.current
    s.playing = false
    setPlaying(false)
    s.target = value
    wake()
  }

  return (
    <figure className={cn("w-full [--dial:26rem] lg:[--dial:clamp(20rem,46svh,26rem)]", className)}>
      <div className="relative mx-auto max-w-[var(--dial)]">
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        role="img"
        aria-label="Illustration of a reactor's reserve split between a gold Neutron share and a hatched red Proton share"
        className="group/instrument mx-auto block w-full max-w-[var(--dial)] overflow-visible"
        data-state="healthy"
        data-reserve-dial=""
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx={C} cy={C} r={R} />
          </clipPath>
          <pattern id={hatchId} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--proton)" strokeWidth="1.1" style={{ strokeOpacity: "var(--dial-hatch)" }} />
          </pattern>
        </defs>

        <g className="gluon-fade" style={{ "--delay": "500ms" } as CSSProperties}>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="var(--foreground)"
              style={{ strokeOpacity: t.major ? "var(--dial-tick-major)" : "var(--dial-tick)" }}
              strokeWidth={1}
            />
          ))}
        </g>

        <g clipPath={`url(#${clipId})`}>
          <rect x={C - R} y={C - R} width={2 * R} height={2 * R} fill="var(--background)" />
          <rect ref={protonWashRef} x={C - R} y={C - R} width={2 * R} height={2 * R} fill="var(--proton-wash)" />
          <rect ref={protonHatchRef} x={C - R} y={C - R} width={2 * R} height={2 * R} fill={`url(#${hatchId})`} />
          <rect ref={neutronRef} x={C - R} y={C + R} width={2 * R} height={0} fill="var(--neutron-wash)" />
        </g>

        <line
          x1={C - criticalHalf}
          x2={C + criticalHalf}
          y1={criticalY}
          y2={criticalY}
          stroke="var(--foreground)"
          strokeDasharray="3 5"
          strokeWidth={1}
          className="opacity-35 transition-[stroke,opacity] duration-300 group-data-[state=critical]/instrument:stroke-[var(--danger)] group-data-[state=critical]/instrument:opacity-90"
        />

        <line ref={lineRef} x1={C} x2={C} y1={C + R} y2={C + R} stroke="var(--neutron)" strokeWidth={1.75} />

        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity={0.55}
          strokeWidth={1.25}
          pathLength={1}
          className="gluon-draw"
          style={{ "--delay": "150ms" } as CSSProperties}
        />

        <circle ref={markerRef} cx={C} cy={C + R} r={4} fill="var(--background)" stroke="var(--neutron)" strokeWidth={1.75} />
      </svg>
      </div>

      <figcaption className="mx-auto mt-6 max-w-[var(--dial)] lg:mt-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex gap-2.5">
            <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-[3px] border border-neutron bg-neutron-wash" />
            <div>
              <p className="font-medium text-foreground">Neutron</p>
              <p className="text-muted-foreground">Pegged claim on the reserve</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-1 size-3 shrink-0 rounded-[3px] border border-proton/70 bg-[repeating-linear-gradient(135deg,var(--proton)_0_1px,transparent_1px_4px)] opacity-80"
            />
            <div>
              <p className="font-medium text-foreground">Proton</p>
              <p className="text-muted-foreground">Reserve surplus</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/75 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={`price-${uid}`} className="text-sm text-muted-foreground">
              Base asset price
            </label>
            <div className="flex items-center gap-2">
              <output
                ref={changeRef}
                htmlFor={`price-${uid}`}
                className="min-w-[3.5rem] text-right text-sm font-medium tabular-nums text-foreground"
              >
                0%
              </output>
              <button
                type="button"
                onClick={() => setPlayback(!playing)}
                aria-label={playing ? "Pause simulation" : "Play simulation"}
                className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>
            </div>
          </div>
          <input
            ref={sliderRef}
            id={`price-${uid}`}
            type="range"
            min={MIN_CHANGE}
            max={MAX_CHANGE}
            step={1}
            defaultValue={0}
            onChange={(event) => onSlide(Number(event.target.value))}
            className="gluon-range mt-2"
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Reserve ratio</span>
            <span className="flex items-center gap-2">
              <span ref={rangeRef} hidden className="rounded-md bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning">
                Above normal range
              </span>
              <span ref={statusRef} hidden className="rounded-md bg-danger/10 px-1.5 py-0.5 text-xs font-medium text-danger">
                Below critical
              </span>
              <span ref={ratioRef} className="font-medium tabular-nums text-foreground">
                150%
              </span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span aria-hidden="true" className="w-4 border-t border-dashed border-foreground/50" />
              Critical reserve ratio
            </span>
            <span className="tabular-nums text-muted-foreground">{Math.round(CRITICAL_RATIO * 100)}%</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-faint-foreground">Illustrative model of one reactor. Not live data.</p>
      </figcaption>
    </figure>
  )
}
