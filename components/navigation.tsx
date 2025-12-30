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
  const [menuState, setMenuState] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      data-state={menuState && 'active'}
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
          'md:hidden mx-auto mt-2 max-w-full px-4',
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
        <div className="flex items-center justify-between py-3">
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
              onClick={() => setMenuState(!menuState)}
              aria-label={menuState ? 'Close Menu' : 'Open Menu'}
              className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5"
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={{
                  rotate: menuState ? 180 : 0,
                  scale: menuState ? 0 : 1,
                  opacity: menuState ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="m-auto size-6 text-foreground"
              >
                <Menu className="size-6" />
              </motion.div>
              <motion.div
                animate={{
                  rotate: menuState ? 0 : -180,
                  scale: menuState ? 1 : 0,
                  opacity: menuState ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0 m-auto size-6 text-foreground"
              >
                <X className="size-6" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>


      <AnimatePresence>
        {menuState && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="absolute top-6 right-6">
              <motion.button
                onClick={() => setMenuState(false)}
                className="p-2 text-foreground hover:text-primary transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-8 h-8" />
              </motion.button>
            </div>

            <ul className="flex flex-col items-center gap-8 text-2xl font-bold uppercase tracking-widest">
              {navItems.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMenuState(false)}
                    className={cn(
                      "transition-colors relative group",
                      pathname === item.href ? "text-primary" : "text-foreground/70 hover:text-primary"
                    )}
                  >
                    {item.label}
                    <motion.span
                      className={cn(
                        "absolute -bottom-2 left-0 h-1 bg-primary transition-all duration-300",
                        pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                      )}
                      initial={false}
                      animate={{
                        width: pathname === item.href ? "100%" : "0%"
                      }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
