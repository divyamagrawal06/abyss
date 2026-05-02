'use client'

import { createConfig, http } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { mantleTestnet, mantleMainnet, DEFAULT_CHAIN } from './chains'

export const wagmiConfig = createConfig({
  chains: [DEFAULT_CHAIN],
  connectors: [injected(), metaMask()],
  transports: {
    [mantleTestnet.id]: http(),
    [mantleMainnet.id]: http(),
  },
  ssr: true,
})
