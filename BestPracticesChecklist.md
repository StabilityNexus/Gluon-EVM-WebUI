# AOSSIE Best Practices Checklist

> Criteria adapted from the [OpenSSF Best Practices Badge](https://github.com/coreinfrastructure/best-practices-badge)
> (MIT / CC BY 3.0) by OpenSSF contributors. Modified for AOSSIE multi-repo template use.
> **Purpose:** Covers OpenSSF Best Practices criteria that are NOT auto-detected by OpenSSF Scorecard.
> Scorecard already handles: License, SAST tools, CI tests, Security Policy file, Branch Protection,
> Pinned Dependencies, Signed Releases, Maintained status, and Known Vulnerabilities.
>
> **How to use:**
> 1. Fill in checkboxes below — tick `[x]` for Met, leave `[ ]` for Unmet, use `[~]` for N/A
> 2. Add a brief note or URL after each item as evidence
> 3. Run the checklist-score workflow to update the badge automatically
>
> **Legend:**
> - 🔴 MUST — Required for passing
> - 🟡 SHOULD — Required unless documented rationale given
> - 🔵 SUGGESTED — Optional but recommended
> - ⚪ N/A — Mark `[~]` if not applicable, add justification

---

<!-- checklist-score:start -->
## Score Summary

| Category | Met | Total | Status |
|---|---:|---:|:---:|
| Basics | 8 | 8 | ✅ |
| Change Control | 6 | 6 | ✅ |
| Reporting | 8 | 8 | ✅ |
| Quality | 11 | 11 | ✅ |
| Security | 9 | 9 | ✅ |
| Analysis | 6 | 7 | 🟡 |
| **Total** | **48** | **49** | **98%** |

_Generated from the checklist entries below. `[x]` is met, `[~]` is documented N/A, and `[ ]` remains unmet._
<!-- checklist-score:end -->

---

## 🏗️ Basics

### Project Website & Documentation

- [x] 🔴 **description_good** — The project README clearly describes what the software does and what problem it solves.
  - *Evidence URL:* [README.md](README.md)

- [x] 🔴 **interact** — The project provides information on how to obtain the software, submit bug reports, and contribute.
  - *Evidence URL:* [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md)

- [x] 🔴 **contribution** — `CONTRIBUTING.md` explains the contribution process.
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md)

- [x] 🟡 **contribution_requirements** — Contribution requirements include tests, type checking, linting, accessibility checks, and review expectations.
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md)

- [x] 🔴 **documentation_basics** — Basic project documentation exists.
  - *Evidence URL:* [README.md](README.md)

- [x] 🔴 **documentation_interface** — WebUI configuration and browser/contract interaction boundaries are documented.
  - *Evidence URL:* [README.md](README.md), [`utils/`](utils/), and [`utils/abi/`](utils/abi/)

### Other Basics

- [x] 🔴 **discussion** — The project has a searchable, URL-addressable public discussion mechanism.
  - *Evidence URL:* [GitHub Issues](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues)

- [x] 🟡 **english** — Documentation, source comments, issues, and contribution guidelines are maintained in English.

---

## 🔄 Change Control

### Version Control

- [x] 🔵 **repo_distributed** — Project uses a distributed VCS.
  - *Evidence URL:* [Gluon-EVM WebUI GitHub Repository](https://github.com/StabilityNexus/Gluon-EVM-WebUI)

### Version Numbering

- [~] 🔴 **version_unique** — Each release has a unique version identifier.
  - *Justification:* Gluon-EVM WebUI is under active development and does not yet publish formal versioned releases.

- [~] 🔵 **version_semver** — Project uses SemVer or CalVer.
  - *Justification:* Not applicable until formal releases are introduced.

- [~] 🔵 **version_tags** — Releases are tagged in version control.
  - *Justification:* Not applicable until formal releases are introduced.

### Release Notes

- [~] 🔴 **release_notes** — Each release includes human-readable release notes.
  - *Justification:* Gluon-EVM WebUI does not currently publish formal releases.

- [~] 🔴 **release_notes_vulns** — Release notes identify publicly known vulnerabilities fixed in that release.
  - *Justification:* Gluon-EVM WebUI does not currently publish formal releases.

---

## 🐛 Reporting

### Bug Reporting

- [x] 🔴 **report_process** — A bug-reporting process exists.
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md) and [GitHub Issues](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues)

- [x] 🟡 **report_tracker** — GitHub Issues are used to track individual bugs.
  - *Evidence URL:* [GitHub Issues](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues)

