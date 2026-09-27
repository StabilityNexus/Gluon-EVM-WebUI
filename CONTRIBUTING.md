# Contributing to Gluon-EVM WebUI

This repository contains the frontend for the [Gluon-EVM protocol](https://github.com/StabilityNexus/Gluon-EVM).

## Communication
- Stability Nexus Discord: https://discord.gg/hjUhu33uAn
- Issues: https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues

Discuss large features or architecture changes with maintainers before implementation.

## Useful Contributions
- frontend bug fixes
- responsive UI improvements
- accessibility
- wallet-flow improvements
- Gluon-EVM contract integration
- explorer improvements
- transaction-state handling
- documentation
- testing
- performance and deployment improvements

## AI-Assisted Contributions
AI assistance is allowed, but contributors are responsible for every submitted change.

Disclose the tool/model used, what it assisted with, whether suggestions were manually reviewed, and how the change was validated.

Do not submit generated code you do not understand or cannot explain.

## Setup
```bash
git clone https://github.com/YOUR_USERNAME/Gluon-EVM-WebUI.git
cd Gluon-EVM-WebUI
npm ci
```

Local browser-safe environment example:
```text
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

Anything prefixed with `NEXT_PUBLIC_` is exposed to users. Never place secrets there.

## Validation
```bash
npx tsc --noEmit
npm run build
git diff --check
```

## Frontend Guidelines
- reuse shared components
- avoid duplicate logic and unnecessary abstractions
- avoid introducing `any` where a useful type exists
- use `bigint` for EVM integer values
- avoid JS floating-point arithmetic for token values
- preserve light/dark themes
- check mobile/tablet/desktop for visible changes
- use semantic and keyboard-accessible controls where practical

## Web3 Guidelines
- Gluon-EVM is the protocol source of truth
- never invent deployment addresses
- centralize deployment configuration
- handle wallet rejection and contract reverts clearly
- token approval UX must show what is being approved
- do not add unlimited approvals without explicit review

## OrbOracle
OrbOracle is planned. Do not present it as live until the protocol-side implementation is merged, a supported deployment exists, and its address/configuration is documented.

## PR Checklist
- [ ] one focused change
- [ ] only intended files changed
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `git diff --check` passes
- [ ] light/dark checked when relevant
- [ ] responsive states checked when relevant
- [ ] Web3 success/failure states checked when relevant
- [ ] screenshots/recordings included for visible changes
- [ ] documentation updated when behavior/config changes
- [ ] AI usage disclosed
- [ ] no secret committed
