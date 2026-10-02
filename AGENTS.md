# Gluon-EVM WebUI Agent Guidelines

This repository contains the Next.js frontend for the Gluon-EVM protocol.

## Stack
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS 4
- RainbowKit
- wagmi
- viem
- next-themes
- Framer Motion / GSAP

## Commands
- `npm ci`
- `npm run dev`
- `npx tsc --noEmit`
- `npm run build`

## Architecture Rules
- Gluon-EVM contracts are the protocol source of truth.
- Do not duplicate protocol accounting rules in the frontend.
- Centralize chain IDs, contract addresses, ABIs, and RPC configuration.
- Never invent production deployment addresses.
- Reserve-token decimals may differ between deployments; never assume 18 decimals.
- Prefer `bigint` and viem parsing/formatting helpers for on-chain values.

## OrbOracle
OrbOracle support is planned after the corresponding Gluon-EVM integration is merged and deployed.

Until then:
- do not present OrbOracle as live
- do not hardcode an OrbOracle production address
- do not mock production oracle values

## Wallet and Transaction Safety
Never request or store private keys, seed phrases, or signing secrets.

Handle disconnected wallet, wrong network, pending, confirmed, user-rejected, reverted, and RPC-error states explicitly.

## Theme and Brand
Gluon-EVM and Gluon-EVM WebUI share the same Gluon logo, favicon, and Stability Nexus organization logo.

`app/globals.css` is the source of truth for the WebUI theme.

The current UI is primarily black/white/grayscale with light and dark modes and subtle cool ambient accents such as `#D9E2FF`.

## Pull Requests
Keep PRs focused. Visible UI changes should include screenshots/recordings for relevant light/dark and responsive states.

Minimum checks:
```bash
npx tsc --noEmit
npm run build
git diff --check
```
