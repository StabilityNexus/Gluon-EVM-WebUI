import fs from "node:fs"
import { spawnSync } from "node:child_process"

const budgets = {
  "/": 220,
  "/[coinId]": 450,
  "/create": 420,
  "/explorer": 250,
}

const suppliedLog = process.argv[2]

let output

if (suppliedLog) {
  if (fs.existsSync(suppliedLog)) {
    output = fs.readFileSync(suppliedLog, "utf8")
  } else {
    console.error(`Supplied build log does not exist: ${suppliedLog}`)
    process.exitCode = 1
    output = ""
  }
} else {
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "build"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NO_COLOR: "1",
      },
    },
  )

  output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
  process.stdout.write(output)

  if (result.status !== 0) {
    console.error("Cannot evaluate performance budget because the build failed.")
    process.exitCode = 1
  }
}

const cleanOutput = output.replace(
  // eslint-disable-next-line no-control-regex
  /\u001B\[[0-9;]*[A-Za-z]/g,
  "",
)

const measured = new Map()

for (const line of cleanOutput.split(/\r?\n/)) {
  const match = line.match(
    /[┌├└]\s+[○●]\s+(\/\S*)\s+[\d.]+\s+kB\s+([\d.]+)\s+kB/,
  )

  if (match) {
    measured.set(match[1], Number(match[2]))
  }
}

let failed = false

console.log("\nFirst Load JS performance budget")
console.log("--------------------------------")

for (const [route, limit] of Object.entries(budgets)) {
  const actual = measured.get(route)

  if (actual === undefined) {
    console.error(`${route}: measurement missing`)
    failed = true
    continue
  }

  const ok = actual <= limit

  console.log(
    `${route}: ${actual} kB / ${limit} kB ${ok ? "PASS" : "FAIL"}`,
  )

  if (!ok) {
    failed = true
  }
}

if (failed) {
  process.exitCode = 1
}
