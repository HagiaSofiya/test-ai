import { type ChainId, isSupportedChain } from "@/lib/chains"
import {
  DEFAULT_FILTER_CRITERIA,
  type FilterCriteria,
} from "@/lib/filters/filter-criteria"
import { type GroupingMode } from "@/lib/grouping/grouping"

/**
 * The single source of truth for the URL's shape. Every field the view
 * needs — grouping mode, search/filter criteria, and tracked watch-only
 * wallets — round-trips through here, so the whole portfolio state is
 * shareable as one link. Parsing never throws: a malformed or hand-edited
 * URL falls back to defaults field-by-field instead of crashing the page.
 *
 * ?group=network&q=usdc&chains=1,8453&walletFilter=0xabc&hideDust=1&watch=0xdef
 */
export interface ViewParams {
  grouping: GroupingMode
  criteria: FilterCriteria
  watchWallets: string[]
}

const GROUPING_MODES: GroupingMode[] = ["token", "network", "wallet"]
const ADDRESS_PATTERN = /^0x[a-f0-9]{40}$/

export const DEFAULT_VIEW_PARAMS: ViewParams = {
  grouping: "token",
  criteria: DEFAULT_FILTER_CRITERIA,
  watchWallets: [],
}

export function parseViewParams(searchParams: URLSearchParams): ViewParams {
  const group = searchParams.get("group")
  const grouping = isGroupingMode(group) ? group : DEFAULT_VIEW_PARAMS.grouping

  return {
    grouping,
    criteria: {
      search: searchParams.get("q") ?? "",
      chainIds: parseChainIds(searchParams.get("chains")),
      walletAddresses: parseAddresses(searchParams.get("walletFilter")),
      hideDust: searchParams.get("hideDust") === "1",
      hideUnverified: searchParams.get("hideUnverified") === "1",
    },
    watchWallets: parseAddresses(searchParams.get("watch")),
  }
}

export function serializeViewParams(params: ViewParams): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (params.grouping !== DEFAULT_VIEW_PARAMS.grouping)
    searchParams.set("group", params.grouping)
  if (params.criteria.search) searchParams.set("q", params.criteria.search)
  if (params.criteria.chainIds.length > 0) {
    searchParams.set("chains", params.criteria.chainIds.join(","))
  }
  if (params.criteria.walletAddresses.length > 0) {
    searchParams.set("walletFilter", params.criteria.walletAddresses.join(","))
  }
  if (params.criteria.hideDust) searchParams.set("hideDust", "1")
  if (params.criteria.hideUnverified) searchParams.set("hideUnverified", "1")
  if (params.watchWallets.length > 0)
    searchParams.set("watch", params.watchWallets.join(","))
  return searchParams
}

function isGroupingMode(value: string | null): value is GroupingMode {
  return GROUPING_MODES.includes(value as GroupingMode)
}

function parseChainIds(raw: string | null): ChainId[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(isSupportedChain)
}

function parseAddresses(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ADDRESS_PATTERN.test(s))
}
