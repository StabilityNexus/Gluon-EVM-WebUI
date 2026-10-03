# Gluon-EVM WebUI Deployments

This document records WebUI deployments and the Gluon-EVM contract deployments that the frontend
is configured to use.

## GitHub Pages Development Preview

- **Deployment type:** Static frontend development preview
- **URL:** https://stabilitynexus.github.io/Gluon-EVM-WebUI/
- **Repository:** `StabilityNexus/Gluon-EVM-WebUI`
- **Source branch:** `main`
- **Deployment workflow:** `.github/workflows/nextjs.yml`
- **Production status:** Not declared production

The current GitHub Pages site is a frontend development preview.

It does not imply that any displayed reactor, token, oracle, or contract address is a production
deployment.

## Configured Test Networks

The WebUI currently contains development/testnet configuration for:

| Network | Status |
|---|---|
| Ethereum Sepolia | Configured in the WebUI network registry |
| Scroll Sepolia | Configured in the WebUI network registry |
| Citrea Testnet | Configured in the WebUI network registry |
| Rootstock Testnet | Configured in the WebUI network registry |

Factory addresses and network metadata should remain centralized in the WebUI configuration.

## Production Gluon-EVM Integration

No production Gluon reactor or production coin deployment is currently registered by this WebUI
repository.

| Network | Chain ID | Factory | Reactor(s) | Oracle | Status |
|---|---:|---|---|---|---|
| TODO | TODO | TODO | TODO | TODO | Not configured |

The TODO values are intentional until a maintainer-approved deployment exists.

## OrbOracle

Record OrbOracle deployment information only after the selected network and addresses are verified.

| Item | Status |
|---|---|
| Supported network | TODO |
| Oracle address | TODO |
| Reactor using OrbOracle | TODO |
| Reserve token | TODO |
| Proton | TODO |
| Neutron | TODO |
| Deployment transaction | TODO |
| Gluon-EVM source commit | TODO |
| WebUI config commit | TODO |

Do not fill missing values with guesses.

## Deployment Record Requirements

For each supported Gluon deployment, record:

- network name
- chain ID
- deployment date
- deployment type
- Gluon-EVM source commit
- WebUI config commit
- factory address
- reactor address
- reserve token
- Proton
- Neutron
- oracle implementation/address
- transaction hashes
- explorer links
- verification links
- smoke-test results
- production/test status

## Static Hosting

The WebUI deployment itself should remain:

```text
Next.js static export
        ↓
out/
        ↓
GitHub Pages artifact
        ↓
GitHub Pages
```

No separately deployed WebUI backend is required.
