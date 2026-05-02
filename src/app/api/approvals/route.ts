import { NextRequest, NextResponse } from 'next/server'

// M2: multicall allowance(owner, spender) for curated tokens, return risk-tagged results
export async function POST(req: NextRequest) {
  const { address } = await req.json()

  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  return NextResponse.json({ message: 'M2 not yet implemented', address })
}
