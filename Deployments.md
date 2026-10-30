# Gluon-EVM WebUI Deployments

This document records WebUI deployments and the Gluon-EVM contract deployments that the frontend
is configured to use.

## GitHub Pages Development Preview

- **Deployment type:** Static frontend development preview
- **URL:** https://evm.gluon.stability.nexus/
- **Repository:** `StabilityNexus/Gluon-EVM-WebUI`
- **Source branch:** `main`
- **Deployment workflow:** `.github/workflows/nextjs.yml`
- **Production status:** Not declared production

The current GitHub Pages site is a frontend development preview.

GitHub Pages serves this custom domain at its root. The Next.js export must use
empty `basePath` and `assetPrefix` values; `/Gluon-EVM-WebUI` is not a URL prefix
on this domain.

It does not imply that any displayed reactor, token, oracle, or contract address is a production
deployment.

## Configured Networks

The WebUI currently has verified Factory addresses configured for
Reactor creation on these six networks:

| Network | Chain ID | Network type |
|---|---:|---|
| Ethereum Classic | 61 | Mainnet |
| Ethereum | 1 | Mainnet |
| Polygon PoS | 137 | Mainnet |
| BNB Smart Chain | 56 | Mainnet |
| Base | 8453 | Mainnet |
| Ethereum Sepolia | 11155111 | Testnet |

Factory addresses and network metadata are centralized in
`utils/networks.ts`. Historical Sepolia test Reactor discovery
remains separately configured through `explorerFactoryAddress`.

Factory configuration does not imply audited or production-ready
Reactor operations on every network.

## Current Sepolia Test Factory

