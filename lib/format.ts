const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function formatUsd(value: number): string {
  return usdFormatter.format(value)
}

/**
 * Formats a decimal-string token amount for display, trimming to a
 * sensible number of fraction digits without ever routing through a
 * float for the underlying value.
 */
export function formatTokenAmount(amount: string): string {
  const [whole, fraction = ""] = amount.split(".")
  const trimmedFraction = fraction.slice(0, 6).replace(/0+$/, "")
  const wholeWithSeparators = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return trimmedFraction
    ? `${wholeWithSeparators}.${trimmedFraction}`
    : wholeWithSeparators
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
