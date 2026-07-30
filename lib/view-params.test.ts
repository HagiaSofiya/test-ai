import { describe, expect, it } from "vitest"

import {
  DEFAULT_VIEW_PARAMS,
  parseViewParams,
  serializeViewParams,
  type ViewParams,
} from "@/lib/view-params"

describe("parseViewParams", () => {
  it("falls back to defaults for an empty URL", () => {
    expect(parseViewParams(new URLSearchParams())).toEqual(DEFAULT_VIEW_PARAMS)
  })

  it("parses a fully populated URL", () => {
    const params = parseViewParams(
      new URLSearchParams(
        "group=network&q=usdc&chains=1,8453&walletFilter=0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1&hideDust=1&hideUnverified=1&watch=0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2"
      )
    )
    expect(params.grouping).toBe("network")
    expect(params.criteria.search).toBe("usdc")
    expect(params.criteria.chainIds).toEqual([1, 8453])
    expect(params.criteria.walletAddresses).toEqual([
      "0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1",
    ])
    expect(params.criteria.hideDust).toBe(true)
    expect(params.criteria.hideUnverified).toBe(true)
    expect(params.watchWallets).toEqual([
      "0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2",
    ])
  })

  it("falls back to the default grouping on an invalid group value, without throwing", () => {
    const params = parseViewParams(
      new URLSearchParams("group=not-a-real-grouping")
    )
    expect(params.grouping).toBe("token")
  })

  it("drops unsupported chain ids instead of throwing", () => {
    const params = parseViewParams(
      new URLSearchParams("chains=1,999999,not-a-number,8453")
    )
    expect(params.criteria.chainIds).toEqual([1, 8453])
  })

  it("drops malformed addresses instead of throwing", () => {
    const params = parseViewParams(
      new URLSearchParams("watch=not-an-address,0xtooshort")
    )
    expect(params.watchWallets).toEqual([])
  })

  it("lowercases addresses so casing differences don't create duplicate identities", () => {
    const params = parseViewParams(
      new URLSearchParams("watch=0xA1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1")
    )
    expect(params.watchWallets).toEqual([
      "0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1",
    ])
  })
})

describe("serializeViewParams", () => {
  it("omits defaulted fields entirely, keeping URLs short", () => {
    expect(serializeViewParams(DEFAULT_VIEW_PARAMS).toString()).toBe("")
  })

  it("round-trips through parse -> serialize -> parse", () => {
    const params: ViewParams = {
      grouping: "wallet",
      criteria: {
        search: "eth",
        chainIds: [1, 42161],
        walletAddresses: ["0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1"],
        hideDust: true,
        hideUnverified: false,
      },
      watchWallets: ["0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2"],
    }
    const roundTripped = parseViewParams(serializeViewParams(params))
    expect(roundTripped).toEqual(params)
  })
})
