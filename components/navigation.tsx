"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletButton } from "@/components/WalletButton"

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

export default function Navigation() {
  const pathname = usePathname() ?? "/"
  const active = resolveActive(pathname)
  const reduceMotion = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
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

  const elevated = scrolled || open
  const indicatorTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 520, damping: 42, mass: 0.7 }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        data-elevated={elevated ? "" : undefined}
        className="border-b border-transparent transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[elevated]:border-border data-[elevated]:bg-background/80 data-[elevated]:backdrop-blur-xl data-[elevated]:backdrop-saturate-150"
      >
        <div className="container-page relative flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="Gluon home"
            className="-ml-1 flex items-center gap-2 rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="relative h-8 w-14">
              <Image
                src="/GluonProtocol-Darker.png"
                alt=""
                fill
                sizes="112px"
                className="object-contain"
                priority
              />
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">Gluon</span>
          </Link>

          <nav
            aria-label="Primary"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <ul className="flex items-center gap-0.5 rounded-full border border-border bg-surface-1/80 p-1">
              {navItems.map((item) => {
                const isActive = item.href === active
                return (
                  <li key={item.href} className="relative">
                    {isActive && (
                      <motion.span
                        layoutId="primary-nav-indicator"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full border border-border bg-background shadow-[var(--shadow-sm)] dark:bg-surface-3"
                        transition={indicatorTransition}
                      />
                    )}
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative z-10 inline-flex h-8 items-center rounded-full px-4 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
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

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
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
              <Menu
                aria-hidden="true"
                className={cn("absolute size-5 transition-[transform,opacity] duration-200", open && "rotate-90 scale-75 opacity-0")}
              />
              <X
                aria-hidden="true"
                className={cn("absolute size-5 transition-[transform,opacity] duration-200", !open && "-rotate-90 scale-75 opacity-0")}
              />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="mobile-scrim"
              aria-hidden="true"
              className="fixed inset-x-0 bottom-0 top-16 -z-10 bg-background/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              key="mobile-navigation"
              id="mobile-navigation"
              aria-label="Primary"
              className="border-b border-border bg-background/95 backdrop-blur-xl md:hidden"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <ul className="container-page flex flex-col gap-0.5 py-3">
                {navItems.map((item) => {
                  const isActive = item.href === active
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex h-12 items-center rounded-lg px-3 text-[15px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                          isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="container-page pb-4 empty:hidden">
                <WalletButton mode="network" />
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
