/** Which resolution strategy produced an asset id, ordered strongest first. */
export type ResolvedVia = "registry" | "provider" | "bridge" | "unresolved"

/**
 * How much to trust a resolved identity. Surfaced in the UI (the "hide
 * unverified" filter reads this) rather than hidden as an implementation
 * detail — the whole point of the resolver is that not every merge is
 * equally certain.
 */
export type Confidence = "verified" | "provider" | "inferred" | "none"

/**
 * The canonical identity a raw balance resolves to. Two RawBalances that
 * resolve to the same assetId are treated as the same asset, however
 * different their symbol or chain.
 */
export interface AssetIdentity {
  assetId: string
  symbol: string
  name: string
  resolvedVia: ResolvedVia
  confidence: Confidence
}
