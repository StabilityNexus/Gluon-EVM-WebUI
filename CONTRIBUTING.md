# Contributing to Gluon-EVM WebUI

⭐ Thank you for considering contributing to Gluon-EVM WebUI! ⭐

Gluon-EVM WebUI is the frontend for the
[Gluon-EVM protocol](https://github.com/StabilityNexus/Gluon-EVM), developed under Stability Nexus.

We welcome useful bug fixes, tests, documentation improvements, accessibility work, wallet-flow
improvements, and focused Gluon integration changes.

---

## 🚨 Discord Communication Is Mandatory

**All project communication should happen on Discord. GitHub should primarily be used for issues,
code, and pull requests.**

Before beginning work:

- Join the [Stability Nexus Discord server](https://discord.gg/hjUhu33uAn)
- Discuss the issue or proposed change in the relevant Discord channel
- Post updates about your issue or pull request
- Ask questions when requirements are unclear

---

## 📋 Table of Contents

- [How Can I Contribute?](#-how-can-i-contribute)
- [Coding with AI](#-coding-with-ai)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Testing Your Changes](#-testing-your-changes)
- [Pull Request Guidelines](#-pull-request-guidelines)
- [Frontend Code Guidelines](#-frontend-code-guidelines)
- [Web3 and Oracle Guidelines](#-web3-and-oracle-guidelines)
- [Static Deployment Guidelines](#-static-deployment-guidelines)
- [Documentation Guidelines](#-documentation-guidelines)
- [Security](#-security)
- [Community Guidelines](#-community-guidelines)

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before opening a bug report, search existing issues and pull requests to avoid duplicates.

A useful bug report should include:

- affected page or component
- tested commit or branch
- browser and operating system
- connected wallet
- chain/network
- relevant reactor/contract address
- steps to reproduce
- expected behavior
- actual behavior
- console or transaction error when useful
- screenshots or recordings for visible defects

Do not publicly report vulnerabilities that could affect users, wallets, or deployed contracts.
Follow [SECURITY.md](SECURITY.md).

### Suggesting Features

Before proposing a feature:

- search existing issues and pull requests
- discuss the idea on Discord
- explain the user problem
- identify the affected frontend/contract boundary
- explain whether any protocol change is required
- keep the proposal focused

Large architecture changes should not be implemented without maintainer agreement.

### Contributing Code

1. Create or identify a relevant issue or agreed task.
2. Discuss the scope when necessary.
3. Create a focused branch from the latest `main`.
4. Implement one improvement.
5. Add or update tests where appropriate.
6. Verify light/dark and responsive states for visible UI changes.
7. Run all required checks.
8. Open a pull request against `main`.
9. Add screenshots/recordings for visible UI work.
10. Share the pull request with maintainers on Discord.

---

## 🤖 Coding with AI

AI-assisted contributions are allowed.

Transparency is required.

Your pull request description should disclose:

- the AI tool/model used
- what the tool assisted with
- whether the suggestions were manually reviewed
- how the implementation was tested

Contributors remain responsible for every line they submit.

Do not submit generated code that you:

- do not understand
- have not reviewed
- have not tested
- cannot explain during review

Avoid unnecessary abstractions, duplicate helpers, speculative features, and unrelated refactors.

---

## 🚀 Getting Started

### Prerequisites

Install:

- [Git](https://git-scm.com/)
- [Node.js 20+](https://nodejs.org/)
- npm

Verify:

```bash
git --version
node --version
npm --version
```

### Fork the Repository

Fork:

```text
https://github.com/StabilityNexus/Gluon-EVM-WebUI
```

### Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/Gluon-EVM-WebUI.git
cd Gluon-EVM-WebUI
```

### Add the Upstream Repository

```bash
git remote add upstream https://github.com/StabilityNexus/Gluon-EVM-WebUI.git
```

### Install Dependencies

```bash
npm ci
```

### Browser-Safe Environment

```bash
cp .env.example .env.local
```

Anything prefixed with `NEXT_PUBLIC_` is exposed to browser users and must never contain a secret.

---

## 🔄 Development Workflow

### 1. Update Your Local Main Branch

```bash
git switch main
git fetch upstream
git pull --rebase upstream main
```

### 2. Create a New Branch

```bash
git switch -c feat/your-feature
```

Use descriptive branch prefixes:

```text
feat/
fix/
test/
docs/
refactor/
style/
chore/
ci/
```

### 3. Keep the Change Focused

Do not combine unrelated:

- bug fixes
- design changes
- dependency upgrades
- protocol changes
- formatting changes

### 4. Review the Diff

```bash
git status
git diff
git diff --check
```

### 5. Commit Your Changes

Use concise prefixed commit messages:

```text
feat: improve reactor interaction flow
fix: correct token decimal handling
test: cover oracle preflight
docs: align repository documentation
```

### 6. Rebase Before Pushing

```bash
git fetch upstream
git rebase upstream/main
```

### 7. Push Your Branch

```bash
git push -u origin your-branch-name
```

After rebasing an already-pushed branch:

```bash
git push --force-with-lease
```

---

## 🧪 Testing Your Changes

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Tests

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

### Accessibility

```bash
npm run test:a11y
```

### Dependency Security Triage

```bash
npm run security:audit
```

### Production Static Build

```bash
npm run build
```

The build must produce:

```text
out/
```

### Checklist Validation

```bash
npm run checklist:check
```

### Required Final Check

```bash
git diff --check
```

Do not hide failing tests or weaken checks simply to make CI pass.

---

## 📤 Pull Request Guidelines

### Before Submitting

Confirm that:

- [ ] The change addresses an agreed task
- [ ] The pull request targets `main`
- [ ] Only intended files changed
- [ ] Type checking passes
- [ ] ESLint passes with zero warnings
- [ ] Automated tests pass
- [ ] Coverage passes
- [ ] Accessibility checks pass
- [ ] Static production build passes
- [ ] `git diff --check` passes
- [ ] Light/dark behavior was checked when relevant
- [ ] Responsive behavior was checked when relevant
- [ ] Web3 error/rejection states were checked when relevant
- [ ] Screenshots/recordings are included for visible changes
- [ ] Documentation was updated where necessary
- [ ] AI usage was disclosed
- [ ] No secret was committed

### Responding to Review Feedback

When updating a pull request:

1. understand the requested change
2. make the smallest appropriate correction
3. rerun relevant checks
4. push to the same branch
5. reply with what changed

Avoid silently broadening the PR.

---

## 📝 Frontend Code Guidelines

- Reuse existing components and utilities.
- Avoid duplicated logic.
- Avoid unnecessary abstractions.
- Prefer useful TypeScript types instead of `any`.
- Use semantic and keyboard-accessible controls where practical.
- Preserve light and dark themes.
- Verify mobile, tablet, and desktop layouts.
- Use `bigint` for EVM integer values.
- Use viem parsing/formatting helpers for token values.
- Do not use JavaScript floating-point arithmetic for on-chain units.
- Do not assume reserve tokens use 18 decimals.
- Keep network and contract configuration centralized.

---

## 🔮 Web3 and Oracle Guidelines

Gluon-EVM contracts are the protocol source of truth.

The WebUI should:

- read deployed contract state instead of duplicating protocol accounting
- never invent production addresses
- handle disconnected wallet and wrong-network states
- handle user rejection, pending, confirmed, and reverted transactions
- show approvals accurately
- avoid unlimited approvals without explicit review
- use the oracle configured by the selected reactor
- avoid presenting development/mock data as production data

OrbOracle should only be shown as live after the corresponding deployment has been verified and
documented.

---

## 🌐 Static Deployment Guidelines

The intended deployment architecture is fully static and GitHub Pages compatible.

New changes must not require:

- Next.js API routes
- Server Actions
- runtime SSR
- middleware requiring a server runtime
- server-only secrets
- a separately deployed Gluon application backend

Wallet and EVM interactions must remain browser-side.

The production build must export static files to:

```text
out/
```

---

## 📚 Documentation Guidelines

Documentation should:

- follow the established repository format
- distinguish WebUI behavior from protocol behavior
- use verified deployment information
- avoid invented addresses
- mark development/test data clearly
- update deployment records when configuration changes
- include screenshots when UI behavior materially changes

---

## 🔐 Security

Do not publish exploitable security findings in a public issue.

Follow [SECURITY.md](SECURITY.md).

Never commit:

- wallet private keys
- seed phrases
- RPC secrets
- API secrets
- signing credentials

---

## 🌍 Community Guidelines

Communicate respectfully and keep technical discussion focused.

Use Discord for coordination and GitHub for durable code/review history.
