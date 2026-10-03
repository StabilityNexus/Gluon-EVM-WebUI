# Gluon EVM WebUI Agent Guidelines

This repository contains the fully static Next.js frontend for the Gluon-EVM protocol. Refer to this
file for build commands, style conventions, architecture constraints, and Web3 safety rules.

---

## Tech Stack

- **Framework:** Next.js 14
- **UI:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Wallet:** RainbowKit, wagmi
- **EVM Client:** viem
- **Testing:** Vitest, Testing Library
- **Deployment:** GitHub Pages

---

## Commands

- **Install:** `npm ci`
- **Development:** `npm run dev`
- **Type Check:** `npm run typecheck`
- **Lint:** `npm run lint`
- **Test:** `npm test`
- **Coverage:** `npm run test:coverage`
- **Accessibility:** `npm run test:a11y`
- **Security Audit:** `npm run security:audit`
- **Build / Static Export:** `npm run build`
- **Checklist Check:** `npm run checklist:check`

---

## Architecture & Code Style

### 1. Protocol Source of Truth

Gluon-EVM contracts are the protocol source of truth. Do not reproduce protocol accounting in the
frontend as an independent implementation.

### 2. EVM Values

Use `bigint` and viem parsing/formatting helpers for contract values. Do not use JavaScript
floating-point arithmetic for token values, WAD values, reserve ratios, or fees.

### 3. Token Decimals

Reserve-token decimals may differ by deployment. Never assume the reserve asset uses 18 decimals.

### 4. Shared Configuration

Centralize chain IDs, factory addresses, contract addresses, ABIs, and network configuration.

### 5. Static Hosting

The frontend must remain fully static and deployable through GitHub Pages.

Do not add API routes, Server Actions, runtime SSR, server middleware, server-only secrets, or a
required application backend.

Wallet and contract interactions must happen directly from the browser.

---

## Boundaries

- Never request or store private keys or seed phrases.
- Never invent production deployment addresses.
- Handle disconnected wallet, wrong network, rejection, pending, confirmation, revert, and RPC error states.
- Do not modify generated output under `.next/` or `out/`.
- Do not commit `.env` or secrets.
- Keep pull requests focused.
- Avoid duplicate helpers and unnecessary abstractions.

---

## OrbOracle

Use the oracle configured by the selected reactor.

Do not hardcode a production OrbOracle address or present OrbOracle as supported on a network
without verified deployment evidence.

---

## Git Workflow

- **Commit Format:** use concise prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `style:`, `chore:`, and `ci:`.
- **Branch Format:** use descriptive branches such as `feat/`, `fix/`, `test/`, `docs/`, or `refactor/`.
- **Target:** open contribution pull requests against `main`.
- **Visible UI Changes:** include screenshots or recordings when relevant.

Before review:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run test:a11y
npm run security:audit
npm run build
npm run checklist:check
git diff --check
```
