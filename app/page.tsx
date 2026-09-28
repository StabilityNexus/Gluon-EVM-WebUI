import type { CSSProperties } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import ReserveInstrument from "@/components/home/ReserveInstrument"
import { TokenGlyph, TokenLabel, type TokenKind } from "@/components/home/TokenGlyph"
import { GLUON_NETWORKS } from "@/utils/networks"

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties

const reactions: {
  name: string
  from: TokenKind[]
  to: TokenKind[]
  description: string
}[] = [
  {
    name: "Fission",
    from: ["base"],
    to: ["neutron", "proton"],
    description: "Splits base tokens into Neutron and Proton.",
  },
  {
    name: "Fusion",
    from: ["neutron", "proton"],
    to: ["base"],
    description: "Merges Neutron and Proton back into base tokens.",
  },
  {
    name: "Transmute β⁺",
    from: ["proton"],
    to: ["neutron"],
    description: "Converts Proton into Neutron, with fees that adjust to the reserve balance.",
  },
  {
    name: "Transmute β⁻",
    from: ["neutron"],
    to: ["proton"],
    description: "Converts Neutron into Proton, with pricing driven by system health.",
  },
]

function Formula({ from, to }: { from: TokenKind[]; to: TokenKind[] }) {
  const side = (kinds: TokenKind[]) =>
    kinds.map((kind, index) => (
      <span key={kind} className="inline-flex items-center gap-2">
        {index > 0 && <span className="text-faint-foreground">+</span>}
        <TokenLabel kind={kind} />
      </span>
    ))

  return (
    <p className="flex flex-wrap items-center gap-2">
      {side(from)}
      <span className="sr-only">becomes</span>
      <ArrowRight aria-hidden="true" className="size-3.5 text-faint-foreground" />
      {side(to)}
    </p>
  )
}

function explorerAddressUrl(baseUrl: string | undefined, address: string) {
  if (!baseUrl) return null
  return `${baseUrl.replace(/\/$/, "")}/address/${address}`
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative">
        <div className="container-page grid min-h-[calc(100svh-4rem)] items-center gap-16 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:py-20">
          <div className="max-w-[38rem]">
            <h1 id="hero-title" className="type-display gluon-rise text-balance" style={delay(60)}>
              Fully crypto-backed stablecoins, pegged to anything.
            </h1>
            <p className="type-lead gluon-rise mt-6 max-w-[34rem] text-pretty text-muted-foreground" style={delay(160)}>
              Deploy a reactor that splits an ERC-20 reserve into two tokens: Neutron, a stablecoin, and
              Proton, which tokenizes the reserve surplus. Both stay fully backed by the base asset.
            </p>
            <div className="gluon-rise mt-10 flex flex-wrap items-center gap-3" style={delay(260)}>
              <Button asChild size="lg">
                <Link href="/create">Create a stablecoin</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/explorer">Explore reactors</Link>
              </Button>
            </div>
          </div>

          <div className="gluon-rise w-full lg:justify-self-end" style={delay(220)}>
            <ReserveInstrument />
          </div>
        </div>
      </section>

      {/* Mechanics */}
      <section id="how-it-works" aria-labelledby="mechanics-title" className="border-t border-border">
        <div className="container-page grid gap-14 py-24 sm:py-32 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 id="mechanics-title" className="type-title text-balance">
              Two tokens, one reserve.
            </h2>
            <p className="type-lead mt-5 max-w-md text-pretty text-muted-foreground">
              Every reactor is an autonomous, permissionless contract that holds a single base asset and
              issues two claims against it.
            </p>

            <div className="mt-12 space-y-8">
              <div className="flex gap-4">
                <TokenGlyph kind="neutron" className="mt-1.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Neutron</h3>
                  <p className="mt-1 max-w-sm text-pretty text-muted-foreground">
                    The stable token. Exposure to stability, pegged to the reactor&apos;s target asset.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TokenGlyph kind="proton" className="mt-1.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Proton</h3>
                  <p className="mt-1 max-w-sm text-pretty text-muted-foreground">
                    The leveraged yield token. It tokenizes the reserve surplus, giving leveraged volatility
                    and yield.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            <div className="rounded-2xl border border-border bg-card">
              <h3 className="border-b border-border px-6 py-4 text-[15px] font-semibold text-foreground">
                Reactions
              </h3>
              <ul className="divide-y divide-border">
                {reactions.map((reaction) => (
                  <li
                    key={reaction.name}
                    className="grid gap-3 px-6 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6"
                  >
                    <p className="font-medium text-foreground">{reaction.name}</p>
                    <div>
                      <Formula from={reaction.from} to={reaction.to} />
                      <p className="mt-2 text-sm text-pretty text-muted-foreground">{reaction.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Research */}
      <section aria-labelledby="research-title" className="border-t border-border">
        <div className="container-page grid items-center gap-12 py-24 sm:py-32 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <h2 id="research-title" className="type-title text-balance">
              Built on published research.
            </h2>
            <p className="type-lead mt-5 text-pretty text-muted-foreground">
              Gluon&apos;s settlement, oracle, and reserve controls follow the Stability Nexus research note on
              the Gluon dual-token design, published on IACR ePrint as 2025/1372.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <a href="https://eprint.iacr.org/2025/1372" target="_blank" rel="noopener noreferrer">
                Read the research note
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </div>

          <a
            href="https://eprint.iacr.org/2025/1372"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the Gluon research note on IACR ePrint"
            className="group block w-full max-w-md justify-self-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:justify-self-end"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                unoptimized
                loading="lazy"
                src="/GluonPaper.png"
                alt="First page of the Gluon research note"
                fill
                sizes="(min-width: 1024px) 28rem, 90vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
              />
            </div>
          </a>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Particles
            particleColors={["#ffffff", "#d9e2ff"]}
            particleCount={180}
            particleSpread={12}
            speed={0.08}
            particleBaseSize={80}
            moveParticlesOnHover
            alphaParticles={false}
            disableRotation={false}
            className="pointer-events-none w-full h-full"
          />
        </div>
      </section>

      {/* Deploy */}
      <section aria-labelledby="deploy-title" className="border-t border-border">
        <div className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 id="deploy-title" className="type-title text-balance">
              Deploy a reactor.
            </h2>
            <p className="type-lead mt-5 max-w-md text-pretty text-muted-foreground">
              Choose a base asset, connect a price oracle, and set the reserve policy. Reactors are created by
              a factory contract on each supported network.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/create">Create a stablecoin</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/explorer">Explore reactors</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-baseline justify-between gap-4 border-b border-border px-6 py-4">
                <h3 className="text-[15px] font-semibold text-foreground">Factory contracts</h3>
                <p className="text-sm text-muted-foreground">Testnets</p>
              </div>
              <ul className="divide-y divide-border">
                {GLUON_NETWORKS.map(({ chain, displayName, factoryAddress }) => {
                  const href = explorerAddressUrl(chain.blockExplorers?.default.url, factoryAddress)
                  const short = `${factoryAddress.slice(0, 6)}…${factoryAddress.slice(-4)}`
                  return (
                    <li key={chain.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <span className="text-sm font-medium text-foreground">{displayName}</span>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${displayName} factory ${factoryAddress} on block explorer`}
                          className="inline-flex items-center gap-1.5 rounded-md font-mono text-xs text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {short}
                          <ArrowUpRight aria-hidden="true" className="size-3.5" />
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">{short}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
