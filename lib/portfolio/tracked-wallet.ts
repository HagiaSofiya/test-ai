export type WalletSource = "connected" | "watch"

/**
 * A wallet the portfolio is tracking, whether from a live wagmi
 * connection or a manually-entered watch-only address. Both flow
 * through the identical fetch/resolve/group pipeline — source is only
 * used to render a badge.
 */
export interface TrackedWallet {
  address: string
  source: WalletSource
}

/**
 * Merges the connected account (if any) with the watch-only list,
 * deduping by address — if the connected wallet is also present in the
 * watch list, it's kept once, tagged "connected".
 */
export function mergeTrackedWallets(
  connectedAddress: string | undefined,
  watchAddresses: string[]
): TrackedWallet[] {
  const watch: TrackedWallet[] = watchAddresses.map((address) => ({
    address: address.toLowerCase(),
    source: "watch",
  }))

  if (!connectedAddress) return watch

  const normalized = connectedAddress.toLowerCase()
  const withoutDuplicate = watch.filter(
    (wallet) => wallet.address !== normalized
  )
  return [{ address: normalized, source: "connected" }, ...withoutDuplicate]
}
