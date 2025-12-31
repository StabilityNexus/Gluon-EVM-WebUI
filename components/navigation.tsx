"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { FlowButton } from "@/components/ui/flow-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/explorer", label: "Explorer" },
  { href: "/create", label: "Create" },
]

export default function Navigation() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 16 })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update menu position when menu opens or on scroll
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef && mobileMenuOpen) {
        const rect = buttonRef.getBoundingClientRect()
        setMenuPosition({
          top: rect.bottom + 8,
          right: 16
        })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, { passive: true })
    return () => {
      window.removeEventListener('scroll', updatePosition)
    }
  }, [buttonRef, mobileMenuOpen])

  // Close menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef && !buttonRef.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [mobileMenuOpen, buttonRef])

  const [isScrolled, setIsScrolled] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // this is for smoothness (removes jitter)
      if (currentScrollY > 100) {
        setIsScrolled(true)
      } else if (currentScrollY < 50) {
        setIsScrolled(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])


  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark'

  return (
    <motion.header
      data-state={mobileMenuOpen ? 'active' : undefined}
      className="fixed z-20 w-full px-2 pointer-events-auto"
      initial={{ y: 0, opacity: 1 }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >

      <motion.div
        className={cn(
          'hidden md:block mx-auto mt-2 max-w-6xl px-6 lg:px-12',
          isScrolled && 'backdrop-blur-[60px]'
        )}
        style={{
          backdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
        }}
        animate={{
          backgroundColor: isScrolled 
            ? (isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)')
            : 'rgba(0, 0, 0, 0)',
          maxWidth: isScrolled ? '64rem' : '72rem',
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
          className="relative flex items-center gap-6 py-3 lg:py-4"
          animate={{
            paddingTop: isScrolled ? '12px' : '16px',
            paddingBottom: isScrolled ? '12px' : '16px',
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 30,
            duration: 0.8
          }}
        >

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
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Gluon
            </motion.span>
          </Link>

         
          <div className="flex-1 flex justify-center">
            <AnimatePresence>
              {!isScrolled && (
                <motion.nav
                  key="centered-nav"
                  initial={{ opacity: 0, scale: 0.97, y: -2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -2 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                    mass: 0.6
                  }}
                  className="flex items-center gap-6"
                >
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <FlowButton text={item.label} />
                    </Link>
                  ))}
                </motion.nav>
              )}
            </AnimatePresence>
          </div>

         
          <div className="flex items-center gap-3 z-[1001] flex-shrink-0">
            <AnimatePresence>
              {isScrolled && (
                <motion.div
                  key="dropdown-nav"
                  initial={{ opacity: 0, x: 15, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 15, scale: 0.97 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                    mass: 0.6
                  }}
                >
                  <DropdownMenu 
                    open={isDropdownOpen} 
                    onOpenChange={setIsDropdownOpen}
                    modal={false}
                  >
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-accent"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onMouseEnter={() => setIsDropdownOpen(true)}
                        onMouseLeave={() => setIsDropdownOpen(false)}
                      >
                        <span>Quick Links</span>
                        <ChevronDown className="h-4 w-4" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="min-w-[150px]"
                      onMouseEnter={() => setIsDropdownOpen(true)}
                      onMouseLeave={() => setIsDropdownOpen(false)}
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      {navItems.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "cursor-pointer",
                              pathname === item.href && "bg-accent text-accent-foreground"
                            )}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>
            
            <ThemeToggle />
            <ConnectButton />
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        className={cn(
          'md:hidden mx-auto mt-2 max-w-full px-4 relative',
          isScrolled && 'backdrop-blur-[60px]'
        )}
        style={{
          backdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
        }}
        animate={{
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
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 30,
          duration: 0.8
        }}
      >
        <div className="flex items-center justify-between py-3 relative z-50">
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
            <motion.span 
              className="font-bold text-lg text-foreground group-hover:text-primary transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Gluon
            </motion.span>
          </Link>

          <div className="flex items-center gap-2 z-[1001]">
            <ThemeToggle />
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                const connected = mounted && account && chain;
                return (
                  <motion.button
                    onClick={connected ? openAccountModal : openConnectModal}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {connected ? `${account.displayName}` : 'Connect'}
                  </motion.button>
                );
              }}
            </ConnectButton.Custom>

            <motion.button
              ref={setButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5"
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={{
                  rotate: mobileMenuOpen ? 180 : 0,
                  scale: mobileMenuOpen ? 0 : 1,
                  opacity: mobileMenuOpen ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="m-auto size-6 text-foreground"
              >
                <Menu className="size-6" />
              </motion.div>
              <motion.div
                animate={{
                  rotate: mobileMenuOpen ? 0 : -180,
                  scale: mobileMenuOpen ? 1 : 0,
                  opacity: mobileMenuOpen ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0 m-auto size-6 text-foreground"
              >
                <X className="size-6" />
              </motion.div>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && buttonRef && (
            <motion.div
              className="fixed z-50 w-48 bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-lg md:hidden overflow-hidden pointer-events-auto"
              style={{
                top: menuPosition.top + 'px',
                right: menuPosition.right + 'px'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
            <ul className="flex flex-col gap-0 px-0 py-2">
              {navItems.map((item) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-2 text-sm font-medium transition-colors",
                      pathname === item.href ? "text-primary bg-accent/20" : "text-foreground/70 hover:text-primary hover:bg-accent/10"
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>
    </motion.header>
  )
}

