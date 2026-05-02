const getRpcUrl = () =>
  process.env.MANTLE_RPC_URL ??
  (process.env.NEXT_PUBLIC_CHAIN === 'mainnet'
    ? 'https://rpc.mantle.xyz'
    : 'https://rpc.sepolia.mantle.xyz')

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

async function rpcCall<T>(method: string, params: unknown[]): Promise<T | null> {
  const res = await fetch(getRpcUrl(), {
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

export const fetchTx = (hash: string) =>
  rpcCall<RpcTx>('eth_getTransactionByHash', [hash])

export const fetchReceipt = (hash: string) =>
  rpcCall<RpcReceipt>('eth_getTransactionReceipt', [hash])
