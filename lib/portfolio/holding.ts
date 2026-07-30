import { type ChainId } from "@/lib/chains"
import { type AssetIdentity } from "@/lib/portfolio/asset-identity"

/**
 * A single resolved, decimal-normalized balance — one per RawBalance,
 * not yet merged with any other. Produced by aggregate.ts; grouping and
 * cross-chain summing happen downstream in lib/grouping.
 */
export interface Holding extends AssetIdentity {
  chainId: ChainId
  walletAddress: string
  tokenAddress: string
  /** Decimal-unit amount as a string (e.g. "123.456789"), never a float. */
  amount: string
  usdValue: number
}
