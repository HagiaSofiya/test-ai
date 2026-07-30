import { type RawBalance } from "@/lib/portfolio/raw-balance"

/**
 * Deliberately adversarial mock data for the three preset demo wallets.
 * Each wallet exercises specific merge/no-merge cases the resolver must
 * get right — see the table in resolve-asset.test.ts. Addresses are
 * synthetic patterns (never real), so they can't be confused with an
 * actual wallet; token contract addresses for real assets are genuine
 * mainnet deployments so the registry hits look like real data.
 */

export const WHALE_WALLET = "0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1"
export const MULTI_CHAIN_WALLET = "0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2"
export const DUST_WALLET = "0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3"

export const PRESET_WALLETS = [
  { address: WHALE_WALLET, label: "Whale" },
  { address: MULTI_CHAIN_WALLET, label: "Multi-chain user" },
  { address: DUST_WALLET, label: "Dust-heavy" },
] as const

/** A contract impersonating "USDC" with no registry entry. Must not merge. */
const SPAM_USDC_ADDRESS = "0xbad0bad0bad0bad0bad0bad0bad0bad0bad0bad0"
/** A second, different "USDT" contract, distinct from the real one below. */
const SPAM_USDT_ADDRESS = "0xbad1bad1bad1bad1bad1bad1bad1bad1bad1bad1"
const SPAM_AIRDROP_ADDRESS = "0xbad2bad2bad2bad2bad2bad2bad2bad2bad2bad2"

const ETH_PRICE = 3200
const WETH_PRICE = 3200
const USDC_PRICE = 1
const USDT_PRICE = 1
const POL_PRICE = 0.45

const whaleBalances: RawBalance[] = [
  // Ethereum
  {
    chainId: 1,
    walletAddress: WHALE_WALLET,
    tokenAddress: "native",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    balance: "2500000000000000000",
    usdPrice: ETH_PRICE,
  },
  {
    chainId: 1,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "10000500000",
    usdPrice: USDC_PRICE,
  },
  {
    chainId: 1,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    balance: "1200000000000000000",
    usdPrice: WETH_PRICE,
  },
  {
    chainId: 1,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    balance: "5000000000",
    usdPrice: USDT_PRICE,
  },
  // Arbitrum
  {
    chainId: 42161,
    walletAddress: WHALE_WALLET,
    tokenAddress: "native",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    balance: "750000000000000000",
    usdPrice: ETH_PRICE,
  },
  {
    chainId: 42161,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "3200000000",
    usdPrice: USDC_PRICE,
  },
  {
    // Bridged USDC.e — different contract, same underlying asset, lower confidence.
    chainId: 42161,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    symbol: "USDC.e",
    name: "Bridged USDC",
    decimals: 6,
    balance: "1500000000",
    usdPrice: USDC_PRICE,
  },
  {
    // Spam: claims to be USDC, unregistered contract. Must stay unresolved.
    chainId: 42161,
    walletAddress: WHALE_WALLET,
    tokenAddress: SPAM_USDC_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "999999000000",
  },
  {
    // Spam: claims to be USDT, unregistered contract, distinct from the real USDT above.
    chainId: 42161,
    walletAddress: WHALE_WALLET,
    tokenAddress: SPAM_USDT_ADDRESS,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    balance: "500000000000",
  },
  // Base
  {
    chainId: 8453,
    walletAddress: WHALE_WALLET,
    tokenAddress: "native",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    balance: "400000000000000000",
    usdPrice: ETH_PRICE,
  },
  {
    chainId: 8453,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "800250000",
    usdPrice: USDC_PRICE,
  },
  // Polygon
  {
    chainId: 137,
    walletAddress: WHALE_WALLET,
    tokenAddress: "native",
    symbol: "POL",
    name: "Polygon",
    decimals: 18,
    balance: "1200000000000000000000",
    usdPrice: POL_PRICE,
  },
  {
    chainId: 137,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "450000000",
    usdPrice: USDC_PRICE,
  },
  {
    // Bridged USDC.e on Polygon — merges into the same asset as above.
    chainId: 137,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    symbol: "USDC.e",
    name: "Bridged USDC",
    decimals: 6,
    balance: "220000000",
    usdPrice: USDC_PRICE,
  },
  {
    chainId: 137,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    balance: "100000000",
    usdPrice: USDT_PRICE,
  },
  // Optimism
  {
    chainId: 10,
    walletAddress: WHALE_WALLET,
    tokenAddress: "native",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    balance: "150000000000000000",
    usdPrice: ETH_PRICE,
  },
  {
    chainId: 10,
    walletAddress: WHALE_WALLET,
    tokenAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "50000000",
    usdPrice: USDC_PRICE,
  },
]

const multiChainBalances: RawBalance[] = [
  {
    chainId: 1,
    walletAddress: MULTI_CHAIN_WALLET,
    tokenAddress: "native",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    balance: "50000000000000000",
    usdPrice: ETH_PRICE,
  },
  {
    chainId: 8453,
    walletAddress: MULTI_CHAIN_WALLET,
    tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "120000000",
    usdPrice: USDC_PRICE,
  },
  {
    chainId: 10,
    walletAddress: MULTI_CHAIN_WALLET,
    tokenAddress: "native",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    balance: "10000000000000000",
    usdPrice: ETH_PRICE,
  },
  {
    chainId: 137,
    walletAddress: MULTI_CHAIN_WALLET,
    tokenAddress: "native",
    symbol: "POL",
    name: "Polygon",
    decimals: 18,
    balance: "75000000000000000000",
    usdPrice: POL_PRICE,
  },
  {
    // WETH, not native ETH — must not merge with the ETH holdings above.
    chainId: 42161,
    walletAddress: MULTI_CHAIN_WALLET,
    tokenAddress: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    balance: "30000000000000000",
    usdPrice: WETH_PRICE,
  },
]

const dustBalances: RawBalance[] = [
  {
    chainId: 1,
    walletAddress: DUST_WALLET,
    tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "500000",
    usdPrice: USDC_PRICE,
  },
  {
    chainId: 8453,
    walletAddress: DUST_WALLET,
    tokenAddress: "native",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    balance: "100000000000000",
    usdPrice: ETH_PRICE,
  },
  {
    // Worthless airdropped spam — huge balance, no price, unresolved identity.
    chainId: 42161,
    walletAddress: DUST_WALLET,
    tokenAddress: SPAM_AIRDROP_ADDRESS,
    symbol: "FREEAIRDROP",
    name: "Free Airdrop Token",
    decimals: 18,
    balance: "1000000000000000000000000",
  },
]

export const ALL_FIXTURE_BALANCES: RawBalance[] = [
  ...whaleBalances,
  ...multiChainBalances,
  ...dustBalances,
]

export const FIXTURE_BALANCES_BY_WALLET: Record<string, RawBalance[]> = {
  [WHALE_WALLET]: whaleBalances,
  [MULTI_CHAIN_WALLET]: multiChainBalances,
  [DUST_WALLET]: dustBalances,
}
