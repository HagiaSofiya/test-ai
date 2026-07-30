"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { type ChainId, CHAINS } from "@/lib/chains"
import { type FilterCriteria } from "@/lib/filters/filter-criteria"
import { shortenAddress } from "@/lib/format"
import { type GroupingMode } from "@/lib/grouping/grouping"
import { GROUPINGS } from "@/lib/grouping/groupings"

interface TrackedWalletOption {
  address: string
  label: string
}

interface PortfolioToolbarProps {
  grouping: GroupingMode
  onGroupingChange: (mode: GroupingMode) => void
  criteria: FilterCriteria
  onCriteriaChange: (criteria: FilterCriteria) => void
  availableChainIds: ChainId[]
  trackedWallets: TrackedWalletOption[]
}

export function PortfolioToolbar({
  grouping,
  onGroupingChange,
  criteria,
  onCriteriaChange,
  availableChainIds,
  trackedWallets,
}: PortfolioToolbarProps) {
  const [searchInput, setSearchInput] = React.useState(criteria.search)
  // Tracks the last criteria.search we synced from, so an external URL
  // change (e.g. browser back/forward) can be reflected into the local
  // input during render, without an effect.
  const [syncedSearch, setSyncedSearch] = React.useState(criteria.search)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  if (criteria.search !== syncedSearch) {
    setSyncedSearch(criteria.search)
    setSearchInput(criteria.search)
  }

  React.useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  function handleSearchInput(value: string) {
    setSearchInput(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onCriteriaChange({ ...criteria, search: value })
    }, 200)
  }

  function toggleChain(chainId: ChainId, pressed: boolean) {
    const chainIds = pressed
      ? [...criteria.chainIds, chainId]
      : criteria.chainIds.filter((id) => id !== chainId)
    onCriteriaChange({ ...criteria, chainIds })
  }

  function toggleWallet(address: string, pressed: boolean) {
    const walletAddresses = pressed
      ? [...criteria.walletAddresses, address]
      : criteria.walletAddresses.filter((a) => a !== address)
    onCriteriaChange({ ...criteria, walletAddresses })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={grouping}
          onValueChange={(value) => onGroupingChange(value as GroupingMode)}
        >
          <TabsList>
            {Object.values(GROUPINGS).map((g) => (
              <TabsTrigger key={g.id} value={g.id}>
                {g.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search by name or symbol…"
          className="max-w-xs"
        />
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-4">
        {availableChainIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {availableChainIds.map((chainId) => (
              <Toggle
                key={chainId}
                size="sm"
                variant="outline"
                pressed={criteria.chainIds.includes(chainId)}
                onPressedChange={(pressed) => toggleChain(chainId, pressed)}
              >
                {CHAINS[chainId].name}
              </Toggle>
            ))}
          </div>
        ) : null}

        {trackedWallets.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {trackedWallets.map((wallet) => (
              <Toggle
                key={wallet.address}
                size="sm"
                variant="outline"
                pressed={criteria.walletAddresses.includes(wallet.address)}
                onPressedChange={(pressed) =>
                  toggleWallet(wallet.address, pressed)
                }
              >
                {wallet.label || shortenAddress(wallet.address)}
              </Toggle>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Switch
            id="hide-dust"
            size="sm"
            checked={criteria.hideDust}
            onCheckedChange={(hideDust) =>
              onCriteriaChange({ ...criteria, hideDust })
            }
          />
          <label htmlFor="hide-dust" className="text-sm text-muted-foreground">
            Hide dust (&lt;$1)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="hide-unverified"
            size="sm"
            checked={criteria.hideUnverified}
            onCheckedChange={(hideUnverified) =>
              onCriteriaChange({ ...criteria, hideUnverified })
            }
          />
          <label
            htmlFor="hide-unverified"
            className="text-sm text-muted-foreground"
          >
            Hide unverified
          </label>
        </div>
      </div>
    </div>
  )
}
