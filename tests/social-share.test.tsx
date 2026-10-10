import React, { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import ShareModal from "@/components/ShareModal"
import Footer from "@/components/Footer"

function ShareExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Footer onTermsClick={() => {}} onShareClick={() => setOpen(true)} />
      <ShareModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}

async function openShare() {
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: "Share Gluon" }))
  await screen.findByRole("button", { name: "X" })
  return user
}

describe("AOSSIE social sharing", () => {
  beforeEach(() => {
    // jsdom does not implement native dialog modality; browser checks verify it.
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", "") } },
      close: { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open") } },
    })
    window.history.replaceState({}, "", "/")
    document.title = "Gluon"
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("uses one footer trigger and the official widget's platform controls", async () => {
    render(<ShareExample />)
    expect(screen.getAllByRole("button", { name: "Share Gluon" })).toHaveLength(1)
    await openShare()
    expect(screen.getByRole("dialog", { name: "Share Gluon" })).toBeInTheDocument()
    for (const platform of ["X", "LinkedIn", "Telegram", "WhatsApp", "Reddit", "Discord", "Email"]) {
      expect(screen.getByRole("button", { name: platform })).toBeInTheDocument()
    }
    expect(document.querySelector(".social-share-btn")).toBeNull()
    expect(document.querySelector(".gluon-social-share")).not.toHaveClass("dark", "light")
  })

  it("shares the current reactor query and refreshes it when reopened", async () => {
    window.history.replaceState({}, "", "/c?coin=0x123")
    render(<ShareExample />)
    const user = await openShare()
    expect(screen.getByRole("textbox", { name: "URL to share" })).toHaveValue(window.location.href)
    await user.click(screen.getByRole("button", { name: "Close sharing" }))
    window.history.replaceState({}, "", "/c?coin=0x456")
    await openShare()
    expect(screen.getByRole("textbox", { name: "URL to share" })).toHaveValue(window.location.href)
  })

  it("opens a share intent only after selecting a platform", async () => {
    const popup = vi.spyOn(window, "open").mockReturnValue(null)
    window.history.replaceState({}, "", "/explorer")
    render(<ShareExample />)
    const user = await openShare()
    expect(popup).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "LinkedIn" }))
    const shareUrl = new URL(popup.mock.calls[0][0] as string)
    expect(shareUrl.hostname).toBe("www.linkedin.com")
    expect(shareUrl.searchParams.get("url")).toBe(window.location.href)
    expect(popup.mock.calls[0][2]).toContain("noopener,noreferrer")
  })

  it("copies the link and shows inline confirmation", async () => {
    render(<ShareExample />)
    const user = await openShare()
    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(await navigator.clipboard.readText()).toBe(window.location.href)
    expect(await screen.findByRole("button", { name: "Copied!" })).toHaveAttribute("aria-live", "polite")
  })

  it("restores focus and removes widget elements and scroll locking on close", async () => {
    const overflow = document.body.style.overflow
    render(<ShareExample />)
    const user = await openShare()
    expect(document.body.style.overflow).toBe("hidden")
    await user.click(screen.getByRole("button", { name: "Close sharing" }))
    expect(screen.getByRole("button", { name: "Share Gluon" })).toHaveFocus()
    expect(document.querySelector(".social-share-modal-overlay")).toBeNull()
    expect(document.body.style.overflow).toBe(overflow)
  })

  it("closes on Escape without leaving an orphan modal", async () => {
    render(<ShareExample />)
    const user = await openShare()
    await user.keyboard("{Escape}")
    expect(document.querySelector(".social-share-modal-overlay")).toBeNull()
    expect(screen.getByRole("button", { name: "Share Gluon" })).toHaveFocus()
  })

  it("does not create a widget after being unmounted during loading", async () => {
    const view = render(<ShareModal isOpen onClose={() => {}} />)
    view.unmount()
    await act(async () => { await Promise.resolve() })
    expect(document.querySelector(".social-share-modal-overlay")).toBeNull()
  })

  it("offers retry after a loading failure and creates only one widget", async () => {
    await import("@aossie-org/social-share-button")
    const constructor = vi.spyOn(window, "SocialShareButton").mockImplementation(function () {
      throw new Error("Unable to initialize share options")
    })
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<ShareExample />)
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Share Gluon" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Share options could not load.")
    expect(log).toHaveBeenCalled()
    constructor.mockRestore()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    await screen.findByRole("button", { name: "X" })
    expect(document.querySelectorAll(".social-share-modal-overlay")).toHaveLength(1)
  })

  it("has no detectable accessibility violations in the open dialog", async () => {
    render(<ShareExample />)
    await openShare()
    await waitFor(() => expect(document.querySelector(".gluon-social-share")).toBeInTheDocument())
    const result = await axe.run(screen.getByRole("dialog"), {
      rules: { "color-contrast": { enabled: false } },
    })
    expect(result.violations).toEqual([])
  })
})
