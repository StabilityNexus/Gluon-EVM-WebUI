"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import PillNav from "@/components/PillNav"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/explorer", label: "Explorer" },
  { href: "/create", label: "Create" },
]

export default function Navigation() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 100) {
        setIsScrolled(true)
      } else if (currentScrollY < 50) {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <motion.header
      className="fixed z-20 w-full px-2 pointer-events-auto"
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className={cn(
          'hidden md:block mx-auto mt-2 px-6 lg:px-12',
          isScrolled && 'backdrop-blur-[60px]'
        )}
        style={{
          backdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
        }}
        animate={{
          maxWidth: isScrolled ? '64rem' : '90rem',
          backgroundColor: isScrolled
            ? (isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)')
            : 'rgba(0, 0, 0, 0)',
          borderRadius: isScrolled ? '16px' : '0px',
          border: isScrolled
            ? (isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(0, 0, 0, 0.18)')
            : '1px solid rgba(255, 255, 255, 0)',
          boxShadow: isScrolled
            ? (isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)')
            : 'none',
          paddingLeft: isScrolled ? '20px' : '48px',
          paddingRight: isScrolled ? '20px' : '48px',
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 30,
          duration: 0.8
        }}
      >
        <motion.div
          className="relative flex items-center justify-between py-3 lg:py-4"
          animate={{
            paddingTop: isScrolled ? '12px' : '16px',
            paddingBottom: isScrolled ? '12px' : '16px',
          }}
        >
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group z-[1002] flex-shrink-0">
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
            <motion.span
              className="font-bold text-xl text-foreground group-hover:text-primary transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Gluon
            </motion.span>
          </Link>

          {/* Centered PillNav Section - Fixed Alignment */}
          <div className="absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2">
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
          </div>

          {/* Right Actions Section */}
          <div className="flex items-center gap-3 z-[1001] flex-shrink-0">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile View */}
      <div className="md:hidden flex justify-between items-center p-4 bg-background/80 backdrop-blur-md">
         <Link href="/" className="flex items-center gap-2">
            <Image src="/GluonProtocol-Darker.png" alt="Logo" width={40} height={24} />
            <span className="font-bold">Gluon</span>
         </Link>
         <div className="flex gap-2">
            <ThemeToggle />
            <ConnectButton />
         </div>
      </div>
    </motion.header>
  )
}