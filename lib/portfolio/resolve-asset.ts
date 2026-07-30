import { type AssetIdentity } from "@/lib/portfolio/asset-identity"
import { type RawBalance } from "@/lib/portfolio/raw-balance"
import {
  ASSET_META,
  BRIDGED_VARIANTS,
  REGISTRY,
  registryKey,
} from "@/lib/portfolio/token-registry"

/**
 * Decides whether two token balances represent the same asset. Symbol is
 * never part of the decision — it's spoofable (anyone can name a
 * contract "USDC") and unstable (bridged variants get their own ticker,
 * e.g. USDC.e). Identity is address-based, resolved in order of trust:
 *
 *   1. our curated registry, keyed by (chainId, address)   -> verified
 *   2. the provider's own cross-chain asset id, if given   -> provider
 *   3. our known bridged/wrapped variants                  -> inferred
 *   4. unresolved: treated as its own distinct asset        -> none
 *
 * Confidence is returned alongside the id rather than discarded, so the
 * UI can distinguish a merge we're sure about from one we're guessing at.
 */
export function resolveAsset(raw: RawBalance): AssetIdentity {
  const key = registryKey(raw.chainId, raw.tokenAddress)

  const registryHit = REGISTRY[key]
  if (registryHit) {
    return {
      assetId: registryHit,
      ...ASSET_META[registryHit],
      resolvedVia: "registry",
      confidence: "verified",
    }
  }

  if (raw.providerAssetId) {
    return {
      assetId: raw.providerAssetId,
      symbol: raw.symbol,
      name: raw.name,
      resolvedVia: "provider",
      confidence: "provider",
    }
  }

  const bridgedHit = BRIDGED_VARIANTS[key]
  if (bridgedHit) {
    return {
      assetId: bridgedHit,
      ...ASSET_META[bridgedHit],
      resolvedVia: "bridge",
      confidence: "inferred",
    }
  }

  return {
    assetId: `unresolved:${key}`,
    symbol: raw.symbol,
    name: raw.name,
    resolvedVia: "unresolved",
    confidence: "none",
  }
}
