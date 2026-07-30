import { type ChainId } from "@/lib/chains"
import { type GroupHeader, type Grouping } from "@/lib/grouping/grouping"
import { sumDecimalAmounts } from "@/lib/portfolio/aggregate"
import { type Confidence } from "@/lib/portfolio/asset-identity"
import { type Holding } from "@/lib/portfolio/holding"

/**
 * One resolved asset's total within a group. Holdings sharing an assetId
 * are always merged into a single row here, regardless of which
 * dimension (token/network/wallet) the enclosing group was bucketed by —
 * that's what makes "USDC on chain A and chain B" read as one line
 * instead of two, no matter how the view is grouped.
 */
export interface GroupRow {
  assetId: string
  symbol: string
  name: string
  confidence: Confidence
  amount: string
  usdValue: number
  chainIds: ChainId[]
  walletAddresses: string[]
}

export interface Group {
  key: string
  header: GroupHeader
  rows: GroupRow[]
  totalUsd: number
}

export function groupHoldings(
  holdings: Holding[],
  grouping: Grouping
): Group[] {
  const buckets = new Map<string, Holding[]>()
  for (const holding of holdings) {
    const key = grouping.keyOf(holding)
    const bucket = buckets.get(key)
    if (bucket) bucket.push(holding)
    else buckets.set(key, [holding])
  }

  const groups = Array.from(buckets.entries()).map(([key, bucketHoldings]) => {
    const rows = mergeByAsset(bucketHoldings)
    const totalUsd = rows.reduce((sum, row) => sum + row.usdValue, 0)
    return { key, header: grouping.headerOf(bucketHoldings[0]), rows, totalUsd }
  })

  return groups.sort((a, b) => b.totalUsd - a.totalUsd)
}

function mergeByAsset(holdings: Holding[]): GroupRow[] {
  const byAsset = new Map<string, Holding[]>()
  for (const holding of holdings) {
    const bucket = byAsset.get(holding.assetId)
    if (bucket) bucket.push(holding)
    else byAsset.set(holding.assetId, [holding])
  }

  return Array.from(byAsset.values())
    .map((assetHoldings) => {
      const [first] = assetHoldings
      return {
        assetId: first.assetId,
        symbol: first.symbol,
        name: first.name,
        confidence: weakestConfidence(assetHoldings),
        amount: sumDecimalAmounts(assetHoldings.map((h) => h.amount)),
        usdValue: assetHoldings.reduce((sum, h) => sum + h.usdValue, 0),
        chainIds: Array.from(new Set(assetHoldings.map((h) => h.chainId))),
        walletAddresses: Array.from(
          new Set(assetHoldings.map((h) => h.walletAddress))
        ),
      }
    })
    .sort((a, b) => b.usdValue - a.usdValue)
}

const CONFIDENCE_RANK: Record<Confidence, number> = {
  verified: 3,
  provider: 2,
  inferred: 1,
  none: 0,
}

/** A merged row is only as trustworthy as its least-certain contributing holding. */
function weakestConfidence(holdings: Holding[]): Confidence {
  return holdings.reduce(
    (weakest, h) =>
      CONFIDENCE_RANK[h.confidence] < CONFIDENCE_RANK[weakest]
        ? h.confidence
        : weakest,
    holdings[0].confidence
  )
}
