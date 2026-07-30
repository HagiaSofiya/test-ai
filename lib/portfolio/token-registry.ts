import { type ChainId } from "@/lib/chains"

/**
 * Curated set of canonical asset ids this app knows about. Deliberately a
 * closed, hand-maintained list rather than anything derived from a
 * symbol string — that's the whole point of the resolver.
 */
export type AssetKey =
  "ethereum" | "polygon-ecosystem-token" | "usd-coin" | "tether" | "weth"

export const ASSET_META: Record<AssetKey, { symbol: string; name: string }> = {
  ethereum: { symbol: "ETH", name: "Ethereum" },
  "polygon-ecosystem-token": { symbol: "POL", name: "Polygon" },
  "usd-coin": { symbol: "USDC", name: "USD Coin" },
  tether: { symbol: "USDT", name: "Tether USD" },
  weth: { symbol: "WETH", name: "Wrapped Ether" },
}

/** Sentinel used in RawBalance.tokenAddress for a chain's native coin. */
export const NATIVE_TOKEN_ADDRESS = "native"

export function registryKey(chainId: ChainId, tokenAddress: string): string {
  return `${chainId}:${tokenAddress.toLowerCase()}`
}

/**
 * (chainId, address) -> canonical asset. Verified by us, not by a
 * provider — this is the strongest signal the resolver has. Addresses
 * are real mainnet contracts for each network's canonical deployment.
 */
export const REGISTRY: Record<string, AssetKey> = {
  "1:native": "ethereum",
  "10:native": "ethereum",
  "8453:native": "ethereum",
  "42161:native": "ethereum",
  "137:native": "polygon-ecosystem-token",

  "1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "usd-coin",
  "10:0x0b2c639c533813f4aa9d7837caf62653d097ff85": "usd-coin",
  "137:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": "usd-coin",
  "8453:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "usd-coin",
  "42161:0xaf88d065e77c8cc2239327c5edb3a432268e5831": "usd-coin",

  "1:0xdac17f958d2ee523a2206206994597c13d831ec7": "tether",
  "137:0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "tether",
  "42161:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "tether",

  "1:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "weth",
  "10:0x4200000000000000000000000000000000000006": "weth",
  "137:0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": "weth",
  "8453:0x4200000000000000000000000000000000000006": "weth",
  "42161:0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "weth",
}

/**
 * Bridged/wrapped variants of a registry asset that we recognize but
 * didn't verify ourselves — e.g. the legacy PoS-bridged USDC.e on
 * Polygon and Arbitrum, distinct contracts from native USDC. Matching
 * here yields "inferred" confidence, one notch below the registry.
 */
export const BRIDGED_VARIANTS: Record<string, AssetKey> = {
  "10:0x7f5c764cbc14f9669b88837ca1490cca17c31607": "usd-coin", // USDC.e, Optimism
  "137:0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "usd-coin", // USDC.e, Polygon
  "42161:0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "usd-coin", // USDC.e, Arbitrum
}
