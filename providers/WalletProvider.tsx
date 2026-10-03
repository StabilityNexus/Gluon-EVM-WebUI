'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { config } from '@/utils/config'
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useTheme } from 'next-themes'

const queryClient = new QueryClient()

function RainbowKitThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <RainbowKitProvider
      theme={mounted && resolvedTheme === 'dark' ? darkTheme({
        accentColor: '#F1F1F2',
        accentColorForeground: '#000000',
        borderRadius: 'medium',
        overlayBlur: 'small',
      }) : lightTheme({
        accentColor: '#0E0E10',
        accentColorForeground: '#FFFFFF',
        borderRadius: 'medium',
        overlayBlur: 'small',
      })}
    >
      {children}
    </RainbowKitProvider>
  )
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemeProvider>
          {children}
        </RainbowKitThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
