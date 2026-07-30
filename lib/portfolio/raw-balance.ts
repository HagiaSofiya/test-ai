import { type ChainId } from "@/lib/chains"

/**
 * A single token balance as reported by a provider, before identity
 * resolution or aggregation. This is the common shape every
 * PortfolioProvider (mock, Zerion, ...) must produce, whatever the
 * underlying API's response looks like.
 */
export interface RawBalance {
  chainId: ChainId
  walletAddress: string
  /** Contract address, lowercase. The sentinel "native" marks the chain's native coin. */
  tokenAddress: string
  symbol: string
  name: string
  decimals: number
  /** Balance in base units (integer, as a string) — never a float. */
  balance: string
  /** Price per token in USD, if the provider supplied one. */
  usdPrice?: number
  /**
   * A cross-chain asset id the provider already believes this token maps
   * to (e.g. Zerion's fungible id). Treated as a weaker signal than our
   * own curated registry — see resolveAsset.
   */
  providerAssetId?: string
}
