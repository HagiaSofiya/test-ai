export type ChainId = 1 | 10 | 137 | 8453 | 42161

interface ChainMeta {
  id: ChainId
  name: string
  nativeSymbol: string
}

export const CHAINS: Record<ChainId, ChainMeta> = {
  1: { id: 1, name: "Ethereum", nativeSymbol: "ETH" },
  10: { id: 10, name: "Optimism", nativeSymbol: "ETH" },
  137: { id: 137, name: "Polygon", nativeSymbol: "POL" },
  8453: { id: 8453, name: "Base", nativeSymbol: "ETH" },
  42161: { id: 42161, name: "Arbitrum", nativeSymbol: "ETH" },
}

export function isSupportedChain(id: number): id is ChainId {
  return id in CHAINS
}
