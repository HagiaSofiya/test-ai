import { type Holding } from "@/lib/portfolio/holding"

export type GroupingMode = "token" | "network" | "wallet"

export interface GroupHeader {
  label: string
  sublabel?: string
}

/**
 * Describes one way to bucket holdings. Switching the active grouping in
 * the UI is just swapping which Grouping is passed to groupHoldings —
 * see lib/grouping/groupings.ts for the registry and
 * lib/grouping/group-holdings.ts for the bucketing itself.
 */
export interface Grouping {
  id: GroupingMode
  label: string
  keyOf: (holding: Holding) => string
  headerOf: (holding: Holding) => GroupHeader
}
