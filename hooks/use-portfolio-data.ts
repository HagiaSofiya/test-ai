"use client"

import * as React from "react"

import { resolveHoldings } from "@/lib/portfolio/aggregate"
import { type Holding } from "@/lib/portfolio/holding"
import { type RawBalance } from "@/lib/portfolio/raw-balance"

export interface PortfolioDataState {
  holdings: Holding[]
  isMock: boolean
  isLoading: boolean
  error: string | null
}

const EMPTY_STATE: PortfolioDataState = {
  holdings: [],
  isMock: true,
  isLoading: false,
  error: null,
}

interface FetchedData {
  holdings: Holding[]
  isMock: boolean
  error: string | null
}

const EMPTY_FETCHED: FetchedData = { holdings: [], isMock: true, error: null }

/**
 * Fetches balances for the given wallets from /api/portfolio and resolves
 * them into Holdings. Keyed off the joined address list rather than array
 * identity, so a re-render with the same wallets doesn't refetch.
 *
 * isLoading is derived by comparing walletsKey against the key the last
 * fetch completed for, rather than toggled imperatively — that keeps the
 * effect itself free of any setState call outside its async callbacks.
 */
export function usePortfolioData(
  walletAddresses: string[]
): PortfolioDataState {
  const walletsKey = walletAddresses.join(",")
  const [data, setData] = React.useState<FetchedData>(EMPTY_FETCHED)
  const [loadedKey, setLoadedKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!walletsKey) return

    let cancelled = false

    fetch(`/api/portfolio?wallets=${encodeURIComponent(walletsKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<{
          balances: RawBalance[]
          isMock: boolean
        }>
      })
      .then((json) => {
        if (cancelled) return
        setData({
          holdings: resolveHoldings(json.balances),
          isMock: json.isMock,
          error: null,
        })
        setLoadedKey(walletsKey)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setData({
          holdings: [],
          isMock: true,
          error:
            err instanceof Error ? err.message : "Failed to load portfolio",
        })
        setLoadedKey(walletsKey)
      })

    return () => {
      cancelled = true
    }
  }, [walletsKey])

  if (!walletsKey) return EMPTY_STATE

  return { ...data, isLoading: loadedKey !== walletsKey }
}
