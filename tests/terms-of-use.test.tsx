import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TermsOfUseModal from "@/components/TermsOfUseModal"
import {
  getUtcDateKey,
  hasAcceptedTermsToday,
  markTermsAcceptedToday,
  TERMS_ACCEPTED_DATE_KEY,
} from "@/utils/termsOfUse"

describe("Terms of Use daily acceptance", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it("uses the UTC calendar day for acceptance", () => {
    const beforeMidnight = new Date("2026-10-03T23:59:59.000Z")
    const afterMidnight = new Date("2026-10-04T00:00:00.000Z")

    markTermsAcceptedToday(localStorage, beforeMidnight)

    expect(
      localStorage.getItem(TERMS_ACCEPTED_DATE_KEY),
    ).toBe("2026-10-03")

    expect(
      hasAcceptedTermsToday(localStorage, beforeMidnight),
    ).toBe(true)

    expect(
      hasAcceptedTermsToday(localStorage, afterMidnight),
    ).toBe(false)

    expect(getUtcDateKey(afterMidnight)).toBe("2026-10-04")
  })

  it("requires the checkbox before accepting the terms", async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          ok: true,
          text: async () =>
            "# Terms of Use\n\nVersion test\n\nThese are the terms.",
        } as Response
      }),
    )

    render(
      <TermsOfUseModal
        isOpen
        required
        onClose={() => {}}
        onAccept={onAccept}
      />,
    )

    expect(
      await screen.findByText(/Version test/),
    ).toBeInTheDocument()

    const acceptButton = screen.getByRole("button", {
      name: "Accept Terms of Use",
    })

    expect(acceptButton).toBeDisabled()

    await user.click(
      screen.getByLabelText(
        "I have carefully read and I accept the Terms of Use.",
      ),
    )

    expect(acceptButton).toBeEnabled()

    await user.click(acceptButton)

    expect(onAccept).toHaveBeenCalledOnce()
  })

  it("cannot dismiss a required daily modal without accepting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          ok: true,
          text: async () => "# Terms of Use\n\nVersion test",
        } as Response
      }),
    )

    render(
      <TermsOfUseModal
        isOpen
        required
        onClose={() => {}}
        onAccept={() => {}}
      />,
    )

    await screen.findByText(/Version test/)

    expect(
      screen.queryByRole("button", {
        name: "Close Terms of Use",
      }),
    ).not.toBeInTheDocument()
  })

  it("allows a footer-opened Terms modal to be closed", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          ok: true,
          text: async () => "# Terms of Use\n\nVersion test",
        } as Response
      }),
    )

    render(
      <TermsOfUseModal
        isOpen
        required={false}
        onClose={onClose}
        onAccept={() => {}}
      />,
    )

    await screen.findByText(/Version test/)

    await user.click(
      screen.getByRole("button", {
        name: "Close Terms of Use",
      }),
    )

    expect(onClose).toHaveBeenCalledOnce()
  })
})
