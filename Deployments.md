# Gluon-EVM WebUI Deployments

This document records WebUI deployments and the Gluon-EVM contract deployments that the frontend is configured to use.

## WebUI Deployment

### GitHub Pages Development Preview

| Field | Value |
| --- | --- |
| Status | Development preview |
| URL | https://stabilitynexus.github.io/Gluon-EVM-WebUI/ |
| Repository | `StabilityNexus/Gluon-EVM-WebUI` |
| Source branch | `main` |
| Deployment workflow | `.github/workflows/nextjs.yml` |
| Production status | Not declared production |

The current GitHub Pages site is a frontend development preview.

It does not imply that any displayed reactor, token, oracle, or contract address is a production deployment.

## Production Gluon-EVM Integration

No production Gluon reactor or production coin deployment is currently registered by this WebUI repository.

| Network | Chain ID | Factory | Reactor(s) | Oracle | Status |
| --- | ---: | --- | --- | --- | --- |
| TODO | TODO | TODO | TODO | TODO | Not configured |

The TODO values are intentional until a maintainer-approved deployment target exists.

## OrbOracle

OrbOracle is planned for the Gluon-EVM WebUI.

| Item | Status |
| --- | --- |
| Protocol-side OrbOracle integration | Pending / follow Gluon-EVM |
| Supported network | TODO |
| Oracle address | TODO |
| Reactor using OrbOracle | TODO |
| WebUI oracle display | TODO |

When available, record network, chain ID, factory, reactor, reserve token, Proton, Neutron, oracle implementation/address, explorer links, deployment transaction/hash, Gluon-EVM source commit/version, and WebUI config commit.

Do not fill missing values with guesses.
