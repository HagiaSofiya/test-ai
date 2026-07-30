import { type RawBalance } from "@/lib/portfolio/raw-balance"

/**
 * The seam every balance source implements — the mock fixture provider
 * today, a real Zerion/Zapper-backed adapter later, without either the
 * route handler or anything downstream caring which one is active.
 */
export interface PortfolioProvider {
  id: string
  /** True for providers that return generated/fixture data rather than real balances. */
  isMock: boolean
  getBalances(walletAddresses: string[]): Promise<RawBalance[]>
}
