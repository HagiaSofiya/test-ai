import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CHAINS } from "@/lib/chains"
import { formatTokenAmount, formatUsd } from "@/lib/format"
import { type GroupRow } from "@/lib/grouping/group-holdings"
import { type Confidence } from "@/lib/portfolio/asset-identity"

const CONFIDENCE_COPY: Record<Exclude<Confidence, "verified">, string> = {
  provider: "Identified by the data provider's own asset id, not our registry.",
  inferred:
    "Recognized as a bridged or wrapped variant — merged with lower confidence.",
  none: "Unrecognized contract. Could be a spam or impostor token — not merged with anything.",
}

interface HoldingRowProps {
  row: GroupRow
}

export function HoldingRow({ row }: HoldingRowProps) {
  const breakdown = describeBreakdown(row)

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-1.5 font-medium">
              {row.symbol}
              {row.confidence !== "verified" ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {row.confidence === "none"
                          ? "Unverified"
                          : row.confidence}
                      </Badge>
                    }
                  />
                  <TooltipContent>
                    {CONFIDENCE_COPY[row.confidence]}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.name}
              {breakdown ? ` · ${breakdown}` : ""}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {formatTokenAmount(row.amount)}
      </TableCell>
      <TableCell className="text-right">{formatUsd(row.usdValue)}</TableCell>
    </TableRow>
  )
}

function describeBreakdown(row: GroupRow): string | null {
  if (row.chainIds.length > 1) {
    return `${row.chainIds.length} networks (${row.chainIds.map((id) => CHAINS[id].name).join(", ")})`
  }
  if (row.walletAddresses.length > 1) {
    return `${row.walletAddresses.length} wallets`
  }
  return null
}
