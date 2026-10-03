import type { CSSProperties } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import ReserveInstrument from "@/components/home/ReserveInstrument"
import HeroField from "@/components/home/HeroField"
import { TokenGlyph } from "@/components/home/TokenGlyph"
import ReactionFlows from "@/components/home/ReactionFlows"
import { GLUON_NETWORKS } from "@/utils/networks"

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties

function explorerAddressUrl(baseUrl: string | undefined, address: string) {
  if (!baseUrl) return null
  return `${baseUrl.replace(/\/$/, "")}/address/${address}`
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-x-clip">
        <HeroField />
        <div className="container-page grid min-h-[calc(100svh-5rem)] items-center gap-12 py-10 sm:gap-16 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10 lg:py-12 xl:gap-12">
          <div className="relative z-10 max-w-[38rem]">
            <h1 id="hero-title" className="type-display gluon-rise text-balance" style={delay(60)}>
              Fully crypto-backed stablecoins, pegged to anything.
            </h1>
            <p className="type-lead gluon-rise mt-6 max-w-[34rem] text-pretty text-muted-foreground" style={delay(160)}>
              Deploy a reactor that splits an ERC-20 reserve into two tokens: Neutron, a stablecoin, and
              Proton, which tokenizes the reserve surplus. Both stay fully backed by the base asset.
            </p>
            <div className="gluon-rise mt-10 flex flex-wrap items-center gap-3" style={delay(260)}>
              <Button asChild size="lg" className="max-sm:w-full">
                <Link href="/create">Create a stablecoin</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="max-sm:w-full">
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
                    The volatile residual token. It tokenizes the reserve surplus and captures changes in the
                    value remaining after the Neutron claim.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            <ReactionFlows />
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
              <Button asChild className="max-sm:w-full">
                <Link href="/create">Create a stablecoin</Link>
              </Button>
              <Button asChild variant="outline" className="max-sm:w-full">
                <Link href="/explorer">Explore reactors</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
                <h3 className="text-[15px] font-semibold text-foreground">Factory contracts</h3>
                <p className="text-sm text-muted-foreground">Testnets</p>
              </div>
              <ul className="divide-y divide-border">
                {GLUON_NETWORKS.map(({ chain, displayName, factoryAddress }) => {
                  const href = explorerAddressUrl(chain.blockExplorers?.default.url, factoryAddress)
                  const short = `${factoryAddress.slice(0, 6)}…${factoryAddress.slice(-4)}`
                  return (
                    <li key={chain.id} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
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
