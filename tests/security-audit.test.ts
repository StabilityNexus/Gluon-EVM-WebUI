import { spawnSync } from "node:child_process"
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const script = join(process.cwd(), "scripts/security-audit.mjs")
const dirs: string[] = []

const advisory = (id: string, severity: string) => ({
  source: 1,
  name: id,
  severity,
  url: `https://github.com/advisories/${id}`,
})

type Finding = { severity: string; via: unknown[] }

// The approved state: @wagmi/connectors is high only through ws and zod.
const baseline = (): Record<string, Finding> => ({
  "@wagmi/connectors": {
    severity: "high",
    via: ["@walletconnect/ethereum-provider", "ws"],
  },
  "@walletconnect/ethereum-provider": { severity: "high", via: ["zod"] },
  ws: { severity: "high", via: [advisory("GHSA-96hv-2xvq-fx4p", "high")] },
  zod: { severity: "high", via: [advisory("GHSA-mrhx-c7xc-m3w5", "high")] },
})

function runAudit(vulnerabilities: Record<string, Finding>) {
  const dir = mkdtempSync(join(tmpdir(), "security-audit-"))
  dirs.push(dir)
  writeFileSync(
    join(dir, "audit.json"),
    JSON.stringify({ vulnerabilities, metadata: { vulnerabilities: {} } }),
  )
  writeFileSync(join(dir, "npm"), '#!/bin/sh\ncat "$(dirname "$0")/audit.json"\n')
  chmodSync(join(dir, "npm"), 0o755)
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
  })
  if (result.error) {
    throw result.error
  }
  return { status: result.status, output: result.stdout + result.stderr }
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe.skipIf(process.platform === "win32")("security audit exceptions", () => {
  it("accepts @wagmi/connectors through its approved advisories", () => {
    expect(runAudit(baseline()).status).toBe(0)
  })

  it("rejects a new advisory reaching @wagmi/connectors through a dependency", () => {
    const vulnerabilities = baseline()
    vulnerabilities["@walletconnect/ethereum-provider"].via.push(
      advisory("GHSA-new0-0000-0000", "high"),
    )
    const { status, output } = runAudit(vulnerabilities)
    expect(status).toBe(1)
    expect(output).toContain("unapproved advisory GHSA-new0-0000-0000")
  })

  it("follows dependency cycles without looping", () => {
    const vulnerabilities = baseline()
    vulnerabilities.zod.via.push("@wagmi/connectors")
    expect(runAudit(vulnerabilities).status).toBe(0)
  })

  it("rejects a high advisory on @wagmi/connectors itself", () => {
    const vulnerabilities = baseline()
    vulnerabilities["@wagmi/connectors"].via.push(
      advisory("GHSA-own0-0000-0000", "high"),
    )
    expect(runAudit(vulnerabilities).status).toBe(1)
  })

  it("ignores a moderate advisory like any other package", () => {
    const vulnerabilities = baseline()
    vulnerabilities["@wagmi/connectors"].via.push(
      advisory("GHSA-mod0-0000-0000", "moderate"),
    )
    expect(runAudit(vulnerabilities).status).toBe(0)
  })

  it("rejects the query-string chain removed in #75", () => {
    const { status, output } = runAudit({
      "query-string": { severity: "high", via: ["decode-uri-component"] },
      "decode-uri-component": {
        severity: "high",
        via: [advisory("GHSA-qr28-fpjm-wq7f", "high")],
      },
    })
    expect(status).toBe(1)
    expect(output).toContain("high: query-string")
    expect(output).toContain("high: decode-uri-component")
  })

  it("names an unapproved advisory that has no url by its title", () => {
    const vulnerabilities = baseline()
    vulnerabilities.ws.via.push({ severity: "high", title: "ws advisory without url" })
    const { status, output } = runAudit(vulnerabilities)
    expect(status).toBe(1)
    expect(output).toContain("unapproved advisory ws advisory without url")
  })
})
