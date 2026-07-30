import { Suspense } from "react"

import { PortfolioView } from "@/components/portfolio/portfolio-view"
import { Skeleton } from "@/components/ui/skeleton"

export default function Page() {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Track balances across wallets and networks in one view.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <PortfolioView />
      </Suspense>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
