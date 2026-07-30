import { describe, expect, it } from "vitest"

import { groupHoldings } from "@/lib/grouping/group-holdings"
import { GROUPINGS } from "@/lib/grouping/groupings"
import { resolveHoldings } from "@/lib/portfolio/aggregate"
import {
  ALL_FIXTURE_BALANCES,
  MULTI_CHAIN_WALLET,
  WHALE_WALLET,
} from "@/lib/portfolio/fixtures/balances"

const holdings = resolveHoldings(ALL_FIXTURE_BALANCES)

describe("groupHoldings", () => {
  it("produces the same portfolio-wide total regardless of grouping mode", () => {
    const totals = Object.values(GROUPINGS).map((grouping) =>
      groupHoldings(holdings, grouping).reduce(
        (sum, group) => sum + group.totalUsd,
        0
      )
    )
    const [first, ...rest] = totals
    for (const total of rest) expect(total).toBeCloseTo(first)
  })

  it("merges USDC across chains into a single row when grouped by token", () => {
    const groups = groupHoldings(holdings, GROUPINGS.token)
    const usdcGroup = groups.find((g) => g.header.label === "USDC")
    expect(usdcGroup).toBeDefined()
    expect(usdcGroup?.rows.length).toBe(1)
    // Merged, so it should carry more than one chain and be worth more
    // than any single chain's contribution alone.
    expect(usdcGroup?.rows[0].chainIds.length).toBeGreaterThan(1)
  })

  it("keeps a spam token impersonating USDC out of the real USDC row when grouped by token", () => {
    const groups = groupHoldings(holdings, GROUPINGS.token)
    const usdcGroup = groups.find((g) => g.header.label === "USDC")
    const unresolvedGroups = groups.filter((g) =>
      g.rows.some((r) => r.confidence === "none")
    )
    expect(usdcGroup?.rows.every((r) => r.confidence !== "none")).toBe(true)
    expect(unresolvedGroups.length).toBeGreaterThan(0)
  })

  it("separates wallets into distinct groups when grouped by wallet, merging each wallet's own cross-chain holdings", () => {
    const groups = groupHoldings(holdings, GROUPINGS.wallet)
    const whaleGroup = groups.find((g) => g.key === WHALE_WALLET)
    const multiGroup = groups.find((g) => g.key === MULTI_CHAIN_WALLET)
    expect(whaleGroup).toBeDefined()
    expect(multiGroup).toBeDefined()
    // The whale's ETH holdings span 4 chains and should collapse to one row.
    const whaleEthRow = whaleGroup?.rows.find((r) => r.symbol === "ETH")
    expect(whaleEthRow?.chainIds.length).toBe(4)
  })

  it("separates chains into distinct groups when grouped by network", () => {
    const groups = groupHoldings(holdings, GROUPINGS.network)
    const chainIds = groups.map((g) => g.key).sort()
    expect(chainIds).toEqual(["1", "10", "137", "42161", "8453"].sort())
  })

  it("sorts groups by descending total USD value", () => {
    const groups = groupHoldings(holdings, GROUPINGS.wallet)
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].totalUsd).toBeGreaterThanOrEqual(groups[i].totalUsd)
    }
  })
})
