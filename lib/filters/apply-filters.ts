import {
  DUST_THRESHOLD_USD,
  type FilterCriteria,
} from "@/lib/filters/filter-criteria"
import { type Holding } from "@/lib/portfolio/holding"

/**
 * Applies search + filters to the flat holding list before grouping, so
 * every grouping mode sees the same filtered set and group totals stay
 * consistent with what's actually on screen.
 */
export function applyFilters(
  holdings: Holding[],
  criteria: FilterCriteria
): Holding[] {
  const search = criteria.search.trim().toLowerCase()

  return holdings.filter((holding) => {
    if (search && !matchesSearch(holding, search)) return false
    if (
      criteria.chainIds.length > 0 &&
      !criteria.chainIds.includes(holding.chainId)
    )
      return false
    if (
      criteria.walletAddresses.length > 0 &&
      !criteria.walletAddresses.includes(holding.walletAddress)
    ) {
      return false
    }
    if (criteria.hideDust && holding.usdValue < DUST_THRESHOLD_USD) return false
    if (criteria.hideUnverified && holding.confidence === "none") return false
    return true
  })
}

function matchesSearch(holding: Holding, search: string): boolean {
  return (
    holding.symbol.toLowerCase().includes(search) ||
    holding.name.toLowerCase().includes(search)
  )
}
