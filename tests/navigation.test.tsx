import React from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

const mocks = vi.hoisted(() => ({ pathname: "/" }))
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }))
vi.mock("@/components/WalletButton", () => ({ WalletButton: () => null }))
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }))
import Navigation from "@/components/navigation"

describe("active navigation", () => {
  it.each([
    ["/", null],
    ["/create", "Create a Stablecoin"],
    ["/create.html", "Create a Stablecoin"],
    ["/explorer/", "Explore Stablecoins"],
    ["/c", "Explore Stablecoins"],
    ["/c.html", "Explore Stablecoins"],
    ["/0x1111111111111111111111111111111111111111", "Explore Stablecoins"],
  ] as const)("marks the current section on %s on desktop and mobile", (pathname, label) => {
    mocks.pathname = pathname
    const { container } = render(<Navigation />)
    const active = () => Array.from(container.querySelectorAll('a[aria-current="page"]'))
    expect(active()).toHaveLength(label ? 1 : 0)
    if (label) {
      expect(active()[0]).toHaveTextContent(label)
      expect(active()[0]).toHaveClass("bg-primary/10", "text-primary")
    }
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(active()).toHaveLength(label ? 2 : 0)
    for (const link of active()) expect(link).toHaveTextContent(label!)
  })
})
