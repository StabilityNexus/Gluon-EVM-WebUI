import { spawnSync } from "node:child_process"

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"

const result = spawnSync(
  npmCommand,
  ["audit", "--omit=dev", "--json"],
  {
    encoding: "utf8",
  },
)

let audit

try {
  audit = JSON.parse(result.stdout)
} catch {
  console.error("Unable to parse npm audit output.")
  if (result.stderr) {
    console.error(result.stderr.trim())
  }
  process.exitCode = 1
}

if (audit) {
  const counts = audit.metadata?.vulnerabilities ?? {}

  console.log("Production dependency audit")
  console.log("---------------------------")
  console.log(
    `total=${counts.total ?? "?"} ` +
      `critical=${counts.critical ?? 0} ` +
      `high=${counts.high ?? 0} ` +
      `moderate=${counts.moderate ?? 0} ` +
      `low=${counts.low ?? 0}`,
  )

  // Unresolved exceptions. The October 24, 2026 additions below were reported
  // with an unchanged package-lock.json; they are NOT security remediations.
  // Track and review them separately before accepting this baseline update.
  // Do not use forced package-manager upgrades to bypass this check.
  const recordedHighSeverity = {
    next: "critical",
    postcss: "high",
    ws: "high",
    // Unresolved transitive WalletConnect findings tracked in issue #75:
    // https://github.com/StabilityNexus/Gluon-EVM-WebUI/issues/75
    // These exceptions do NOT remediate the vulnerabilities.
    "@walletconnect/utils": "high",
    "decode-uri-component": "high",
    "query-string": "high",
    // Newly reported by the October 24, 2026 npm advisory database:
    "@reown/appkit": "high",
    "@reown/appkit-controllers": "high",
    "@reown/appkit-pay": "high",
    "@reown/appkit-scaffold-ui": "high",
    "@reown/appkit-ui": "high",
    "@reown/appkit-utils": "high",
    "@reown/appkit-wallet": "high",
    "@walletconnect/ethereum-provider": "high",
    abitype: "high",
    viem: "high",
    zod: "high",
  }

  const severityRank = {
    low: 0,
    moderate: 1,
    high: 2,
    critical: 3,
  }

  const unexpected = []

  for (const [name, info] of Object.entries(
    audit.vulnerabilities ?? {},
  )) {
    if (!["high", "critical"].includes(info.severity)) {
      continue
    }

    const recordedSeverity = recordedHighSeverity[name]

    if (
      !recordedSeverity ||
      severityRank[info.severity] >
        severityRank[recordedSeverity]
    ) {
      unexpected.push(`${info.severity}: ${name}`)
    }
  }

  if (unexpected.length > 0) {
    console.error("\nUnexpected high-severity findings:")
    for (const finding of unexpected) {
      console.error(`- ${finding}`)
    }
    process.exitCode = 1
  } else {
    console.log(
      "\nNo additional high/critical dependency packages beyond the recorded exceptions.",
    )
  }

  console.log(
    "\nUnresolved exceptions: next (critical), postcss (high), ws (high), " +
      "@reown/appkit family (high), @walletconnect/ethereum-provider (high), " +
      "abitype (high), viem (high), zod (high), " +
      "@walletconnect/utils (high), decode-uri-component (high), " +
      "query-string (high). Tracking: GitHub issue #75.",
  )
}
