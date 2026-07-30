import { type ChainId, CHAINS } from "@/lib/chains"
import { FIXTURE_BALANCES_BY_WALLET } from "@/lib/portfolio/fixtures/balances"
import { type PortfolioProvider } from "@/lib/portfolio/portfolio-provider"
import { type RawBalance } from "@/lib/portfolio/raw-balance"
import { NATIVE_TOKEN_ADDRESS, REGISTRY } from "@/lib/portfolio/token-registry"

const GENERATED_CHAIN_IDS = Object.keys(CHAINS).map(Number) as ChainId[]

function usdcAddressForChain(chainId: ChainId): string | undefined {
  const entry = Object.entries(REGISTRY).find(
    ([key, assetKey]) =>
      assetKey === "usd-coin" && Number(key.split(":")[0]) === chainId
  )
  return entry?.[0].split(":")[1]
}

function hashAddress(address: string): number {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = (Math.imul(hash, 31) + address.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/** Seeded PRNG (mulberry32) — deterministic given the same seed. */
function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Builds a base-units integer string from small random whole/fraction parts, via bigint — no float scaling. */
function randomBaseUnits(
  rand: () => number,
  decimals: number,
  maxWhole: number
): string {
  const whole = Math.floor(rand() * maxWhole)
  const precision = Math.min(decimals, 6)
  const fraction = Math.floor(rand() * 10 ** precision)
  const scale = BigInt(10) ** BigInt(decimals - precision)
  const scaled =
    BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fraction) * scale
  return scaled.toString()
}

/**
 * Any address not in the hand-authored preset fixtures gets a portfolio
 * derived deterministically from its own bytes: same address always
 * yields the same holdings, so connecting a real wallet through wagmi
 * produces a stable (if fake) view instead of reshuffling on reload.
 */
function generateBalancesFor(address: string): RawBalance[] {
  const rand = mulberry32(hashAddress(address))
  const balances: RawBalance[] = []

  for (const chainId of GENERATED_CHAIN_IDS) {
    if (rand() < 0.15) continue // sits out this chain entirely, sometimes

    const nativeSymbol = CHAINS[chainId].nativeSymbol
    balances.push({
      chainId,
      walletAddress: address,
      tokenAddress: NATIVE_TOKEN_ADDRESS,
      symbol: nativeSymbol,
      name: nativeSymbol === "POL" ? "Polygon" : "Ethereum",
      decimals: 18,
      balance: randomBaseUnits(rand, 18, 4),
      usdPrice: nativeSymbol === "POL" ? 0.45 : 3200,
    })

    const usdcAddress = usdcAddressForChain(chainId)
    if (usdcAddress && rand() > 0.3) {
      balances.push({
        chainId,
        walletAddress: address,
        tokenAddress: usdcAddress,
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        balance: randomBaseUnits(rand, 6, 5000),
        usdPrice: 1,
      })
    }
  }

  return balances
}

export const mockProvider: PortfolioProvider = {
  id: "mock",
  isMock: true,
  async getBalances(walletAddresses) {
    return walletAddresses.flatMap((address) => {
      const normalized = address.toLowerCase()
      return (
        FIXTURE_BALANCES_BY_WALLET[normalized] ??
        generateBalancesFor(normalized)
      )
    })
  },
}
