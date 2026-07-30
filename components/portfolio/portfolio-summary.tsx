import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatUsd } from "@/lib/format"

interface PortfolioSummaryProps {
  totalUsd: number
  isMock: boolean
}

export function PortfolioSummary({ totalUsd, isMock }: PortfolioSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Portfolio value</CardTitle>
          {isMock ? (
            <Tooltip>
              <TooltipTrigger
                render={<Badge variant="outline">Demo data</Badge>}
              />
              <TooltipContent>
                Balances are generated for this demo — not your real holdings.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-medium">{formatUsd(totalUsd)}</p>
      </CardContent>
    </Card>
  )
}