- [x] 🔴 **report_responses** — A majority of qualifying bug reports in the required historical window have documented acknowledgement.
  - *Evidence:* Maintainer responses are documented on [#11](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues/11) and [#13](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues/13).

- [x] 🟡 **enhancement_responses** — More than 50% of qualifying enhancement requests in the required historical window have documented responses.
  - *Evidence:* Maintainer responses are documented on [#22](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues/22), [#24](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues/24), and [#25](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues/25).

- [x] 🔴 **report_archive** — Reports and responses are publicly archived and searchable.
  - *Evidence URL:* [GitHub Issues](https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues)

### Vulnerability Reporting

- [x] 🔴 **vulnerability_report_process** — A vulnerability reporting process is documented.
  - *Evidence URL:* [SECURITY.md](SECURITY.md)

- [x] 🟡 **vulnerability_report_private** — Private vulnerability reporting through maintainers is documented.
  - *Evidence URL:* [SECURITY.md](SECURITY.md) and [MAINTAINERS.md](MAINTAINERS.md)

- [~] 🔴 **vulnerability_report_response** — Initial response to qualifying vulnerability reports is within the required time.
  - *Justification:* No qualifying vulnerability-report response-time evidence is currently available.

---

## ✅ Quality

### Build System

- [x] 🔴 **build** — A working build system exists that can rebuild the WebUI from source.
  - *Evidence:* `npm run build`

- [x] 🔵 **build_common_tools** — Common build tools are used.
  - *Evidence:* npm, Next.js, and TypeScript.

- [x] 🟡 **build_floss_tools** — The project can be built using open-source tools.

### Automated Testing

- [x] 🔵 **test_invocation** — The test suite can be invoked using a standard command.
  - *Evidence:* `npm test`

- [x] 🔵 **test_most** — Automated coverage is measured and coverage thresholds are enforced.
  - *Evidence:* `npm run test:coverage` and `vitest.config.ts`

### New Functionality Testing Policy

- [x] 🔴 **test_policy** — The project documents expectations for testing new functionality.
  - *Evidence:* [CONTRIBUTING.md](CONTRIBUTING.md)

- [x] 🔴 **tests_are_added** — Automated unit/component tests exist and run in CI.
  - *Evidence:* [`tests/`](tests/) and `.github/workflows/ci.yml`

- [x] 🔵 **tests_documented_added** — Test expectations are documented in contribution instructions.
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md)

### Linting / Warning Flags

- [x] 🔴 **warnings** — ESLint and TypeScript checking are enabled.
  - *Evidence:* `npm run lint` and `npm run typecheck`

- [x] 🔴 **warnings_fixed** — CI treats ESLint warnings as failures.
  - *Evidence:* `eslint . --max-warnings=0`

- [x] 🔵 **warnings_strict** — Next.js Core Web Vitals linting and TypeScript validation are enabled.

---

## 🔐 Security

### Secure Development Knowledge

- [x] 🔴 **know_secure_design** — Project guidance documents secure frontend/Web3 design expectations.
  - *Evidence:* [SECURITY.md](SECURITY.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [AGENTS.md](AGENTS.md)

- [x] 🔴 **know_common_errors** — Common frontend/Web3 risks are documented.
  - *Evidence:* [SECURITY.md](SECURITY.md)

### Cryptography

- [~] 🔴 **crypto_published** — Only publicly reviewed cryptographic protocols are used by default.
  - *Justification:* The WebUI does not implement custom cryptographic algorithms.

- [~] 🟡 **crypto_call** — Established cryptographic/wallet libraries are used instead of custom crypto.
  - *Justification:* Wallets, wagmi, and viem provide the relevant browser/EVM interfaces.

- [~] 🔴 **crypto_working** — No broken custom cryptographic algorithms are used.
  - *Justification:* The WebUI does not implement custom cryptographic algorithms.

- [~] 🔴 **crypto_keylength** — Key lengths meet required minimums.
  - *Justification:* Key creation and management are handled by user wallets.

- [~] 🔴 **crypto_password_storage** — Passwords are stored using secure password hashing.
  - *Justification:* The WebUI does not implement password storage.

- [~] 🔴 **crypto_random** — Security-sensitive keys/nonces use a CSPRNG.
  - *Justification:* The WebUI does not generate wallet keys.

- [~] 🟡 **delivery_unsigned** — Cryptographic hashes are not retrieved insecurely over plain HTTP.
  - *Justification:* The WebUI does not implement an unsigned cryptographic-artifact delivery mechanism.

---

## 🔬 Analysis

### Static Code Analysis

- [x] 🔴 **static_analysis_fixed** — Confirmed findings from configured static/security checks are triaged rather than silently suppressed.
  - *Evidence:* TypeScript, ESLint, CodeQL, and dependency-security checks.

- [x] 🔵 **static_analysis_common_vulnerabilities** — CodeQL JavaScript/TypeScript analysis is configured.
  - *Evidence:* `.github/workflows/codeql.yml`

- [x] 🔵 **static_analysis_often** — Static checks run through CI and scheduled CodeQL analysis.
  - *Evidence:* `.github/workflows/ci.yml` and `.github/workflows/codeql.yml`

### Dynamic Code Analysis

- [ ] 🔵 **dynamic_analysis** — A dedicated dynamic Web security scanner is applied before major production releases.
  - *Note:* A dedicated dynamic-security process is not yet established.

- [x] 🔵 **dynamic_analysis_enable_assertions** — Automated testing runs with assertions enabled.
  - *Evidence:* Vitest and Testing Library tests under [`tests/`](tests/)

- [~] 🔴 **dynamic_analysis_fixed** — Confirmed medium+ dynamic-analysis findings are fixed in a timely manner.
  - *Justification:* A dedicated dynamic-security process is not yet established.

- [~] 🔵 **dynamic_analysis_unsafe** — Memory-safety tooling is used for memory-unsafe languages.
  - *Justification:* The WebUI uses TypeScript/JavaScript rather than C/C++.

---

## 📎 Project-Specific Notes

### WebUI / Web3 Notes

- The frontend is intended to remain fully static and deployable through GitHub Pages.
- Wallet and contract interactions occur directly from the browser.
- Deployed Gluon-EVM contracts are the protocol source of truth.
- EVM integer values should use `bigint`.
- Reserve-token decimals must not be assumed to be 18.
- Network and contract configuration should remain centralized.
- Production addresses must be maintainer-approved and documented.
- OrbOracle should only be shown as supported after a verified deployment is documented.
- End-to-end wallet-flow testing and dedicated dynamic Web security analysis remain production-readiness follow-ups.

---

*This checklist complements [OpenSSF Scorecard](https://scorecard.dev/) (auto-detected checks) and is
inspired by the [OpenSSF Best Practices Badge](https://www.bestpractices.dev/en/criteria/0) passing criteria.*
