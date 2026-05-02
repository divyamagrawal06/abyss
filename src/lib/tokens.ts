export interface TokenInfo {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
}

export interface KnownSpender {
  address: `0x${string}`
  name: string
  kind: string
}

// Mantle mainnet token addresses.
// IMPORTANT: verify each address against https://explorer.mantle.xyz before production.
// Addresses sourced from training data; confirm via Mantle docs / explorer.
export const MAINNET_TOKENS: TokenInfo[] = [
  {
    // Confirm: https://explorer.mantle.xyz/token/0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8
    address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
    symbol: 'WMNT',
    name: 'Wrapped MNT',
    decimals: 18,
  },
  {
    // Canonical BVM ETH predeploy — intentional "dead" pattern, not a burn address
    // Confirm: https://explorer.mantle.xyz/token/0xdEAddEaDdeadDEadDEADDEaddEADdEAddead1111
    address: '0xdEAddEaDdeadDEadDEADDEaddEADdEAddead1111',
    symbol: 'WETH',
    name: 'Wrapped Ether (Bridged)',
    decimals: 18,
  },
]

// Mantle Sepolia testnet token addresses.
// Approval Check is disabled on testnet until these are populated.
// Populate from: https://explorer.sepolia.mantle.xyz
export const TESTNET_TOKENS: TokenInfo[] = []

export const TOKENS =
  process.env.NEXT_PUBLIC_CHAIN === 'mainnet' ? MAINNET_TOKENS : TESTNET_TOKENS

// Known protocol spenders on Mantle mainnet
export const KNOWN_SPENDERS: KnownSpender[] = [
  {
    address: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421',
    name: 'Agni Finance Router',
    kind: 'DEX',
  },
  {
    address: '0xECc19E177d24551aA7ed6Bc6FE566eCa726CC8a9',
    name: 'FusionX Router',
    kind: 'DEX',
  },
  {
    address: '0x9f0ef9c75D6f0e33A5De97e43aBaC37BBEbF0B0D',
    name: 'Lendle (Aave-fork)',
    kind: 'Lending',
  },
]

export function getSpenderName(address: string): string | null {
  const lower = address.toLowerCase()
  const match = KNOWN_SPENDERS.find((s) => s.address.toLowerCase() === lower)
  return match ? `${match.name} (${match.kind})` : null
}
