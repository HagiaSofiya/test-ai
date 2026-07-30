"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { type State, WagmiProvider } from "wagmi"

import { getWagmiConfig } from "@/lib/wagmi-config"

interface ProvidersProps {
  children: React.ReactNode
  initialState: State | undefined
}

export function Providers({ children, initialState }: ProvidersProps) {
  const [config] = React.useState(getWagmiConfig)
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
