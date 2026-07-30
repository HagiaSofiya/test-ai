import { type Holding } from "@/lib/portfolio/holding"
import { type RawBalance } from "@/lib/portfolio/raw-balance"
import { resolveAsset } from "@/lib/portfolio/resolve-asset"

/** Precision used when summing decimal amounts — matches the largest decimals we support (18, native ETH/WETH). */
const SUM_PRECISION = 18

function baseUnitsToDecimalString(baseUnits: string, decimals: number): string {
  const negative = baseUnits.startsWith("-")
  const digits = negative ? baseUnits.slice(1) : baseUnits
  const padded = digits.padStart(decimals + 1, "0")
  const wholePart = padded.slice(0, padded.length - decimals) || "0"
  const fractionPart =
    decimals > 0
      ? padded.slice(padded.length - decimals).replace(/0+$/, "")
      : ""
  const sign = negative ? "-" : ""
  return fractionPart
    ? `${sign}${wholePart}.${fractionPart}`
    : `${sign}${wholePart}`
}

function toScaledBigInt(decimalString: string): bigint {
  const negative = decimalString.startsWith("-")
  const unsigned = negative ? decimalString.slice(1) : decimalString
  const [wholePart, fractionPart = ""] = unsigned.split(".")
  const scaled = BigInt(
    (wholePart || "0") +
      fractionPart.padEnd(SUM_PRECISION, "0").slice(0, SUM_PRECISION)
  )
  return negative ? -scaled : scaled
}

function fromScaledBigInt(scaled: bigint): string {
  const negative = scaled < BigInt(0)
  const digits = (negative ? -scaled : scaled)
    .toString()
    .padStart(SUM_PRECISION + 1, "0")
  const wholePart = digits.slice(0, digits.length - SUM_PRECISION) || "0"
  const fractionPart = digits
    .slice(digits.length - SUM_PRECISION)
    .replace(/0+$/, "")
  const sign = negative ? "-" : ""
  return fractionPart
    ? `${sign}${wholePart}.${fractionPart}`
    : `${sign}${wholePart}`
}

/**
 * Adds decimal-string amounts exactly, via bigint scaling, regardless of
 * how many decimals each source token used. A naive `Number(a) + Number(b)`
 * sum silently drops precision once amounts differ by many orders of
 * magnitude (a 6-decimal USDC amount next to an 18-decimal wei amount,
 * say) — this doesn't.
 */
export function sumDecimalAmounts(amounts: string[]): string {
  const total = amounts.reduce(
    (sum, amount) => sum + toScaledBigInt(amount),
    BigInt(0)
  )
  return fromScaledBigInt(total)
}

/**
 * Resolves identity and normalizes decimal representation for every raw
 * balance. One Holding per RawBalance — no merging yet, that happens per
 * grouping bucket in lib/grouping/group-holdings.ts.
 */
export function resolveHoldings(rawBalances: RawBalance[]): Holding[] {
  return rawBalances.map((raw) => {
    const identity = resolveAsset(raw)
    const amount = baseUnitsToDecimalString(raw.balance, raw.decimals)
    const usdValue = raw.usdPrice ? Number(amount) * raw.usdPrice : 0
    return {
      ...identity,
      chainId: raw.chainId,
      walletAddress: raw.walletAddress,
      tokenAddress: raw.tokenAddress,
      amount,
      usdValue,
    }
  })
}
