import { type ChainId } from "@/lib/chains"
import { type PortfolioProvider } from "@/lib/portfolio/portfolio-provider"
import { type RawBalance } from "@/lib/portfolio/raw-balance"

const ZERION_API_BASE = "https://api.zerion.io/v1"

/** Maps Zerion's chain slugs to our ChainId — extend as more chains are added. */
const ZERION_CHAIN_IDS: Record<string, ChainId> = {
  ethereum: 1,
  optimism: 10,
  polygon: 137,
  base: 8453,
  arbitrum: 42161,
}

// --- Zerion response shapes, partial, per their public API docs ---

interface ZerionPositionsResponse {
  data: ZerionPosition[]
}

interface ZerionPosition {
  attributes: {
    quantity: { numeric: string; decimals: number; float: number }
    value: number | null
    fungible_info: {
      symbol: string
      name: string
      implementations: { chain_id: string; address: string | null }[]
    }
  }
  relationships: {
    chain: { data: { id: string } }
  }
}

/**
 * Real Zerion-backed adapter, implementing the same PortfolioProvider
 * interface as the mock. Written against Zerion's public v1 API
 * reference, but UNVERIFIED — this repo ships with no Zerion API key,
 * so this path has never actually been run against the live API. The
 * mock stays the default provider; this is only selected when
 * ZERION_API_KEY is set (see app/api/portfolio/route.ts). Treat the
 * request shape and auth scheme here as a best-effort starting point,
 * not a tested integration.
 */
export function createZerionProvider(apiKey: string): PortfolioProvider {
  return {
    id: "zerion",
    isMock: false,
    async getBalances(walletAddresses) {
      const results = await Promise.all(
        walletAddresses.map((address) => fetchWalletPositions(address, apiKey))
      )
      return results.flat()
    },
  }
}

async function fetchWalletPositions(
  address: string,
  apiKey: string
): Promise<RawBalance[]> {
  const res = await fetch(
    `${ZERION_API_BASE}/wallets/${address}/positions/?filter[positions]=only_simple&currency=usd`,
    {
      headers: {
        accept: "application/json",
        // Zerion's v1 API authenticates via HTTP Basic auth with the API
        // key as the username and an empty password, per their docs.
        authorization: `Basic ${btoa(`${apiKey}:`)}`,
      },
    }
  )

  if (!res.ok) {
    throw new Error(`Zerion request failed for ${address}: ${res.status}`)
  }

  const json = (await res.json()) as ZerionPositionsResponse
  return json.data
    .map((position) => toRawBalance(address, position))
    .filter((balance): balance is RawBalance => balance !== null)
}

function toRawBalance(
  walletAddress: string,
  position: ZerionPosition
): RawBalance | null {
  const chainSlug = position.relationships.chain.data.id
  const chainId = ZERION_CHAIN_IDS[chainSlug]
  if (!chainId) return null // chain we don't support yet — skip rather than misattribute

  const implementation = position.attributes.fungible_info.implementations.find(
    (impl) => impl.chain_id === chainSlug
  )
  const { quantity, value, fungible_info: fungibleInfo } = position.attributes

  return {
    chainId,
    walletAddress,
    tokenAddress: implementation?.address?.toLowerCase() ?? "native",
    symbol: fungibleInfo.symbol,
    name: fungibleInfo.name,
    decimals: quantity.decimals,
    balance: decimalToBaseUnits(quantity.numeric, quantity.decimals),
    usdPrice:
      value != null && quantity.float > 0 ? value / quantity.float : undefined,
  }
}

/** Converts Zerion's decimal-string quantity to base units via bigint scaling, no float precision loss. */
function decimalToBaseUnits(numeric: string, decimals: number): string {
  const [whole, fraction = ""] = numeric.split(".")
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals)
  return BigInt((whole || "0") + paddedFraction).toString()
}
