import fs from "node:fs"

const checklistPath = "BestPracticesChecklist.md"
const statusPath = "checklist-status.json"
const checkOnly = process.argv.includes("--check")

const categories = [
  {
    heading: "## 🏗️ Basics",
    key: "basics",
    label: "Basics",
  },
  {
    heading: "## 🔄 Change Control",
    key: "change_control",
    label: "Change Control",
  },
  {
    heading: "## 🐛 Reporting",
    key: "reporting",
    label: "Reporting",
  },
  {
    heading: "## ✅ Quality",
    key: "quality",
    label: "Quality",
  },
  {
    heading: "## 🔐 Security",
    key: "security",
    label: "Security",
  },
  {
    heading: "## 🔬 Analysis",
    key: "analysis",
    label: "Analysis",
  },
]

const source = fs.readFileSync(checklistPath, "utf8")
const lines = source.split(/\r?\n/)

const counts = Object.fromEntries(
  categories.map(({ key }) => [
    key,
    {
      met: 0,
      total: 0,
    },
  ]),
)

let currentCategory = null

for (const line of lines) {
  const trimmed = line.trim()

  const category = categories.find(
    ({ heading }) => trimmed === heading,
  )

  if (category) {
    currentCategory = category.key
    continue
  }

  if (
    trimmed.startsWith("## ") &&
    !category
  ) {
    currentCategory = null
  }

  const match = trimmed.match(/^- \[([xX~ ])\]/)

  if (!match || !currentCategory) {
    continue
  }

  counts[currentCategory].total += 1

  if (
    match[1].toLowerCase() === "x" ||
    match[1] === "~"
  ) {
    counts[currentCategory].met += 1
  }
}

const totalMet = Object.values(counts).reduce(
  (sum, category) => sum + category.met,
  0,
)

const total = Object.values(counts).reduce(
  (sum, category) => sum + category.total,
  0,
)

const percent =
  total === 0
    ? 0
    : Math.round((totalMet / total) * 100)

const color =
  percent >= 80
    ? "brightgreen"
    : percent >= 60
      ? "yellow"
      : percent >= 40
        ? "orange"
        : "red"

let existingStatus = null

if (checkOnly && fs.existsSync(statusPath)) {
  try {
    existingStatus = JSON.parse(
      fs.readFileSync(statusPath, "utf8"),
    )
  } catch {
    existingStatus = null
  }
}

const statusUpdated =
  checkOnly &&
  typeof existingStatus?.updated === "string"
    ? existingStatus.updated
    : new Date().toISOString().slice(0, 10)

const status = {
  schemaVersion: 1,
  label: "Best Practices",
  message: `${percent}%`,
  schema: "aossie-best-practices-v1",
  updated: statusUpdated,
  met: totalMet,
  total,
  percent,
  color,
  categories: Object.fromEntries(
    categories.map(({ key }) => [
      key,
      counts[key],
    ]),
  ),
}

function categoryEmoji({ met, total }) {
  if (total === 0) return "⚪"
  if (met === total) return "✅"
  if (met / total >= 0.5) return "🟡"
  return "🔴"
}

const tableLines = [
  "<!-- checklist-score:start -->",
  "## Score Summary",
  "",
  "| Category | Met | Total | Status |",
  "|---|---:|---:|:---:|",
]

for (const category of categories) {
  const value = counts[category.key]

  tableLines.push(
    `| ${category.label} | ${value.met} | ${value.total} | ${categoryEmoji(value)} |`,
  )
}

tableLines.push(
  `| **Total** | **${totalMet}** | **${total}** | **${percent}%** |`,
  "",
  "_Generated from the checklist entries below. `[x]` is met, `[~]` is documented N/A, and `[ ]` remains unmet._",
  "<!-- checklist-score:end -->",
)

const generatedBlock = tableLines.join("\n")

let expectedChecklist

const blockPattern =
  /<!-- checklist-score:start -->[\s\S]*?<!-- checklist-score:end -->/

if (blockPattern.test(source)) {
  expectedChecklist = source.replace(
    blockPattern,
    generatedBlock,
  )
} else {
  const firstHeadingEnd = source.indexOf("\n")

  if (firstHeadingEnd === -1) {
    expectedChecklist =
      `${source}\n\n${generatedBlock}\n`
  } else {
    expectedChecklist =
      `${source.slice(0, firstHeadingEnd + 1)}\n` +
      `${generatedBlock}\n\n` +
      `${source.slice(firstHeadingEnd + 1)}`
  }
}

const expectedStatus =
  `${JSON.stringify(status, null, 2)}\n`

if (checkOnly) {
  const actualStatus = fs.existsSync(statusPath)
    ? fs.readFileSync(statusPath, "utf8")
    : ""

  const checklistMatches =
    expectedChecklist === source

  const statusMatches =
    expectedStatus === actualStatus

  if (!checklistMatches) {
    console.error(
      "BestPracticesChecklist.md score block is out of date.",
    )
  }

  if (!statusMatches) {
    console.error(
      "checklist-status.json is out of date.",
    )
  }

  if (!checklistMatches || !statusMatches) {
    console.error(
      "Run: npm run checklist:update",
    )
    process.exitCode = 1
  } else {
    console.log(
      `Checklist status is current: ${totalMet}/${total} (${percent}%)`,
    )
  }
} else {
  fs.writeFileSync(
    checklistPath,
    expectedChecklist,
  )

  fs.writeFileSync(
    statusPath,
    expectedStatus,
  )

  console.log(
    `Updated checklist score: ${totalMet}/${total} (${percent}%)`,
  )
}
