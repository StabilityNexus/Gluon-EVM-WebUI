"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import PillNav from "@/components/PillNav"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/explorer", label: "Explorer" },
  { href: "/create", label: "Create" },
]

export default function Navigation() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark'

  return (
    <div className="relative w-full">
      {/* Mobile Header - fixed position with logo left, controls right */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 w-full">
        {/* Logo on left */}
        <Link href="/" className="flex items-center gap-2 group z-[1002]">
          <div className="relative h-7 w-12">
            <Image
              src="/GluonProtocol-Darker.png"
              alt="Gluon logo"
              fill
              sizes="96px"
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            Gluon
          </span>
        </Link>

        {/* Mobile controls on right */}
        <div className="flex items-center gap-2 z-[1001]">
          <ThemeToggle />
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
              const connected = mounted && account && chain;
              return (
                <button
                  onClick={connected ? openAccountModal : openConnectModal}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  {connected ? `${account.displayName}` : 'Connect'}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>

      {/* Mobile PillNav (hamburger menu only) */}
      <div className="md:hidden flex justify-center -mt-2">
        <PillNav
          items={navItems}
          activeHref={pathname}
          className="custom-nav"
          ease="power2.easeOut"
          baseColor="transparent"
          pillColor={isDark ? "#ffffff" : "#000000"}
          hoveredPillTextColor={isDark ? "#000000" : "#ffffff"}
          pillTextColor={isDark ? "#000000" : "#ffffff"}
          initialLoadAnimation={false}
        />
      </div>

      {/* Desktop Layout */}
      {/* StableCoin Logo/Heading on the left - desktop only */}
      <div className="hidden md:block absolute top-[1em] left-4 z-[1002]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-14">
            <Image
              src="/GluonProtocol-Darker.png"
              alt="Gluon logo"
              fill
              sizes="112px"
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
            Gluon
          </span>
        </Link>
      </div>

      {/* Centered PillNav Component - desktop only */}
      <div className="hidden md:flex justify-center">
        <PillNav
          items={navItems}
          activeHref={pathname}
          className="custom-nav"
          ease="power2.easeOut"
          baseColor="transparent"
          pillColor={isDark ? "#ffffff" : "#000000"}
          hoveredPillTextColor={isDark ? "#000000" : "#ffffff"}
          pillTextColor={isDark ? "#000000" : "#ffffff"}
          initialLoadAnimation={true}
        />
      </div>

      {/* Additional controls positioned on the right - desktop only */}
      <div className="hidden md:flex absolute top-[1em] right-4 items-center gap-3 z-[1001]">
        <ThemeToggle />
        <ConnectButton />
      </div>
    </div>
  )
}
