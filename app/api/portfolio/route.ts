import { type NextRequest, NextResponse } from "next/server"

import { type PortfolioProvider } from "@/lib/portfolio/portfolio-provider"
import { mockProvider } from "@/lib/portfolio/providers/mock-provider"
import { createZerionProvider } from "@/lib/portfolio/providers/zerion-provider"

/**
 * Balances are fetched server-side so a real provider's API key never
 * reaches the client. The mock provider is the default and needs no
 * key; set ZERION_API_KEY to switch to the (unverified — see
 * zerion-provider.ts) real adapter. Either way this is the only place
 * that needs to know which provider is active.
 */
function getProvider(): PortfolioProvider {
  const zerionApiKey = process.env.ZERION_API_KEY
  return zerionApiKey ? createZerionProvider(zerionApiKey) : mockProvider
}

const provider = getProvider()

export async function GET(request: NextRequest) {
  const wallets = (request.nextUrl.searchParams.get("wallets") ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)

  const balances = wallets.length > 0 ? await provider.getBalances(wallets) : []

  return NextResponse.json({ balances, isMock: provider.isMock })
}
