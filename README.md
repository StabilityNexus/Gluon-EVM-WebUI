# Gluon-EVM WebUI

Gluon-EVM WebUI is the frontend interface for the [Gluon-EVM protocol](https://github.com/StabilityNexus/Gluon-EVM), developed under [Stability Nexus](https://github.com/StabilityNexus).

## Live Preview
https://stabilitynexus.github.io/Gluon-EVM-WebUI/

> This is currently a development preview. No production Gluon reactor or production coin deployment is registered by this repository yet.

## Current Interface
- Gluon protocol landing and overview
- light/dark themes
- wallet connectivity
- reactor/stablecoin creation UI
- explorer
- reactor interaction pages
- fission, fusion, and transmutation UI
- Proton / Neutron concepts
- GitHub Pages preview deployment

## Relationship to Gluon-EVM
This repository contains the frontend only.

Protocol contracts and Solidity logic live in:
https://github.com/StabilityNexus/Gluon-EVM

The UI should follow the deployed protocol interface and should not independently redefine protocol accounting.

## Planned Work
- latest Gluon-EVM ABI integration
- canonical network/address registry
- production transaction flows
- OrbOracle integration after protocol-side support is merged
- verified on-chain data replacing remaining mock/prototype data
- automated frontend tests
- stricter lint/build validation
- production deployment configuration

## OrbOracle
OrbOracle is planned but is not yet a production WebUI dependency.

Do not hardcode a placeholder production address. Once deployed, document supported network and addresses in [Deployments.md](Deployments.md).

## Tech Stack
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS 4
- RainbowKit
- wagmi
- viem
- Framer Motion
- GSAP
- next-themes

## Setup
```bash
npm ci
npm run dev
```

Type check:
```bash
npx tsc --noEmit
```

Build:
```bash
npm run build
```

## Brand
Gluon-EVM and Gluon-EVM WebUI use the same Gluon and Stability Nexus logo assets.

The application theme follows the actual WebUI: white/light-gray light mode, black/near-black dark mode, grayscale borders/text, inverted primary actions, and subtle cool ambient accents.

See [brand/Brand.md](brand/Brand.md).

## Deployment
See [Deployments.md](Deployments.md).

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security
See [SECURITY.md](SECURITY.md).

## Maintainers
See [MAINTAINERS.md](MAINTAINERS.md).
