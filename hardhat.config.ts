import type { HardhatUserConfig } from 'hardhat/config'

// Load .env manually (no dotenv dep needed)
import { readFileSync } from 'fs'
try {
  const env = readFileSync('.env', 'utf8')
  env.split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.+)$/)
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim()
  })
} catch { /* .env not present */ }

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    mantle_sepolia: {
      type: 'http',
      url: process.env.MANTLE_RPC_URL ?? 'https://rpc.sepolia.mantle.xyz',
      accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : [],
      chainId: 5003,
    },
    mantle: {
      type: 'http',
      url: 'https://rpc.mantle.xyz',
      accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : [],
      chainId: 5000,
    },
  },
}

export default config
