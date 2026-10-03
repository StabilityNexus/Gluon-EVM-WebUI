# Security Policy

## Supported Versions

Gluon-EVM WebUI is currently under active development. Security fixes target the latest version of
the `main` branch.

## Reporting a Vulnerability

Please do not disclose security vulnerabilities through public GitHub issues, pull requests, or
public Discord channels.

For security-sensitive reports, contact a project maintainer privately. Maintainers are listed in
[MAINTAINERS.md](MAINTAINERS.md) and can be contacted by direct message through the
[Stability Nexus Discord server](https://discord.gg/hjUhu33uAn).

A vulnerability report should include, where possible:

- the affected page or component
- the affected commit or version
- the browser and wallet
- the chain/network
- the affected contract or address
- a description of the vulnerability and its impact
- steps to reproduce the issue
- a proof of concept, if available
- any suggested mitigation

Please avoid publicly sharing exploit details until the maintainers have had an opportunity to
investigate and address the issue.

Maintainers aim to acknowledge security reports within 14 days and will coordinate remediation and
disclosure with the reporter when appropriate.

## Static WebUI Security

The frontend is intended to remain fully static and deployable through GitHub Pages.

The deployed WebUI must not depend on:

- Next.js API routes
- Server Actions
- runtime SSR
- middleware requiring a server runtime
- server-only secrets
- a separately deployed Gluon application backend

Wallet and contract interactions happen directly from the browser.

## Web3 Security

The WebUI must never request or store:

- private keys
- seed phrases
- recovery phrases
- signing secrets

Security-sensitive areas include incorrect network selection, substituted contract addresses,
approval manipulation, misleading transaction previews, incorrect token decimals, stale oracle
presentation, XSS/injection, unsafe URLs, dependency compromise, and wallet-state confusion.

## Environment Variables

`NEXT_PUBLIC_*` values are public to browser users. Never place secrets there.

## Contract Addresses

Production addresses must come from a maintainer-approved deployment source and should be recorded
in [Deployments.md](Deployments.md).

## OrbOracle

OrbOracle should only be presented as supported after the relevant deployment is verified and
documented.

## Non-Security Bugs

Non-security bugs and feature requests should be reported through the project's
[GitHub Issues](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues).
