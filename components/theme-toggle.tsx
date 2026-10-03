"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type ViewTransition = { ready: Promise<void>; finished: Promise<void> }
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransition
}

const REVEAL_MS = 720
const REVEAL_EASE = "cubic-bezier(0.65, 0, 0.35, 1)"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const busy = React.useRef(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (busy.current) return
    const next = isDark ? "light" : "dark"
    const root = document.documentElement

    // Apply synchronously so the transition snapshots the final state.
    const apply = () => {
      root.classList.remove("light", "dark")
      root.classList.add(next)
      root.style.colorScheme = next
      flushSync(() => setTheme(next))
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const doc = document as ViewTransitionDocument

    if (reduceMotion) {
      apply()
      return
    }

    if (typeof doc.startViewTransition !== "function") {
      root.classList.add("theme-fading")
      apply()
      window.setTimeout(() => root.classList.remove("theme-fading"), 520)
      return
    }

    // Reveal the new theme as a circle growing from the toggle.
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    busy.current = true
    const transition = doc.startViewTransition(apply)
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: REVEAL_MS, easing: REVEAL_EASE, pseudoElement: "::view-transition-new(root)" },
        )
      })
      .catch(() => {})
    transition.finished.finally(() => {
      busy.current = false
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-9 text-muted-foreground hover:text-foreground", className)}
    >
      <Sun
        aria-hidden="true"
        className="absolute size-[18px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:-rotate-90 dark:scale-50 dark:opacity-0"
      />
      <Moon
        aria-hidden="true"
        className="absolute size-[18px] rotate-90 scale-50 opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
    </button>
  )
}
