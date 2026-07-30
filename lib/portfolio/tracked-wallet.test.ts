import { describe, expect, it } from "vitest"

import { mergeTrackedWallets } from "@/lib/portfolio/tracked-wallet"

describe("mergeTrackedWallets", () => {
  it("returns only watch-only wallets when nothing is connected", () => {
    const result = mergeTrackedWallets(undefined, ["0xa1", "0xb2"])
    expect(result).toEqual([
      { address: "0xa1", source: "watch" },
      { address: "0xb2", source: "watch" },
    ])
  })

  it("puts the connected wallet first, tagged 'connected'", () => {
    const result = mergeTrackedWallets("0xConnected", ["0xa1"])
    expect(result).toEqual([
      { address: "0xconnected", source: "connected" },
      { address: "0xa1", source: "watch" },
    ])
  })

  it("dedupes when the connected address is also in the watch list", () => {
    const result = mergeTrackedWallets("0xA1", ["0xa1", "0xb2"])
    expect(result).toEqual([
      { address: "0xa1", source: "connected" },
      { address: "0xb2", source: "watch" },
    ])
  })
})
