import { HoldingRow } from "@/components/portfolio/holding-row"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatUsd } from "@/lib/format"
import { type Group } from "@/lib/grouping/group-holdings"

interface GroupedListProps {
  groups: Group[]
}

/**
 * Renders whatever grouping produced these groups — token, network, or
 * wallet — with no branching on which one it is. Adding a new grouping
 * mode to lib/grouping/groupings.ts requires no change here.
 */
export function GroupedList({ groups }: GroupedListProps) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No holdings match the current filters.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <Card key={group.key}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>{group.header.label}</CardTitle>
                {group.header.sublabel ? (
                  <CardDescription>{group.header.sublabel}</CardDescription>
                ) : null}
              </div>
              <p className="font-medium">{formatUsd(group.totalUsd)}</p>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.rows.map((row) => (
                  <HoldingRow key={row.assetId} row={row} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
