"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useConnection } from "wagmi"

import { GroupedList } from "@/components/portfolio/grouped-list"
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary"
import { PortfolioToolbar } from "@/components/portfolio/portfolio-toolbar"
import { WalletManager } from "@/components/portfolio/wallet-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortfolioData } from "@/hooks/use-portfolio-data"
import { type ChainId } from "@/lib/chains"
import { applyFilters } from "@/lib/filters/apply-filters"
import { type FilterCriteria } from "@/lib/filters/filter-criteria"
import { groupHoldings } from "@/lib/grouping/group-holdings"
import { type GroupingMode } from "@/lib/grouping/grouping"
import { GROUPINGS } from "@/lib/grouping/groupings"
import { PRESET_WALLETS } from "@/lib/portfolio/fixtures/balances"
import { mergeTrackedWallets } from "@/lib/portfolio/tracked-wallet"
import {
  parseViewParams,
  serializeViewParams,
  type ViewParams,
} from "@/lib/view-params"

/**
 * Client orchestrator: reads/writes the URL as the single source of view
 * state (grouping, filters, watch-only wallets), merges in the live
 * wagmi connection, fetches balances for the combined tracked set, and
 * runs them through resolve -> filter -> group before handing the
 * result to GroupedList.
 */
export function PortfolioView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { address: connectedAddress, isConnected } = useConnection()

  const viewParams = React.useMemo(
    () => parseViewParams(searchParams),
    [searchParams]
  )

  const updateViewParams = React.useCallback(
    (next: ViewParams) => {
      const qs = serializeViewParams(next).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname]
  )

  const onGroupingChange = React.useCallback(
    (grouping: GroupingMode) => updateViewParams({ ...viewParams, grouping }),
    [updateViewParams, viewParams]
  )

  const onCriteriaChange = React.useCallback(
    (criteria: FilterCriteria) => updateViewParams({ ...viewParams, criteria }),
    [updateViewParams, viewParams]
  )

  const onWatchWalletsChange = React.useCallback(
    (watchWallets: string[]) =>
      updateViewParams({ ...viewParams, watchWallets }),
    [updateViewParams, viewParams]
  )

  const watchWallets = viewParams.watchWallets
  const trackedWallets = React.useMemo(
    () =>
      mergeTrackedWallets(
        isConnected ? connectedAddress : undefined,
        watchWallets
      ),
    [isConnected, connectedAddress, watchWallets]
  )
  const trackedAddresses = React.useMemo(
    () => trackedWallets.map((w) => w.address),
    [trackedWallets]
  )

  const { holdings, isMock, isLoading, error } =
    usePortfolioData(trackedAddresses)

  const filtered = React.useMemo(
    () => applyFilters(holdings, viewParams.criteria),
    [holdings, viewParams.criteria]
  )

  const groups = React.useMemo(
    () => groupHoldings(filtered, GROUPINGS[viewParams.grouping]),
    [filtered, viewParams.grouping]
  )

  const totalUsd = React.useMemo(
    () => filtered.reduce((sum, h) => sum + h.usdValue, 0),
    [filtered]
  )

  const availableChainIds = React.useMemo(() => {
    const ids = new Set<ChainId>(holdings.map((h) => h.chainId))
    return Array.from(ids).sort((a, b) => a - b)
  }, [holdings])

  const trackedWalletOptions = React.useMemo(
    () =>
      trackedWallets.map(({ address }) => ({
        address,
        label: PRESET_WALLETS.find((p) => p.address === address)?.label ?? "",
      })),
    [trackedWallets]
  )

  return (
    <div className="flex flex-col gap-6">
      <WalletManager
        watchWallets={watchWallets}
        onWatchWalletsChange={onWatchWalletsChange}
      />

      {trackedAddresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Connect or add a wallet above to see its portfolio.
        </p>
      ) : (
        <>
          <PortfolioSummary totalUsd={totalUsd} isMock={isMock} />

          <PortfolioToolbar
            grouping={viewParams.grouping}
            onGroupingChange={onGroupingChange}
            criteria={viewParams.criteria}
            onCriteriaChange={onCriteriaChange}
            availableChainIds={availableChainIds}
            trackedWallets={trackedWalletOptions}
          />

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <GroupedList groups={groups} />
          )}
        </>
      )}
    </div>
  )
}
