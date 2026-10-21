import React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
vi.mock("@/components/home/HeroField", () => ({ default: () => null }))
vi.mock("@/components/home/ReserveInstrument", () => ({ default: () => null }))
vi.mock("@/components/home/ReactionFlows", () => ({ default: () => null }))
import HomePage from "@/app/page"

describe("Bruno's homepage wording", () => {
  it("preserves three heading lines, action order and verified research destinations", () => {
    render(<HomePage />)
    expect(
      Array.from(
        document.querySelectorAll("#hero-title > span"),
        (span) => span.textContent,
      ),
    ).toEqual([
      "Decentralized stablecoins,",
      "backed by cryptocurrencies,",
      "pegged to anything",
    ])
    const hero = document.querySelector(
      'section[aria-labelledby="hero-title"]',
    ) as HTMLElement
    expect(
      within(hero)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Explore Stablecoins", "Create a Stablecoin"])
    expect(
      screen.getByRole("link", { name: "See the Formal Proofs" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/StabilityNexus/Gluon-Formalization-Coq",
    )
    expect(
      screen.getByRole("link", {
        name: "Contact Us to have Gluon available on another chain",
      }),
    ).toHaveAttribute("href", "mailto:contact@stability.nexus")
    expect(screen.getAllByText("Not configured")).toHaveLength(6)
  })
})
