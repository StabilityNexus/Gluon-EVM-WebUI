# AOSSIE Best Practices Checklist — Gluon-EVM WebUI

<!-- checklist-score:start -->
## Score Summary

| Category | Met | Total | Status |
|---|---:|---:|:---:|
| Basics | 8 | 8 | ✅ |
| Change Control | 6 | 6 | ✅ |
| Reporting | 6 | 8 | 🟡 |
| Quality | 11 | 11 | ✅ |
| Security | 9 | 9 | ✅ |
| Analysis | 6 | 7 | 🟡 |
| **Total** | **46** | **49** | **94%** |

_Generated from the checklist entries below. `[x]` is met, `[~]` is documented N/A, and `[ ]` remains unmet._
<!-- checklist-score:end -->


## Legend
- `[x]` met
- `[ ]` not yet met
- `[~]` not currently applicable

## 🏗️ Basics
- [x] README documents the project.
- [x] CONTRIBUTING.md exists.
- [x] SECURITY.md exists.
- [x] MAINTAINERS.md exists.
- [x] Deployments.md exists.
- [x] Public issue tracker exists.
- [x] Documentation is in English.
- [x] Development/build instructions exist.

## 🔄 Change Control
- [x] Git/GitHub is used.
- [~] Formal releases not started.
- [~] SemVer not yet applicable.
- [~] Release tags not yet applicable.
- [~] Release notes not yet applicable.
- [~] Release vulnerability notes not yet applicable.

## 🐛 Reporting
- [x] Bug-reporting path exists.
- [x] GitHub Issues are available.
- [ ] TODO: recent bug-response criterion still requires real maintainer acknowledgement. Recent labeled bug reports include #32 and #35; do not mark complete until qualifying responses exist.
- [ ] TODO: recent enhancement-response criterion still requires real maintainer acknowledgement. Enhancement issue #36 currently needs a qualifying response.
- [x] Reports are publicly archived.
- [x] Vulnerability-reporting process exists.
- [x] Private maintainer contact is documented.
- [~] No vulnerability response-time evidence yet.

## ✅ Quality
- [x] Next.js production build exists.
- [x] npm is used.
- [x] Open-source build tools are used.
- [x] Canonical frontend test command exists: `npm test` runs the Vitest suite.
- [x] Frontend coverage is enforced with `npm run test:coverage`; current measured coverage is 99.03% statements, 96.15% branches, 100% functions, and 99.03% lines for the targeted application logic.
- [x] Testing expectations are documented.
- [x] Automated unit/component tests exist under `tests/`; the current suite passes 20/20 tests.
- [x] TypeScript checking is available.
- [x] ESLint currently passes with zero warnings and zero errors.
- [x] Strict Next.js Core Web Vitals ESLint configuration is enabled and CI enforces zero warnings with `--max-warnings=0`.
- [x] Build-time TypeScript/ESLint error suppression has been removed; production builds perform real validation.

## 🔐 Security
- [x] Web3 security expectations documented.
- [x] Common frontend/Web3 risks documented.
- [~] No custom cryptographic algorithms.
- [~] Established wallet/EVM libraries handle cryptographic operations.
- [~] WebUI does not manage key lengths.
- [~] WebUI does not store passwords.
- [~] WebUI does not generate private keys.
- [~] WebUI does not implement custom artifact-signature delivery.
- [x] Browser-exposed environment variables are documented as public.

## 🔬 Analysis
- [x] Security/static-analysis triage is established through TypeScript, ESLint, CodeQL configuration, dependency audit review, and documented dependency-risk handling.
- [x] CodeQL JavaScript/TypeScript security analysis is configured in `.github/workflows/codeql.yml` using the `security-extended` query suite.
- [x] TypeScript static checking is available.
- [x] Production dependencies are reviewed by `npm run security:audit`; known high/critical baseline findings are explicitly triaged instead of force-upgraded.
- [x] Automated accessibility checks use axe-core and run through `npm run test:a11y` and CI.
- [x] Route First Load JS budgets are enforced by `scripts/check-performance.mjs` and run in CI.
- [ ] TODO: verify Scorecard and CodeQL workflow runs after this branch is pushed to GitHub. Configuration is present locally in `.github/workflows/scorecard.yml` and `.github/workflows/codeql.yml`.

## Current High-Priority Follow-Ups
1. automated component/unit tests
2. end-to-end wallet-flow tests
3. stricter linting
4. accessibility checks
5. dependency/security scanning
6. verified deployment registry
7. OrbOracle integration
8. removal of remaining mock/prototype data
