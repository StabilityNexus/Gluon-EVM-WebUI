"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import PillNav from "@/components/PillNav"
//import HamburgerMenu from "@/components/HamburgerMenu"
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
    <div className="flex justify-center relative w-full">
      {/* StableCoin Logo/Heading on the left */}
      <div className="absolute top-[1em] left-4 z-1002">
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

      {/* Centered PillNav Component - Desktop only */}
      <PillNav
        items={navItems}
        activeHref={pathname}
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="transparent"
        pillColor={isDark ? "#ffffff" : "#000000"}
        hoveredPillTextColor={isDark ? "#000000" : "#1a1a1a"}
        pillTextColor={isDark ? "#000000" : "#ffffff"}
        initialLoadAnimation={true}
      />
      
      {/* Additional controls positioned on the right */}
      <div className="absolute top-[1em] right-4 flex items-center gap-3 z-1001">
        <ThemeToggle />
        {/* <HamburgerMenu 
          items={navItems}
          ease="power2.easeOut"
          baseColor={isDark ? "#ffffff" : "#000000"}
          pillColor={isDark ? "#000000" : "#ffffff"}
          hoveredPillTextColor={isDark ? "#ffffff" : "#000000"}
          pillTextColor={isDark ? "#000000" : "#ffffff"}
        /> */}
        <ConnectButton />
      </div>
    </div>
  )
}
