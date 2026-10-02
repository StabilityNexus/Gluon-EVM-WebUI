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

  // These unresolved findings are already reviewed on the current dependency
  // baseline. They must be removed through tested framework/wallet migrations,
  // not through forced package-manager upgrades.
  const reviewedHighSeverity = {
    next: "critical",
    postcss: "high",
    ws: "high",
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

    const reviewedSeverity = reviewedHighSeverity[name]

    if (
      !reviewedSeverity ||
      severityRank[info.severity] >
        severityRank[reviewedSeverity]
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
      "\nNo new high/critical dependency packages beyond the reviewed baseline.",
    )
  }

  console.log(
    "\nReviewed baseline: next (critical), postcss (high), ws (high).",
  )
}
