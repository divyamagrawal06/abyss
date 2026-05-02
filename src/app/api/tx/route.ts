import { NextRequest, NextResponse } from 'next/server'

// M1: fetch tx + receipt from Mantle RPC, then call Claude for interpretation
export async function POST(req: NextRequest) {
  const { hash } = await req.json()

  if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 })
  }

  return NextResponse.json({ message: 'M1 not yet implemented', hash })
}
