import { describe, expect, it } from "vitest"

import { applyFilters } from "@/lib/filters/apply-filters"
import { DEFAULT_FILTER_CRITERIA } from "@/lib/filters/filter-criteria"
import { type Holding } from "@/lib/portfolio/holding"

function holding(overrides: Partial<Holding>): Holding {
  return {
    assetId: "usd-coin",
    symbol: "USDC",
    name: "USD Coin",
    resolvedVia: "registry",
    confidence: "verified",
    chainId: 1,
    walletAddress: "0xwallet1",
    tokenAddress: "0xtoken",
    amount: "100",
    usdValue: 100,
    ...overrides,
  }
}

describe("applyFilters", () => {
  it("returns everything when criteria are all defaults", () => {
    const holdings = [holding({}), holding({ symbol: "WETH" })]
    expect(applyFilters(holdings, DEFAULT_FILTER_CRITERIA)).toHaveLength(2)
  })

  it("matches search against symbol or name, case-insensitively", () => {
    const holdings = [
      holding({ symbol: "USDC", name: "USD Coin" }),
      holding({ symbol: "WETH", name: "Wrapped Ether" }),
    ]
    expect(
      applyFilters(holdings, { ...DEFAULT_FILTER_CRITERIA, search: "usdc" })
    ).toHaveLength(1)
    expect(
      applyFilters(holdings, { ...DEFAULT_FILTER_CRITERIA, search: "wrapped" })
    ).toHaveLength(1)
    expect(
      applyFilters(holdings, { ...DEFAULT_FILTER_CRITERIA, search: "nope" })
    ).toHaveLength(0)
  })

  it("restricts to the given chain ids", () => {
    const holdings = [holding({ chainId: 1 }), holding({ chainId: 8453 })]
    const result = applyFilters(holdings, {
      ...DEFAULT_FILTER_CRITERIA,
      chainIds: [8453],
    })
    expect(result).toHaveLength(1)
    expect(result[0].chainId).toBe(8453)
  })

  it("restricts to the given wallet addresses", () => {
    const holdings = [
      holding({ walletAddress: "0xwallet1" }),
      holding({ walletAddress: "0xwallet2" }),
    ]
    const result = applyFilters(holdings, {
      ...DEFAULT_FILTER_CRITERIA,
      walletAddresses: ["0xwallet2"],
    })
    expect(result).toHaveLength(1)
    expect(result[0].walletAddress).toBe("0xwallet2")
  })

  it("hides holdings under the dust threshold when hideDust is set", () => {
    const holdings = [holding({ usdValue: 0.5 }), holding({ usdValue: 50 })]
    const result = applyFilters(holdings, {
      ...DEFAULT_FILTER_CRITERIA,
      hideDust: true,
    })
    expect(result).toHaveLength(1)
    expect(result[0].usdValue).toBe(50)
  })

  it("hides unresolved (confidence: none) holdings when hideUnverified is set", () => {
    const holdings = [
      holding({ confidence: "none" }),
      holding({ confidence: "verified" }),
    ]
    const result = applyFilters(holdings, {
      ...DEFAULT_FILTER_CRITERIA,
      hideUnverified: true,
    })
    expect(result).toHaveLength(1)
    expect(result[0].confidence).toBe("verified")
  })

  it("composes multiple active filters", () => {
    const holdings = [
      holding({ chainId: 1, usdValue: 0.1 }),
      holding({ chainId: 1, usdValue: 50 }),
      holding({ chainId: 8453, usdValue: 50 }),
    ]
    const result = applyFilters(holdings, {
      ...DEFAULT_FILTER_CRITERIA,
      chainIds: [1],
      hideDust: true,
    })
    expect(result).toHaveLength(1)
    expect(result[0].chainId).toBe(1)
    expect(result[0].usdValue).toBe(50)
  })
})
