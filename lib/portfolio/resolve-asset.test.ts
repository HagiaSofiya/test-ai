import { describe, expect, it } from "vitest"

import { ALL_FIXTURE_BALANCES } from "@/lib/portfolio/fixtures/balances"
import { type RawBalance } from "@/lib/portfolio/raw-balance"
import { resolveAsset } from "@/lib/portfolio/resolve-asset"

function balance(overrides: Partial<RawBalance>): RawBalance {
  return {
    chainId: 1,
    walletAddress: "0x0000000000000000000000000000000000000w",
    tokenAddress: "0x0000000000000000000000000000000000000t",
    symbol: "TKN",
    name: "Token",
    decimals: 18,
    balance: "0",
    ...overrides,
  }
}

describe("resolveAsset", () => {
  it("merges canonical USDC across Ethereum, Arbitrum, Base, and Polygon", () => {
    const addresses: [number, string][] = [
      [1, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
      [42161, "0xaf88d065e77c8cc2239327c5edb3a432268e5831"],
      [8453, "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"],
      [137, "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"],
    ]
    const results = addresses.map(([chainId, tokenAddress]) =>
      resolveAsset(
        balance({
          chainId: chainId as RawBalance["chainId"],
          tokenAddress,
          symbol: "USDC",
        })
      )
    )
    expect(new Set(results.map((r) => r.assetId)).size).toBe(1)
    for (const r of results) expect(r.confidence).toBe("verified")
  })

  it("merges bridged USDC.e into the same asset as native USDC, with lower confidence", () => {
    const nativeUsdc = resolveAsset(
      balance({
        chainId: 42161,
        tokenAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
        symbol: "USDC",
      })
    )
    const bridgedUsdc = resolveAsset(
      balance({
        chainId: 42161,
        tokenAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
        symbol: "USDC.e",
      })
    )
    expect(bridgedUsdc.assetId).toBe(nativeUsdc.assetId)
    expect(bridgedUsdc.confidence).toBe("inferred")
    expect(bridgedUsdc.resolvedVia).toBe("bridge")
  })

  it("merges native ETH across Ethereum, Arbitrum, Optimism, and Base", () => {
    const chainIds: RawBalance["chainId"][] = [1, 42161, 10, 8453]
    const results = chainIds.map((chainId) =>
      resolveAsset(balance({ chainId, tokenAddress: "native", symbol: "ETH" }))
    )
    expect(new Set(results.map((r) => r.assetId)).size).toBe(1)
  })

  it("treats POL on Polygon as distinct from ETH", () => {
    const pol = resolveAsset(
      balance({ chainId: 137, tokenAddress: "native", symbol: "POL" })
    )
    const eth = resolveAsset(
      balance({ chainId: 1, tokenAddress: "native", symbol: "ETH" })
    )
    expect(pol.assetId).not.toBe(eth.assetId)
  })

  it("does not merge WETH with native ETH", () => {
    const weth = resolveAsset(
      balance({
        chainId: 1,
        tokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        symbol: "WETH",
      })
    )
    const eth = resolveAsset(
      balance({ chainId: 1, tokenAddress: "native", symbol: "ETH" })
    )
    expect(weth.assetId).not.toBe(eth.assetId)
  })

  it("does not merge a spam contract impersonating USDC's symbol", () => {
    const realUsdc = resolveAsset(
      balance({
        chainId: 42161,
        tokenAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
        symbol: "USDC",
      })
    )
    const spamUsdc = resolveAsset(
      balance({
        chainId: 42161,
        tokenAddress: "0xbad0bad0bad0bad0bad0bad0bad0bad0bad0bad0",
        symbol: "USDC",
      })
    )
    expect(spamUsdc.assetId).not.toBe(realUsdc.assetId)
    expect(spamUsdc.confidence).toBe("none")
    expect(spamUsdc.resolvedVia).toBe("unresolved")
  })

  it("does not merge two distinct contracts that both claim to be USDT", () => {
    const realUsdt = resolveAsset(
      balance({
        chainId: 1,
        tokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        symbol: "USDT",
      })
    )
    const spamUsdt = resolveAsset(
      balance({
        chainId: 42161,
        tokenAddress: "0xbad1bad1bad1bad1bad1bad1bad1bad1bad1bad1",
        symbol: "USDT",
      })
    )
    expect(spamUsdt.assetId).not.toBe(realUsdt.assetId)
    expect(spamUsdt.confidence).toBe("none")
  })

  it("trusts a provider-supplied asset id when we have no registry entry", () => {
    const result = resolveAsset(
      balance({
        chainId: 1,
        tokenAddress: "0x000000000000000000000000000000deadbeef",
        symbol: "SOMETOKEN",
        providerAssetId: "some-token-provider-id",
      })
    )
    expect(result.assetId).toBe("some-token-provider-id")
    expect(result.confidence).toBe("provider")
  })
})

describe("resolveAsset against the fixture dataset", () => {
  const resolved = ALL_FIXTURE_BALANCES.map((raw) => ({
    raw,
    identity: resolveAsset(raw),
  }))

  it("merges every legitimately-resolved USDC-family holding into one asset id", () => {
    // Deliberately filtered by resolved confidence, not raw.symbol — a spam
    // contract in these fixtures also claims the "USDC" symbol, and a
    // symbol-based filter would wrongly sweep it in. See the "does not
    // merge a spam contract" test below for that case on its own.
    const usdcFamily = resolved.filter(
      (r) =>
        ["USDC", "USDC.e"].includes(r.raw.symbol) &&
        r.identity.confidence !== "none"
    )
    const assetIds = new Set(usdcFamily.map((r) => r.identity.assetId))
    expect(usdcFamily.length).toBeGreaterThan(1)
    expect(assetIds.size).toBe(1)
  })

  it("leaves the spam and airdrop tokens unresolved", () => {
    const spamSymbols = ["FREEAIRDROP"]
    const spamAddresses = [
      "0xbad0bad0bad0bad0bad0bad0bad0bad0bad0bad0",
      "0xbad1bad1bad1bad1bad1bad1bad1bad1bad1bad1",
      "0xbad2bad2bad2bad2bad2bad2bad2bad2bad2bad2",
    ]
    const spam = resolved.filter(
      (r) =>
        spamAddresses.includes(r.raw.tokenAddress) ||
        spamSymbols.includes(r.raw.symbol)
    )
    expect(spam.length).toBe(3)
    for (const r of spam) {
      expect(r.identity.confidence).toBe("none")
      expect(r.identity.resolvedVia).toBe("unresolved")
    }
  })

  it("never lets an unresolved asset id collide with a real one", () => {
    const legitimateAssetIds = new Set(
      resolved
        .filter((r) => r.identity.confidence !== "none")
        .map((r) => r.identity.assetId)
    )
    const unresolvedAssetIds = resolved
      .filter((r) => r.identity.confidence === "none")
      .map((r) => r.identity.assetId)
    for (const id of unresolvedAssetIds)
      expect(legitimateAssetIds.has(id)).toBe(false)
  })
})
