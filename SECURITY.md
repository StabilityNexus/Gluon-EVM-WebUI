# Security Policy

## Supported Version
Gluon-EVM WebUI is under active development. Security fixes target the latest `main` branch.

## Reporting a Vulnerability
Do not publicly disclose security vulnerabilities through GitHub Issues, pull requests, or public Discord channels.

Contact a maintainer privately. See [MAINTAINERS.md](MAINTAINERS.md).

Discord: https://discord.gg/hjUhu33uAn

Include affected page/component, commit, browser/wallet, chain/network, affected contract/address, reproduction steps, expected/actual behavior, and impact when possible.

## Web3 Security
The WebUI must never request private keys, seed phrases, recovery phrases, or signing secrets.

Security-sensitive areas include malicious/substituted contract addresses, incorrect network selection, approval manipulation, misleading transaction previews, XSS/injection, unsafe URLs, dependency compromise, incorrect decimals, and stale/incorrect oracle presentation.

## Environment Variables
`NEXT_PUBLIC_*` variables are public to browser users. Never place secrets there.

## Contract Addresses
Production addresses must come from a maintainer-approved deployment source and should be recorded in [Deployments.md](Deployments.md).

## OrbOracle
OrbOracle should not be presented as live until its Gluon-EVM integration and supported deployment are verified.


## Dependency Security Baseline

Dependency findings are reviewed rather than automatically force-upgraded.

Current validation uses:

- `npm run security:audit` for the production dependency tree.
- CodeQL JavaScript/TypeScript analysis through GitHub Actions.
- TypeScript strict checking and ESLint as static-analysis gates.
- Automated tests, accessibility checks, and production builds in CI.

The current audited dependency baseline contains known upstream findings in the
Next.js and wallet dependency trees. The repository intentionally does not use
`npm audit fix --force` to hide those findings through untested major-version
migrations.

The remaining high/critical package names currently reviewed by the audit gate
are:

- `next` — the current development preview remains on Next.js 14 while a
  controlled migration to a supported framework release is evaluated.
- `postcss` — the remaining finding is the copy bundled by the current Next.js
  dependency; the root PostCSS dependency is patched independently.
- `ws` — affected copies are transitive through wallet/viem dependencies and
  include parent packages with exact or incompatible version constraints.

This repository is presently deployed as a static GitHub Pages preview. The
current application has no Server Actions, API route handlers, Next middleware,
or server-side image optimizer dependency in the deployed Pages artifact.
That architecture reduces exposure to several server-runtime advisories but does
not remove the requirement to migrate unsupported dependencies before treating
the WebUI as a production security baseline.

Any dependency migration must preserve wallet connection, chain selection,
transaction submission, contract interaction, and existing WebUI behavior.
