import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from "wagmi"
import { arbitrum, base, mainnet, optimism, polygon } from "wagmi/chains"

/**
 * The 5 chains this app supports — kept in the same order and set as
 * lib/chains.ts's ChainId union. ssr + cookieStorage let the connected
 * account survive the server render instead of flashing "disconnected"
 * on first paint.
 */
export function getWagmiConfig() {
  return createConfig({
    chains: [mainnet, arbitrum, optimism, base, polygon],
    connectors: [injected()],
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports: {
      [mainnet.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [base.id]: http(),
      [polygon.id]: http(),
    },
  })
}
