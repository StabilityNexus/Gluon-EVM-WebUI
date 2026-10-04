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

A verified Orb-backed Gluon deployment is available on Ethereum Sepolia for development and
end-to-end testing.

This deployment uses Orb directly through Gluon's `IOracle` interface. No Orb-specific adapter or
Chainlink adapter is used in this flow.

| Item | Verified value |
|---|---|
| Network | Ethereum Sepolia |
| Chain ID | `11155111` |
| Deployment type | Testnet / development |
| Factory | `0x3Ca248b434DF95F20fc6469393D2e242243C47C6` |
| Reactor using OrbOracle | `0x8465812dDbf49dC5F5BE1799D22A1279db828Fe1` |
| Oracle address | `0xff2b1fca4aF0c9BCb576178e6989AA92819a0294` |
| Reserve token | `0x54C5eE811cC0be3FCF66CBb8104900bB3A44b44a` (`dETH`) |
| Neutron | `0xd991f9103C26B199bF98F87400da9F181c2AfBc1` (`USD`) |
| Proton | `0xda5406D2721173c3548B3f191178eB9e96396A00` (`pETH`) |
| Treasury | `0x167F6b56DA92400f5e25d02CA0532Ddf2e25da63` |
| Gluon-EVM source commit | `b29fe82f6896bc36dce0fe61d4eb8a2a2a7ef0f6` |
| WebUI config commit | `55c87b973c8ce8545a995922e0e830788c772ca3` |

### Deployment Transactions

- Factory deployment:
  `0xfd3ed93f7e9295b418ad0bf4ec8678b50b5d421fb24cbae5ebe55ff7db182458`
- Reactor deployment:
  `0x5da971ec083f2f3301233f8a1d8ac229ee5360331aae4b591afc7ae07e05907b`

### Initial Verified Reactor State

- Vault: `Sepolia Orb ETH Reactor`
- Base price: `30 USD/dETH`
- Initial reserve: `1 dETH`
- Reserve ratio: `150%`
- Critical reserve ratio: `100%`
- Fission fee: `0%`
- Fusion fee: `0%`
- Initial Neutron supply: `20 USD`
- Initial Proton supply: approximately `0.33333333333333334 pETH`

### WebUI Smoke Test

The deployment was exercised through the actual WebUI with MetaMask on Sepolia.

Approval:

- Approved `0.1 dETH` to the Reactor.
- Transaction:
  `0x7337e79f9af05b0db70c233d2a4e342c1c7bb6c24af8446ecd65062730c717be`

Fission:

- Input: `0.1 dETH`
- Output: `2 USD` + approximately `0.033333333 pETH`
- Transaction:
  `0xb7d0de724d60f3f476425bbece82dc8b9a82c376ee72e743bc3507983d7f5c9f`

Fusion:

- Burned: `0.5 USD` + approximately `0.008333333 pETH`
- Output: `0.025 dETH`
- Transaction:
  `0xcca4cf9d9b36063903edd5cfc1c20fc649327b193724c056484cc9036e411649`

Final verified state after the smoke test:

- Reserve: `1.075 dETH`
- Reserve ratio: `150%`
- Base price: `30 USD/dETH`
- Neutron supply: `21.5 USD`
- Proton supply: approximately `0.3583 pETH`

Verified live path:

    Orb Oracle
        ↓
    StableCoinReactor
        ↓
    WebUI
        ↓
    MetaMask
        ↓
    Fission + Fusion

This is a Sepolia test deployment and is not declared production.

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
