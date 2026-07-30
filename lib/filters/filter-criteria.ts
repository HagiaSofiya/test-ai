import { type ChainId } from "@/lib/chains"

export const DUST_THRESHOLD_USD = 1

/** Empty chainIds/walletAddresses arrays mean "no restriction" (show all). */
export interface FilterCriteria {
  search: string
  chainIds: ChainId[]
  walletAddresses: string[]
  hideDust: boolean
  hideUnverified: boolean
}

export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  search: "",
  chainIds: [],
  walletAddresses: [],
  hideDust: false,
  hideUnverified: false,
}
