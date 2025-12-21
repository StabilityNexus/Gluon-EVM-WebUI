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
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <RainbowKitProvider
      theme={mounted && theme === 'dark' ? darkTheme({
        accentColor: '#ffffff',
        accentColorForeground: 'black',
        borderRadius: 'medium',
        overlayBlur: 'small',
      }) : lightTheme({
        accentColor: '#000000',
        accentColorForeground: 'white',
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
