"use client"

import { useEffect, useRef, useState, type MouseEvent, type FocusEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletButton } from "@/components/WalletButton"
import gluonLogo from "@/public/GluonProtocol-Darker.png"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/explorer", label: "Explorer" },
  { href: "/create", label: "Create" },
] as const

// Reactor pages (/c?coin=… and /0x…) belong to the Explorer section.
function resolveActive(pathname: string): string | null {
  if (pathname === "/") return "/"
  if (pathname.startsWith("/create")) return "/create"
  if (pathname.startsWith("/explorer") || /^\/(c|0x[0-9a-fA-F]+)\/?$/.test(pathname)) return "/explorer"
  return null
}

const EASE = [0.22, 1, 0.36, 1] as const

export default function Navigation() {
  const pathname = usePathname() ?? "/"
  const active = resolveActive(pathname)
  const reduceMotion = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<{ left: number; width: number; instant: boolean } | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled((prev) => (prev ? window.scrollY > 8 : window.scrollY > 32))
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  // Hover/focus highlight that glides between items instead of re-mounting.
  const trackHover = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const list = listRef.current
    if (!list) return
    const a = event.currentTarget.getBoundingClientRect()
    const b = list.getBoundingClientRect()
    // Appear in place when entering the list; glide only between items.
    setHover((prev) => ({ left: a.left - b.left, width: a.width, instant: prev === null }))
  }

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 520, damping: 44, mass: 0.7 }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="px-3 pt-3 sm:px-4">
        <div
          data-elevated={scrolled || open ? "" : undefined}
          className="nav-frost pointer-events-auto relative mx-auto w-full rounded-2xl"
        >
          <div className="relative flex h-14 items-center justify-between gap-3 pl-3 pr-2 sm:pl-5 sm:pr-3">
            <Link
              href="/"
              aria-label="Gluon home"
              className="flex items-center gap-2 rounded-lg py-1 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="relative h-7 w-12">
                <Image src={gluonLogo} alt="Gluon logo" fill sizes="112px" className="object-contain" priority />
              </span>
              <span className="hidden text-[17px] font-semibold tracking-[-0.02em] text-foreground min-[380px]:inline">Gluon</span>
            </Link>

            {/* Desktop: raised pill marks the current route, a flat tint follows the pointer */}
            <nav aria-label="Primary" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
              <ul ref={listRef} className="relative flex items-center gap-1" onMouseLeave={() => setHover(null)}>
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 rounded-lg bg-foreground/[0.06]"
                  initial={false}
                  animate={hover ? { x: hover.left, width: hover.width, opacity: 1 } : { opacity: 0 }}
                  transition={
                    reduceMotion || hover?.instant
                      ? { x: { duration: 0 }, width: { duration: 0 }, opacity: { duration: 0.15 } }
                      : { ...spring, opacity: { duration: 0.15 } }
                  }
                />
                {navItems.map((item) => {
                  const isActive = item.href === active
                  return (
                    <li key={item.href} className="relative">
                      {isActive && (
                        <motion.span
                          layoutId="primary-nav-active"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-lg border border-border bg-background shadow-[var(--shadow-sm)] dark:border-white/[0.06] dark:bg-white/[0.08] dark:shadow-none"
                          transition={spring}
                        />
                      )}
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onMouseEnter={trackHover}
                        onFocus={trackHover}
                        onBlur={() => setHover(null)}
                        className={cn(
                          "relative z-10 inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-border md:block" />
              <WalletButton mode="full" className="hidden md:flex" />
              <WalletButton mode="compact" className="md:hidden" />
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="mobile-navigation"
                aria-label={open ? "Close menu" : "Open menu"}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-9 md:hidden")}
              >
                <Menu aria-hidden="true" className={cn("absolute size-5 transition-[transform,opacity] duration-200", open && "rotate-90 scale-75 opacity-0")} />
                <X aria-hidden="true" className={cn("absolute size-5 transition-[transform,opacity] duration-200", !open && "-rotate-90 scale-75 opacity-0")} />
              </button>
            </div>
          </div>

          {/* Mobile: the same bar expands to hold the menu, so it never detaches from its origin */}
          <AnimatePresence initial={false}>
            {open && (
              <motion.nav
                key="mobile-navigation"
                id="mobile-navigation"
                aria-label="Primary"
                className="overflow-hidden md:hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
              >
                <div className="border-t border-border px-2 pb-2 pt-2">
                  <ul className="flex flex-col gap-0.5">
                    {navItems.map((item) => {
                      const isActive = item.href === active
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex h-11 items-center rounded-lg px-3 text-[15px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                              isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-2 empty:hidden">
                    <WalletButton mode="network" />
                  </div>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-scrim"
            aria-hidden="true"
            className="pointer-events-auto fixed inset-0 -z-10 bg-background/40 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </header>
  )
}
