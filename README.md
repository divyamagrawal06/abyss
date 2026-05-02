# Abyss

> See through the chain — Mantle, in plain English.

Abyss is a beginner-first web app on Mantle that helps users understand what their wallet is doing without reading raw calldata or explorer tables.

## Tools

- **Tx Translator** — Paste a Mantle transaction hash; get a plain-English explanation grounded in on-chain receipt data.
- **Approval Check** — Connect a wallet; see token spending approvals that matter, with risk flags and plain-English guidance.

## Stack

- Next.js 14 (App Router) + TypeScript
- wagmi v2 + viem (wallet connect + RPC)
- Tailwind CSS
- Claude API (Anthropic) for interpretations
- Mantle Sepolia testnet

## Setup

```bash
cp .env.example .env.local
# fill in your keys
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required variables.

## Architecture

```
abyss/
├── app/
│   ├── page.tsx          # Home — two entry points
│   ├── tx/               # Tx Translator view
│   ├── approvals/        # Approval Check view
│   └── api/
│       ├── tx/           # RPC fetch + Claude interpretation
│       └── approvals/    # Allowance scan
├── lib/
│   ├── mantle.ts         # Chain config + RPC helpers
│   ├── claude.ts         # Claude API client
│   └── tokens.ts         # Curated Mantle token list
└── contracts/            # Attest contract (Hardhat)
```

## Deployed Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Mantle Sepolia | AbyssAttest | TBD |

## Networks

| Network | RPC | Chain ID | Explorer |
|---------|-----|----------|---------|
| Mantle Sepolia (testnet) | https://rpc.sepolia.mantle.xyz | 5003 | https://explorer.sepolia.mantle.xyz |
| Mantle Mainnet | https://rpc.mantle.xyz | 5000 | https://explorer.mantle.xyz |
