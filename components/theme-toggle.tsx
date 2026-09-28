"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const toggle = () => {
    const next = isDark ? "light" : "dark"

    // Apply the class synchronously so the view transition captures the final state,
    // then let next-themes persist the choice.
    const apply = () => {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(next)
      root.style.colorScheme = next
      setTheme(next)
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const doc = document as ViewTransitionDocument

    if (!reduceMotion && typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply)
    } else {
      apply()
    }
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
        className="absolute size-[18px] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:-rotate-45 dark:scale-50 dark:opacity-0"
      />
      <Moon
        aria-hidden="true"
        className="absolute size-[18px] rotate-45 scale-50 opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
    </button>
  )
}
