/**
 * Deploy AbyssAttest contract to Mantle Sepolia.
 *
 * Usage:
 *   npx hardhat compile
 *   npx hardhat run scripts/deploy.ts --network mantle_sepolia
 *
 * Reads DEPLOY_PRIVATE_KEY from .env — key with or without 0x prefix both work.
 * After deploy, add the printed address to .env as NEXT_PUBLIC_ATTEST_CONTRACT
 */
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mantleTestnet, mantleMainnet } from '../src/lib/chains'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env from project root directly in this script (more reliable than hardhat config loader)
try {
  const envFile = readFileSync(join(__dirname, '../.env'), 'utf8')
  for (const line of envFile.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#\s][^=]*?)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* .env not found — rely on process.env */ }

let rawKey = process.env.DEPLOY_PRIVATE_KEY
if (!rawKey) {
  console.error('Error: DEPLOY_PRIVATE_KEY not set in .env')
  process.exit(1)
}

// MetaMask exports without 0x — add it if missing
const key = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`

const artifactPath = join(__dirname, '../artifacts/contracts/AbyssAttest.sol/AbyssAttest.json')
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))

const chain = process.env.DEPLOY_NETWORK === 'mainnet' ? mantleMainnet : mantleTestnet
const account = privateKeyToAccount(key)
const walletClient = createWalletClient({ account, chain, transport: http() })
const publicClient = createPublicClient({ chain, transport: http() })

async function main() {
  console.log(`Deploying to ${chain.name} (chain ${chain.id})`)
  console.log(`Deployer: ${account.address}`)

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`Balance: ${(Number(balance) / 1e18).toFixed(6)} MNT`)

  if (balance === 0n) {
    console.error('\nError: wallet has 0 MNT — get testnet MNT from https://faucet.sepolia.mantle.xyz')
    process.exit(1)
  }

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [],
  })

  console.log(`Deploy tx: ${hash}`)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  if (!receipt.contractAddress) {
    console.error('Deployment failed — no contract address in receipt')
    process.exit(1)
  }

  const explorerBase = chain.id === 5000
    ? 'https://explorer.mantle.xyz'
    : 'https://explorer.sepolia.mantle.xyz'

  console.log(`\n✓ AbyssAttest deployed to: ${receipt.contractAddress}`)
  console.log(`\nAdd to your .env:\nNEXT_PUBLIC_ATTEST_CONTRACT=${receipt.contractAddress}`)
  console.log(`\nExplorer: ${explorerBase}/address/${receipt.contractAddress}`)
  console.log(`\nNext: verify on the explorer (Verify & Publish → Solidity single file → 0.8.20 → optimizer 200 runs)`)
}

main().catch(err => { console.error(err); process.exit(1) })
