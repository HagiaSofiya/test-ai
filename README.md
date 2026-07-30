# Multi-Chain Portfolio Explorer

A take-home submission: a portfolio viewer that aggregates fungible token balances across five
EVM chains, resolves them to a single canonical asset identity, and lets you regroup the result
(by token, network, or wallet) without touching a component.

> **Balances shown in this app are mock data.** This was a deliberate choice, not a limitation
> that snuck in — see [Runs with zero API keys](#runs-with-zero-api-keys) below for why, and
> [The provider seam](#the-provider-seam) for where real data attaches. A persistent "Demo data"
> badge in the UI makes this visible to anyone using the app, not just anyone reading this file.

## The brief, distilled

Two sentences drove every architectural decision here:

> "Normalize tokens so the same asset on different networks is treated as one. Design how you
> identify a token — symbol alone isn't enough."

> "Switching groupings shouldn't require a major refactor."

Everything below optimizes for those two. `lib/portfolio/resolve-asset.ts` and
`lib/grouping/groupings.ts` are the files that answer them most directly — start there.

## Quick start

```bash
pnpm install
pnpm dev          # start the dev server
pnpm build        # production build (also the Suspense/prerender correctness gate)
pnpm test         # vitest — pure logic only, no jsdom
pnpm typecheck
pnpm lint
```

No environment variables or API keys are required to run this project. Optionally set
`ZERION_API_KEY` to route through the real adapter instead of the mock — see
[The provider seam](#the-provider-seam) for why that path is untested.

## Architecture decisions

These were the load-bearing calls made before writing any code, and why:

| Decision | Choice | Why |
| --- | --- | --- |
| Data source | A `PortfolioProvider` interface; a fixture-backed mock is the default. A real Zerion adapter exists but is unverified (no key available). | Keeps the UI and aggregation logic ignorant of where balances come from. |
| Wallet connect | Real wagmi connection, plus manually-added watch-only addresses; both flow into one tracked-wallet list. | A portfolio explorer should work for addresses you don't hold keys for, not just your own. |
| Asset scope | Fungible tokens only (native coin + ERC-20), each with a USD value. | NFTs and DeFi positions need a different data model entirely; scoping down keeps the identity problem the focus. |
| Token identity | A layered resolver with provenance — every holding records *which* strategy matched and how confident it is. | Symbol matching is spoofable and unstable across bridged variants; provenance makes the resolver's guesses auditable instead of opaque. |
| Grouping | A registry of grouping descriptors over one flat `Holding[]`, one level deep. | Adding a new grouping becomes a data problem (one object literal), not a UI problem. |
| View state | URL search params, watch-only addresses included; no client-side store. | The whole portfolio view — grouping, filters, tracked wallets — is shareable as a link and survives a reload. |
| Fetch path | `app/api/portfolio/route.ts`; the provider runs server-side. | Keeps a real provider's API key off the client; mock and real providers share the same route. |
| Chains | Ethereum, Arbitrum, Optimism, Base, Polygon. | Enough chains to make bridged-asset collisions and native-token divergence (ETH vs. POL) real problems, not hypothetical ones. |
| Verification | Vitest on pure logic only (`resolve-asset`, `aggregate`, `group-holdings`, `apply-filters`, `view-params`). | Everything worth unit-testing here is a pure function; no component or E2E harness needed to prove it. |

### Runs with zero API keys

The mock provider is fixture-backed, and wagmi's injected connector (MetaMask/Rabby) needs no
credentials — nothing in this build requires a key. The tradeoff, accepted deliberately: **balances
are fake.** Connecting a real wallet shows generated data, not your actual holdings. Live
alternatives — on-chain multicall via viem, a real Zerion API key — were considered and rejected
in favor of a demo that can never be flaky or rate-limited in front of a reviewer. The
`PortfolioProvider` interface (below) is exactly the seam where either of those would attach.

## Token identity — why symbol isn't enough

A token is identified by `(chainId, contractAddress)`, never by symbol. Symbol is display data
only — it never participates in the identity decision. Two reasons:

- **It's spoofable.** Anyone can deploy a contract and name it `USDC`. A fixture in this repo
  does exactly that (a spam token with junk address, symbol `"USDC"`) and it must **not** merge
  with real USDC.
- **It's unstable across bridges.** The same economic asset gets different tickers depending on
  how it arrived on a chain — e.g. USDC vs. legacy bridged `USDC.e`. Matching on symbol would
  either wrongly split identical assets or wrongly merge unrelated ones (two different contracts
  can both claim to be `"USDT"`).

Native coins use the sentinel address `"native"` (see `NATIVE_TOKEN_ADDRESS` in
`lib/portfolio/token-registry.ts`), so ETH and POL — different assets on different networks — are
never accidentally unified just because they're both "the native token."

### The resolver

`resolveAsset()` (`lib/portfolio/resolve-asset.ts`) runs four strategies in order; the first match
wins, and *which one matched* is recorded rather than discarded:

| Order | Strategy | `resolvedVia` | `confidence` |
| --- | --- | --- | --- |
| 1 | Our curated registry, keyed by `(chainId, address)` — canonical mainnet deployments we've verified ourselves | `"registry"` | `"verified"` |
| 2 | The provider's own cross-chain asset id, if supplied (e.g. Zerion's fungible id) | `"provider"` | `"provider"` |
| 3 | Our known bridged/wrapped variants (e.g. USDC.e on Optimism/Polygon/Arbitrum) | `"bridge"` | `"inferred"` |
| 4 | Unresolved — treated as its own distinct asset, `unresolved:{chainId}:{address}` | `"unresolved"` | `"none"` |

`confidence` is **load-bearing, not decorative**: the "hide unverified" filter reads it directly
(`holding.confidence === "none"`), and when holdings from different confidence levels merge into
one grouped row, the row inherits the *weakest* contributing confidence
(`weakestConfidence` in `lib/grouping/group-holdings.ts`) — a merge is only as trustworthy as its
least-certain member.

### Fixture cases (`lib/portfolio/fixtures/balances.ts`), each backed by a test

| Case | Expected result |
| --- | --- |
| USDC on Ethereum / Arbitrum / Base / Polygon | One asset, `verified` |
| USDC.e (bridged) on Optimism / Arbitrum / Polygon | Merges into USDC, `inferred` |
| Native ETH on Ethereum / Arbitrum / Optimism / Base | One asset |
| POL on Polygon | Distinct from ETH, despite both being "the native token" |
| WETH vs. native ETH | **Not** merged — different contracts, different assets |
| Spam token, symbol `"USDC"`, junk address | **Not** merged, `none` confidence |
| Two distinct contracts both claiming `"USDT"` | Not merged |
| Same asset with differing `decimals` across chains | Sums correctly (decimal-safe aggregation, below) |

### Mock data for arbitrary addresses

Anyone can connect any wallet, so the mock provider can't be a static lookup table:

- **Preset addresses** (`PRESET_WALLETS` in `lib/portfolio/fixtures/balances.ts`) return the
  hand-authored adversarial fixtures above — what the tests assert against, and what a reviewer
  should land on first.
- **Any other address** gets a portfolio derived deterministically from a seeded PRNG keyed off
  the address's own bytes (`generateBalancesFor` in `lib/portfolio/providers/mock-provider.ts`).
  The same address always yields the same holdings, so grouping and filtering behave sensibly
  across reloads instead of reshuffling under the user.

## Aggregation and grouping

### Decimal-safe summing

`resolveHoldings()` (`lib/portfolio/aggregate.ts`) normalizes every raw balance from base units
(an integer string, e.g. wei) to a decimal-unit string *before* anything is summed — raw base
units are never added across tokens with different `decimals`. Summing itself
(`sumDecimalAmounts`) scales every amount to a common precision via `bigint` and adds exactly;
`Number(a) + Number(b)` is never used for money, since it silently loses precision once amounts
differ by many orders of magnitude (a 6-decimal USDC amount next to an 18-decimal WETH amount,
say).

### The grouping registry

```ts
interface Grouping {
  id: GroupingMode // "token" | "network" | "wallet"
  label: string
  keyOf: (holding: Holding) => string
  headerOf: (holding: Holding) => GroupHeader
}

const GROUPINGS: Record<GroupingMode, Grouping> = { token: byToken, network: byNetwork, wallet: byWallet }
```

`groupHoldings(holdings, grouping)` (`lib/grouping/group-holdings.ts`) buckets by `keyOf`, then
merges holdings that share an `assetId` within each bucket into one `GroupRow` — so "USDC on
Ethereum and Base" always reads as one line, however the view happens to be sliced. Groups are
sorted by `totalUsd` descending.

**Adding a fourth grouping — e.g. "by protocol" — is one object literal in
`lib/grouping/groupings.ts` and zero component changes.** That's the brief's requirement, made
mechanically checkable: nothing downstream (`group-holdings.ts`, or any future `GroupedList`
component) knows or cares how many grouping modes exist.

A dedicated test asserts all three groupings produce the same grand `totalUsd` — the check that
would catch double-counting if aggregation and grouping ever drifted apart.

## The provider seam

```ts
interface PortfolioProvider {
  id: string
  isMock: boolean // drives the "Demo data" badge automatically
  getBalances(walletAddresses: string[]): Promise<RawBalance[]>
}
```

`app/api/portfolio/route.ts` selects whichever `PortfolioProvider` is active: `mockProvider`
(`lib/portfolio/providers/mock-provider.ts`) by default, or the real
`lib/portfolio/providers/zerion-provider.ts` adapter when `ZERION_API_KEY` is set. Both implement
the same interface, so nothing in aggregation, grouping, filtering, or the UI needs to know which
one is running. The Zerion adapter is written against their public v1 API reference (wallet
positions endpoint, HTTP Basic auth with the key as username) — **but this repo has no Zerion key,
so that path has never actually been run against the live API.** This README says so plainly
rather than implying otherwise; treat its request shape and auth scheme as a best-effort starting
point, not a tested integration. `isMock` is what drives the "Demo data" badge, so switching
providers turns it off automatically rather than requiring anyone to remember to.

Running balances server-side (inside the route handler, not client-side) means a real provider's
API key never reaches the browser.

## View state (the URL contract)

`lib/view-params.ts` owns parsing and serializing the entire view — grouping mode, search/filter
criteria, and tracked watch-only wallets — in both directions, so the whole portfolio state is
shareable as one link and survives a reload:

```
?group=network&q=usdc&chains=1,8453&walletFilter=0xabc&hideDust=1&hideUnverified=1&watch=0xdef
```

Parsing never throws: a malformed or hand-edited URL falls back to defaults field-by-field instead
of crashing the page. This is the one place a bad URL could otherwise take down the app, so it's
the one place with a dedicated test file (`lib/view-params.test.ts`).

## Filters

`applyFilters()` (`lib/filters/apply-filters.ts`) composes, in order: text search (symbol + name),
network multi-select, wallet multi-select, hide-dust (below `DUST_THRESHOLD_USD`), and
hide-unverified (`confidence === "none"`). Filters run **before** grouping, so group totals always
reflect the filtered set rather than the full one.

## Wallets

Connected wallets (via wagmi's injected connector, `lib/wagmi-config.ts`) and manually-added
watch-only addresses flow through the identical pipeline — `mergeTrackedWallets()`
(`lib/portfolio/tracked-wallet.ts`) combines them, deduping by address with the connected wallet
taking priority if the same address is also being watched. `source: "connected" | "watch"` drives
only a UI badge, never a different code path. wagmi is configured with `ssr: true` and
cookie-backed storage, and `app/layout.tsx` hydrates it from the request's cookies via
`cookieToInitialState` — without that, a reconnected wallet would flash "disconnected" on first
paint. That's also why `/` is dynamically rendered rather than static: reading cookies server-side
forces it.

## Supported chains

Ethereum, Arbitrum, Optimism, Base, Polygon (`lib/chains.ts`). Each has its own native-coin
identity — ETH on four of them, POL on Polygon — so the resolver's native-token handling is
exercised, not just its ERC-20 path.

## What's explicitly out of scope

- **NFTs** — a fundamentally different data model (non-fungible, metadata-heavy) than the
  fungible-token identity problem this project focuses on.
- **DeFi positions** (LP tokens, lending deposits, staked positions) — these aren't simple
  balances; valuing them correctly is its own project.
- **Non-EVM chains** — the identity model here (`chainId` + hex contract address) is EVM-shaped by
  construction; a Solana or Bitcoin adapter would need its own address/identity scheme.

## Project structure

```
lib/chains.ts                          Supported chains + metadata
lib/format.ts                          formatUsd, formatTokenAmount, shortenAddress
lib/wagmi-config.ts                    createConfig — 5 chains, injected connector, SSR storage
lib/view-params.ts                     URL <-> view state, both directions

lib/portfolio/raw-balance.ts           Provider-agnostic input shape
lib/portfolio/asset-identity.ts        AssetIdentity, ResolvedVia, Confidence
lib/portfolio/holding.ts               Normalized per-balance output
lib/portfolio/token-registry.ts        Curated registry + bridged-variant map
lib/portfolio/resolve-asset.ts         The layered resolver
lib/portfolio/aggregate.ts             Decimal normalization + decimal-safe summing
lib/portfolio/tracked-wallet.ts        TrackedWallet + mergeTrackedWallets (connected + watch)
lib/portfolio/fixtures/balances.ts     Adversarial fixture data
lib/portfolio/portfolio-provider.ts    The provider interface
lib/portfolio/providers/mock-provider.ts   Fixture-backed default provider
lib/portfolio/providers/zerion-provider.ts Real adapter (unverified — no API key available)

lib/grouping/grouping.ts               Grouping interface
lib/grouping/groupings.ts              The grouping registry (token/network/wallet)
lib/grouping/group-holdings.ts         Bucketing + cross-bucket asset merge

lib/filters/filter-criteria.ts         FilterCriteria shape
lib/filters/apply-filters.ts           Search/network/wallet/dust/unverified filtering

app/api/portfolio/route.ts             Server-side provider call, env-selected
app/layout.tsx                         wagmi cookie hydration, theme + tooltip providers
components/providers.tsx               WagmiProvider + QueryClientProvider

components/portfolio/portfolio-view.tsx    Client orchestrator (URL state, fetch, filter, group)
components/portfolio/wallet-manager.tsx    Connect button + watch-only add/remove
components/portfolio/portfolio-toolbar.tsx Grouping tabs, search, filter chips
components/portfolio/grouped-list.tsx      Renders whatever grouping produced its input
components/portfolio/holding-row.tsx       One row, with confidence badge + tooltip
components/portfolio/portfolio-summary.tsx Grand total + "Demo data" badge

hooks/use-portfolio-data.ts            Fetches + resolves balances for the tracked wallets
```

## Verification

| Gate | Command |
| --- | --- |
| Pure logic | `pnpm test` (41 tests: resolver, aggregation, grouping, filters, view-params, wallet merge) |
| Types | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Suspense/prerender correctness | `pnpm build` |
| End-to-end | `pnpm dev`, then connect/add a wallet, switch groupings, search, toggle filters |

`pnpm build` is the non-obvious one: Next 16 fails the production build if a `useSearchParams`
consumer isn't wrapped in `<Suspense>`, and dev mode won't reveal it.
