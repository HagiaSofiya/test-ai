import { CHAINS } from "@/lib/chains"
import { shortenAddress } from "@/lib/format"
import { type Grouping, type GroupingMode } from "@/lib/grouping/grouping"

const byToken: Grouping = {
  id: "token",
  label: "Token",
  keyOf: (holding) => holding.assetId,
  headerOf: (holding) => ({ label: holding.symbol, sublabel: holding.name }),
}

const byNetwork: Grouping = {
  id: "network",
  label: "Network",
  keyOf: (holding) => String(holding.chainId),
  headerOf: (holding) => ({ label: CHAINS[holding.chainId].name }),
}

const byWallet: Grouping = {
  id: "wallet",
  label: "Wallet",
  keyOf: (holding) => holding.walletAddress,
  headerOf: (holding) => ({ label: shortenAddress(holding.walletAddress) }),
}

/**
 * Every grouping mode the UI can offer. Adding a fourth (e.g. "protocol")
 * is one more entry here — no component changes required, since
 * GroupedList (Phase 3) renders whatever Grouping it's given.
 */
export const GROUPINGS: Record<GroupingMode, Grouping> = {
  token: byToken,
  network: byNetwork,
  wallet: byWallet,
}