- **Deployment date:** 2026-10-19
- **Network:** Ethereum Sepolia (`11155111`)
- **Factory:** `0x56a8c79dE3d8e21Dc60e2679c4e296Ac8A4b9F50`
- **Deployer:** `0x167F6b56DA92400f5e25d02CA0532Ddf2e25da63`
- **Deployment transaction:** https://sepolia.etherscan.io/tx/0x6cf62c286461e2066b086314009f5962690f301e6b103c274dc2d5803373c148
- **Factory explorer:** https://sepolia.etherscan.io/address/0x56a8c79dE3d8e21Dc60e2679c4e296Ac8A4b9F50
- **Contract source:** [Gluon-EVM #62](https://github.com/StabilityNexus/Gluon-EVM/pull/62) at `b7b591a9a014b13b4539b403dc5d43b62e680782`, with [Gluon-EVM #63](https://github.com/StabilityNexus/Gluon-EVM/pull/63) commit `e39d0c9a73cff00b5cb6b19adf1b8becfa1d8599` applied locally.
- **Exact source tree:** `485c72d4f14c0f2e2c5ca8ecdf3c96238313456d`
- **WebUI factory configuration commit:** `bdc9da6`
- **Verification:** Successful receipt, expected deployer, and exact runtime bytecode match with the tested build.
- **Factory runtime size:** 23,936 bytes.
- **Contract validation:** 178 tests passed with 512 runs per fuzz test.

This is a Sepolia test deployment incorporating Gluon-EVM PRs #62 and #63, which
were pending at deployment time. The bytecode comparison does not claim explorer
source verification. This is not a mainnet deployment.

### Reactors Used for WebUI Testing

Both reactors use reserve token `0x54C5eE811cC0be3FCF66CBb8104900bB3A44b44a`
(`dETH`, 18 decimals). Their initial dev and dev fee receiver are
`0x86B8f920835015c0F1b697dBe0B8b150a986eCE5`, with a 0.1% dev fee.

| Item | Orb reactor | Chainlink reactor |
|---|---|---|
| Reactor | `0x0cd0C6f7a63F674A963B8DeaA6051a7f6666b94c` | `0x66ef27993c7a082a2d60e7e8836e6c695623c95a` |
| Oracle | `0xff2b1fca4aF0c9BCb576178e6989AA92819a0294` (direct Orb) | `0xf21077d705ff140e801288ffee1ff26b849f8d0f` (Chainlink adapter) |
| Neutron | `0x1C3b68De741DA1B713Ba601426E6457812B8AFb2` (`NORB`) | `0x7dF4BfB8A36cfD8Fe89860Bb14b26517a06f2C10` (`NCL`) |
| Proton | `0xfA66482f02b8958947F87Ed7796F97165Bbb0CE7` (`PORB`) | `0xCC3dC8f7999F6ebB8C51F07B02C6f08537e547f4` (`PCL`) |

The Chainlink adapter reads the Sepolia ETH/USD feed at
`0x694AA1769357215DE4FAC081bf1f309aDC325306`. Its feed address and WAD scaling
were checked on-chain.

Reactor creation transactions:

- Orb: https://sepolia.etherscan.io/tx/0xc350cc2c0dcba67e19a30d934cfb7ee83e1e92916e6a5164627bb7498b9d70a8
- Chainlink: https://sepolia.etherscan.io/tx/0x6d1757465966aacd4fac0979bff5ffcf74f758349a0c7691d003415cbf111b98

Creation, ERC-20 fission, fusion and both transmutation directions were exercised
through the local WebUI using MetaMask. Transaction notifications, input clearing
and balance refresh were also checked.

At Sepolia block `11948150`, the Orb reactor reserve was
`0.005794136558066680 dETH` and its reserve ratio was approximately `150.31%`.
The Chainlink reactor reserve was `0.005794138550635281 dETH` and its reserve
ratio was approximately `151.23%`. Both were inside their configured 120%–200%
operating range.

This factory was used by the October 19 local test configuration. It predates
deployer-selected initial ratios and factory-owned dev settings. It is not enabled
for creation by the current interface. Explorer uses it only to discover the existing
Sepolia test reactors. Deploy and verify a matching factory before enabling creation.

## Historical Sepolia Test Factory (2026-10-16)

- **Deployment date:** 2026-10-16
- **Network:** Ethereum Sepolia (`11155111`)
- **Factory:** `0x69554023440D59259689B91ede108435a11308c0`
- **Deployer:** `0x167F6b56DA92400f5e25d02CA0532Ddf2e25da63`
- **Gluon-EVM source commit:** `6fd98b16ed1a03a5d8d8209552b6dc39a9f88c6d`
- **Deployment transaction:** https://sepolia.etherscan.io/tx/0x83f1b2751d65794d964d56d0ee3534043fa3e8a2c5fd492f87857160cb0e0bcc
- **Factory explorer:** https://sepolia.etherscan.io/address/0x69554023440D59259689B91ede108435a11308c0
- **Verification:** Successful receipt; deployed runtime bytecode exactly matches the tested local build.
- **Reactor count when verified:** `0`

This factory supports deployment-time immutable beta settings. It was deployed
from merged contract code and does not include the pending unsigned-volume changes
in Gluon-EVM PR #56. It is a testnet deployment, not a production deployment.

The OrbOracle and Chainlink records below describe earlier deployments using a
different factory. Their reactors are not entries in this new factory's registry.
WebUI reactor creation and transaction testing against this factory remain pending.

## Ethereum Mainnet Factory (2026-10-28)

The WebUI uses this verified Factory for permissionless Reactor creation.

- **Network:** Ethereum Mainnet (chain ID 1)
- **Factory:** `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a`
- **Deployer:** `0x4924D0C5C26F8031df7713dEb6bb351B9Df03CDE`
- **Deployment block:** `26290845`
- **Transaction receipt:** [Etherscan](https://etherscan.io/tx/0x80437034864480b15e768ceb391a93dadbd06c2722435646747b9574c16e2960) (`status = 1`)
- **Verified source:** [StableCoinFactory on Etherscan](https://etherscan.io/address/0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a#code)
- **Source verification:** `forge verify-contract` returned `Pass - Verified`
- **Gluon-EVM source commit:** `d39081c3112fba0c22a1bb5dfc1ebb6a8f1d6f10`
- **Developer:** `0x86B8f920835015c0F1b697dBe0B8b150a986eCE5`
- **Developer fee:** `1000000000000000` WAD (0.1%)
- **WebUI configuration commit:** `43a2aa675c696749373101b9478373e170f4370d`

### FactoryABI compatibility

The deployed source revision's `src/StableCoinFactory.sol` defines
`deployReactor` with 17 parameters. Their types and ordering match
`utils/abi/Factory.ts` and the arguments submitted by `app/create/page.tsx`.

The Factory constructor accepts `(address,uint256)`. Its `dev()`,
`devFee()`, `getAllDeployedReactors()` and `getDeployedReactorsCount()`
interfaces also match the WebUI ABI.

### Mainnet status

The initial post-deployment check returned zero deployed Reactors.

No Ethereum Mainnet Reactor or Chainlink adapter deployment is recorded
here. The existing WebUI allows users to supply a compatible `IOracle`
or deploy a Chainlink adapter using their wallet.

Mainnet Reactor creation and real-funds interactions have not yet
been validated end-to-end through this WebUI.

Source verification is not an independent security audit.

## Polygon and Base Mainnet Factories (2026-10-29)

Both networks use the current `StableCoinFactory` interface.

- **Gluon-EVM source commit:** `d39081c3112fba0c22a1bb5dfc1ebb6a8f1d6f10`
- **Deployer:** `0x4924D0C5C26F8031df7713dEb6bb351B9Df03CDE`
- **Developer:** `0x86B8f920835015c0F1b697dBe0B8b150a986eCE5`
- **Developer fee:** `1000000000000000` WAD (0.1%)
- **Factory:** `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a`

| Network | Chain ID | Deployment transaction | Initial Reactors |
|---|---:|---|---:|
| Polygon PoS | 137 | [PolygonScan](https://polygonscan.com/tx/0xb328ca86884dd7ffcdabd79d7b9c9763aa61b9b782766f9410fb612852abe8f9) | 0 |
| Base | 8453 | [BaseScan](https://basescan.org/tx/0x9eb3050c1231d8b5f18d44793c02f2ee250a5e26c713c31d08593b4669d73833) | 0 |

### Verification

- Both Factory deployments returned successful receipts.
- Both contracts expose the expected developer and 0.1% developer fee.
- Both runtime contracts are 24,418 bytes.
- Runtime bytecode matches the Ethereum Mainnet Factory.
- Both Factory registries initially contain zero Reactors.
- Both chains have independent contracts and storage despite sharing the same address.

No Reactor, token pair, reserve deposit, or oracle adapter was deployed as part of these deployments.

PolygonScan source verification: [Pass - Verified](https://polygonscan.com/address/0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a#code) (2026-10-29).
BaseScan source verification: [Pass - Verified](https://basescan.org/address/0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a#code) (2026-10-29).
These Factory deployments do not establish production security or imply an external audit.

---

## Additional Verified Factories (2026-10-30)

The following Factory-only deployments use Gluon-EVM source commit
`d39081c3112fba0c22a1bb5dfc1ebb6a8f1d6f10`.

- **Deployer:** `0x4924D0C5C26F8031df7713dEb6bb351B9Df03CDE`
- **Developer:** `0x86B8f920835015c0F1b697dBe0B8b150a986eCE5`
- **Developer fee:** `1000000000000000` WAD (0.1%)
- **Initial Reactors:** Zero in each new Factory registry
- **Deployment scope:** Factory only; no Reactor or oracle adapter deployed

| Network | Chain ID | Verified Factory | Deployment transaction |
|---|---:|---|---|
| Ethereum Sepolia | 11155111 | `0x7e04a17f09EACa400c9CFca690C5a1859FE7DCD5` | [Sepolia Etherscan](https://sepolia.etherscan.io/tx/0xd5a1f6a65d59bd56a57d51aea1d5cbefb7ffe537529408688d5c8c3c9d935f88) |
| BNB Smart Chain | 56 | `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a` | [BscScan](https://bscscan.com/tx/0x1e798cd5160c59dd622232681fd487b1c09782245dfe8e009ed3ed4af382aea1) |
| Ethereum Classic | 61 | `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a` | [ETC Blockscout](https://etc.blockscout.com/tx/0x0ecd3a5490aaeb0e1db8a307ec4ab41a6a2f7be756acfce1417d89f5e4a82c40) |

### Source and Runtime Verification

- All three deployments returned successful transaction receipts.
- The Factory developer, 0.1% fee, runtime and initial Reactor
  registry were checked independently on-chain.
- Sepolia and BSC use the Osaka-targeted Solidity 0.8.30 build,
  with 24,418-byte runtime.
- Ethereum Classic uses Solidity 0.8.30 targeting Shanghai,
  via-IR and 200 optimizer runs, with 24,560-byte runtime.
- Their Solidity source and constructor configuration are the same,
  but ETC runtime bytecode is different.
- Explorer source verification passed for all three:
  [Sepolia](https://sepolia.etherscan.io/address/0x7e04a17f09EACa400c9CFca690C5a1859FE7DCD5#code),
  [BSC](https://bscscan.com/address/0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a#code),
  [ETC](https://etc.blockscout.com/address/0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a).

Sepolia's historical Factory
`0x56a8c79dE3d8e21Dc60e2679c4e296Ac8A4b9F50`
remains configured for discovering previous test Reactors.
The new Sepolia Factory is used for Reactor creation. Both
registries are read separately in the explorer.

These deployments do not establish an independent security audit
or end-to-end Reactor testing on all networks.

---

## Production Gluon-EVM Integration

Verified Factory addresses are configured on the supported networks
below. Factory deployment alone is not a production-readiness claim.

| Network | Factory | Status |
|---|---|---|
| Ethereum Mainnet (1) | `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a` | Factory configured; production readiness not asserted |
| Polygon PoS (137) | `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a` | Factory configured; 0 Reactors at deployment |
| Base Mainnet (8453) | `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a` | Factory configured; 0 Reactors at deployment |
| BNB Smart Chain (56) | `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a` | Factory configured; 0 Reactors at deployment |
| Ethereum Classic (61) | `0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a` | Factory configured; Shanghai build; 0 Reactors at deployment |
| Ethereum Sepolia (11155111) | `0x7e04a17f09EACa400c9CFca690C5a1859FE7DCD5` | Testnet Factory configured; historical discovery preserved |

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
- Factory reserve approval:
  `0xcbd29046d6b164df6d0734fa182a5639038262c09ce1c5600be4fea0a69c9493`
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

## Chainlink Sepolia

A verified Chainlink-backed Gluon deployment is also available on Ethereum Sepolia for
development and end-to-end testing.

This deployment uses the Chainlink ETH/USD Sepolia feed through a newly deployed
`ChainlinkToOracleAdapter`, which satisfies Gluon's `IOracle` interface.

| Item | Verified value |
|---|---|
| Network | Ethereum Sepolia |
| Chain ID | `11155111` |
| Deployment type | Testnet / development |
| Factory | `0x3Ca248b434DF95F20fc6469393D2e242243C47C6` |
| Reactor | `0x09d45F9F3d99c04cB4AD2f7F3EAB524b5eA65e9e` |
| Chainlink ETH/USD feed | `0x694AA1769357215DE4FAC081bf1f309aDC325306` |
| Chainlink adapter | `0x245FecC8457D98181164A74DB548B351D49ef20F` |
| Reserve token | `0x54C5eE811cC0be3FCF66CBb8104900bB3A44b44a` (`dETH`) |
| Neutron | `0x005f0E9c4b33EB6844a9eDd10315296f6f938Bd3` (`USD`) |
| Proton | `0xE414a847e82789C424b46D569E7aa94323220483` (`PETH`) |
| Treasury | `0xb9e9770Bd713b1dB125039A0C49B38074D4FE43B` |
| Gluon-EVM source commit | `b29fe82f6896bc36dce0fe61d4eb8a2a2a7ef0f6` |
| WebUI deployment-flow commit | `801628b931151e24432166eca2c3b2ddcc200409` |

### Chainlink Deployment Transactions

- Adapter deployment:
  `0x72ef28b804402eeba096095704ddfd6cc78eadc49ccf2685e2e9484442c736a7`
- Factory reserve approval:
  `0x984947eb6aa7cb57fad6dc12d58e5b8d5e9b6c3323e012eab1fc4325c5806a0d`
- Reactor deployment:
  `0xe53bfba5405be59d8144f7981cdd181f3619b93c421729f5368b052054518f22`

### Initial Chainlink Reactor State

- Vault: `Sepolia Chainlink ETH Reactor`
- Initial reserve: `0.1 dETH`
- Base price at deployment: approximately `2700.42100052 USD/dETH`
- Reserve ratio: `150%`
- Critical reserve ratio: `100%`
- Fission fee: `0%`
- Fusion fee: `0%`
- Initial Neutron supply: approximately `180.028066701333333333 USD`
- Initial Proton supply: approximately `0.033333333333333393 PETH`

### Chainlink WebUI Smoke Test

The deployment was exercised through the actual WebUI with MetaMask on Sepolia.

Fission approval:

- Approved `0.01 dETH` to the Chainlink Reactor.
- Transaction:
  `0x078c050ca3158350564f3768bb9bc27ea3efa18fcc4a507f0b77a4d7ba0111cc`

Fission:

- Input: `0.01 dETH`
- Output: approximately `18.0028 USD` + `0.003333333 PETH`
- Transaction:
  `0x3cc1d7aad66be7928b6d441c6f17c65784a0d0c88b5b9621271f8a5364f336d7`

Fusion:

- Burned: approximately `9.001403 USD` + `0.001666667 PETH`
- Output: `0.005 dETH`
- Transaction:
  `0x13e03dfea53392c1c9de1f70203938ce8d1dd0e6153445f7572852b3f9c55f22`

Final verified state after the smoke test:

- Reserve: `0.105 dETH`
- Reserve ratio: `150%`
- Base price: `2700.42100052 USD/dETH`
- Neutron supply: `189.0294700364 USD`
- Proton supply: approximately `0.035000000000000063 PETH`

This confirms the live test path:

    Chainlink ETH/USD Feed
        ↓
    ChainlinkToOracleAdapter
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

## Separate dev fee interface

The older factories at `0x69554023440D59259689B91ede108435a11308c0` and
`0x3Ca248b434DF95F20fc6469393D2e242243C47C6` predate the separate dev fee
interface and remain historical records. The October 19 Sepolia factory recorded
above supports the historical 18-argument deployment interface. Its receipt and
runtime bytecode were verified for that build. The current 17-argument creation
interface requires a new deployment; historical bytecode verification does not
establish compatibility.
