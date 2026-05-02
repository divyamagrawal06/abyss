/**
 * Deploy AbyssAttest contract to Mantle (testnet or mainnet).
 *
 * Usage:
 *   npx hardhat compile
 *   DEPLOY_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.ts --network mantle_sepolia
 *
 * After deploy, add the printed address to .env as NEXT_PUBLIC_ATTEST_CONTRACT
 */
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mantleTestnet, mantleMainnet, DEFAULT_CHAIN } from '../src/lib/chains'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const key = process.env.DEPLOY_PRIVATE_KEY
if (!key) {
  console.error('Error: DEPLOY_PRIVATE_KEY not set in .env')
  process.exit(1)
}

// Load compiled artifact
const artifactPath = join(__dirname, '../artifacts/contracts/AbyssAttest.sol/AbyssAttest.json')
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))

const chain = process.env.DEPLOY_NETWORK === 'mainnet' ? mantleMainnet : mantleTestnet
const account = privateKeyToAccount(key as `0x${string}`)

const walletClient = createWalletClient({ account, chain, transport: http() })
const publicClient = createPublicClient({ chain, transport: http() })

async function main() {
  console.log(`Deploying to ${chain.name} (chain ${chain.id})`)
  console.log(`Deployer: ${account.address}`)

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`Balance: ${(Number(balance) / 1e18).toFixed(6)} MNT`)

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

  console.log(`\n✓ AbyssAttest deployed to: ${receipt.contractAddress}`)
  console.log(`\nAdd to your .env:`)
  console.log(`NEXT_PUBLIC_ATTEST_CONTRACT=${receipt.contractAddress}`)

  const explorerBase = chain.id === 5000
    ? 'https://explorer.mantle.xyz'
    : 'https://explorer.sepolia.mantle.xyz'
  console.log(`\nExplorer: ${explorerBase}/address/${receipt.contractAddress}`)
  console.log(`\nNext: verify the contract on the explorer to satisfy the hackathon requirement.`)
}

main().catch(err => { console.error(err); process.exit(1) })
