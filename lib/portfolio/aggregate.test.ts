import { describe, expect, it } from "vitest"

import { resolveHoldings, sumDecimalAmounts } from "@/lib/portfolio/aggregate"
import { ALL_FIXTURE_BALANCES } from "@/lib/portfolio/fixtures/balances"
import { type RawBalance } from "@/lib/portfolio/raw-balance"

describe("resolveHoldings", () => {
  it("converts base units to a decimal string using the token's own decimals", () => {
    const raw: RawBalance = {
      chainId: 1,
      walletAddress: "0xwallet",
      tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      balance: "10000500000",
      usdPrice: 1,
    }
    const [holding] = resolveHoldings([raw])
    expect(holding.amount).toBe("10000.5")
    expect(holding.usdValue).toBeCloseTo(10000.5)
  })

  it("treats a missing price as zero USD value rather than throwing", () => {
    const raw: RawBalance = {
      chainId: 42161,
      walletAddress: "0xwallet",
      tokenAddress: "0xspam",
      symbol: "FREEAIRDROP",
      name: "Free Airdrop Token",
      decimals: 18,
      balance: "1000000000000000000000000",
    }
    const [holding] = resolveHoldings([raw])
    expect(holding.usdValue).toBe(0)
  })

  it("produces one Holding per RawBalance — no merging at this stage", () => {
    const holdings = resolveHoldings(ALL_FIXTURE_BALANCES)
    expect(holdings.length).toBe(ALL_FIXTURE_BALANCES.length)
  })
})

describe("sumDecimalAmounts", () => {
  it("sums amounts across differing source decimals without float rounding loss", () => {
    // 1.5 USDC (6 decimals) plus 1 wei of ETH (18 decimals) — a float sum
    // of these two decimal strings would round the wei away entirely.
    const usdcAmount = "1.5"
    const weiAmount = "0.000000000000000001"
    expect(Number(usdcAmount) + Number(weiAmount)).toBe(1.5)

    const total = sumDecimalAmounts([usdcAmount, weiAmount])
    expect(total).toBe("1.500000000000000001")
  })

  it("sums whole-number and fractional amounts correctly", () => {
    expect(sumDecimalAmounts(["100", "0.5", "0.25"])).toBe("100.75")
  })

  it("returns zero for an empty list", () => {
    expect(sumDecimalAmounts([])).toBe("0")
  })
})
