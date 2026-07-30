"use client"

import { X } from "lucide-react"
import * as React from "react"
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { shortenAddress } from "@/lib/format"
import { PRESET_WALLETS } from "@/lib/portfolio/fixtures/balances"
import { mergeTrackedWallets } from "@/lib/portfolio/tracked-wallet"

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/

interface WalletManagerProps {
  watchWallets: string[]
  onWatchWalletsChange: (wallets: string[]) => void
}

/**
 * Wallet tracking: a real wagmi connect button plus watch-only entries
 * (preset demo addresses or manual paste), unified into one list via
 * mergeTrackedWallets. Both flow through the identical fetch pipeline —
 * "source" only changes which badge and remove action a wallet gets.
 */
export function WalletManager({
  watchWallets,
  onWatchWalletsChange,
}: WalletManagerProps) {
  const { address: connectedAddress, isConnected } = useConnection()
  const connectors = useConnectors()
  const {
    mutate: connect,
    isPending: isConnecting,
    error: connectError,
  } = useConnect()
  const { mutate: disconnect } = useDisconnect()

  const [addressInput, setAddressInput] = React.useState("")
  const [inputError, setInputError] = React.useState<string | null>(null)

  const trackedWallets = mergeTrackedWallets(
    isConnected ? connectedAddress : undefined,
    watchWallets
  )

  function addWallet(address: string) {
    const normalized = address.toLowerCase()
    if (!watchWallets.includes(normalized)) {
      onWatchWalletsChange([...watchWallets, normalized])
    }
  }

  function removeWallet(address: string) {
    onWatchWalletsChange(watchWallets.filter((a) => a !== address))
  }

  function togglePreset(address: string, pressed: boolean) {
    if (pressed) addWallet(address)
    else removeWallet(address)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = addressInput.trim()
    if (!ADDRESS_PATTERN.test(trimmed)) {
      setInputError("Enter a valid 0x address")
      return
    }
    addWallet(trimmed)
    setAddressInput("")
    setInputError(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {isConnected && connectedAddress ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => disconnect()}
          >
            Disconnect {shortenAddress(connectedAddress)}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={connectors.length === 0 || isConnecting}
            onClick={() => {
              const connector = connectors[0]
              if (connector) connect({ connector })
            }}
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </Button>
        )}
        {connectError ? (
          <p className="text-xs text-destructive">
            {connectError.message.toLowerCase().includes("provider")
              ? "No browser wallet found."
              : connectError.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_WALLETS.map((preset) => (
          <Toggle
            key={preset.address}
            size="sm"
            variant="outline"
            pressed={watchWallets.includes(preset.address)}
            onPressedChange={(pressed) => togglePreset(preset.address, pressed)}
          >
            {preset.label}
          </Toggle>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            value={addressInput}
            onChange={(event) => {
              setAddressInput(event.target.value)
              setInputError(null)
            }}
            placeholder="Watch a wallet address (0x…)"
          />
          {inputError ? (
            <p className="mt-1 text-xs text-destructive">{inputError}</p>
          ) : null}
        </div>
        <Button type="submit" variant="secondary">
          Add
        </Button>
      </form>

      {trackedWallets.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {trackedWallets.map((wallet) => {
            const preset = PRESET_WALLETS.find(
              (p) => p.address === wallet.address
            )
            return (
              <Badge
                key={wallet.address}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {wallet.source === "connected" ? "Connected: " : ""}
                {preset?.label ?? shortenAddress(wallet.address)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-4 rounded-full"
                  onClick={() =>
                    wallet.source === "connected"
                      ? disconnect()
                      : removeWallet(wallet.address)
                  }
                  aria-label={`Remove ${wallet.address}`}
                >
                  <X />
                </Button>
              </Badge>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
