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

// Mantle mainnet token addresses
export const MAINNET_TOKENS: TokenInfo[] = [
  {
    address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
    symbol: 'WMNT',
    name: 'Wrapped MNT',
    decimals: 18,
  },
  {
    address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  {
    address: '0xdEAddEaDdeadDEadDEADDEaddEADdEAddead1111',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0',
    symbol: 'mETH',
    name: 'Mantle Staked ETH',
    decimals: 18,
  },
]

// Mantle Sepolia testnet token addresses — update when testnet equivalents are confirmed
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
