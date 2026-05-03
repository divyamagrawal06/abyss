const TESTNET_RPC = 'https://rpc.sepolia.mantle.xyz'
const MAINNET_RPC = 'https://rpc.mantle.xyz'

export interface RpcTx {
  hash: string
  from: string
  to: string | null
  value: string // hex wei
  gas: string // hex gas limit
  input: string // calldata (not forwarded to LLM)
  blockNumber: string | null
  nonce: string
}

export interface RpcReceipt {
  transactionHash: string
  status: string // "0x1" = success, "0x0" = failed
  from: string
  to: string | null
  gasUsed: string // hex
  blockNumber: string // hex
  contractAddress: string | null
  logs: Array<{
    address: string
    topics: string[]
    data: string
  }>
}

async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T | null> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`RPC HTTP ${res.status} ${res.statusText}`)
  const json = await res.json()
  if (json.error) throw new Error(`RPC error: ${json.error.message}`)
  return json.result as T | null
}

export type NetworkName = 'testnet' | 'mainnet'

function rpcUrlForNetwork(network: NetworkName): string {
  if (process.env.MANTLE_RPC_URL) return process.env.MANTLE_RPC_URL
  return network === 'mainnet' ? MAINNET_RPC : TESTNET_RPC
}

export async function fetchTxOnNetwork(
  hash: string,
  network: NetworkName
): Promise<RpcTx | null> {
  return rpcCall<RpcTx>(rpcUrlForNetwork(network), 'eth_getTransactionByHash', [hash])
}

export async function fetchReceiptOnNetwork(
  hash: string,
  network: NetworkName
): Promise<RpcReceipt | null> {
  return rpcCall<RpcReceipt>(rpcUrlForNetwork(network), 'eth_getTransactionReceipt', [hash])
}

// Try testnet first, then mainnet. Returns the tx and which network it was found on.
export async function fetchTxAutoDetect(
  hash: string
): Promise<{ tx: RpcTx; network: NetworkName } | null> {
  const [testnetTx, mainnetTx] = await Promise.all([
    fetchTxOnNetwork(hash, 'testnet').catch(() => null),
    fetchTxOnNetwork(hash, 'mainnet').catch(() => null),
  ])
  if (testnetTx) return { tx: testnetTx, network: 'testnet' }
  if (mainnetTx) return { tx: mainnetTx, network: 'mainnet' }
  return null
}
