"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { ShareInstance } from "@aossie-org/social-share-button"
import "@aossie-org/social-share-button/src/social-share-button.css"
import "@/styles/social-share.css"

type ShareModalProps = {
  isOpen: boolean
  onClose: () => void
}

/** Hosts the lazy-loaded AOSSIE widget in a native dialog and cleans it up on close. */
export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const retryRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (isOpen && failed) retryRef.current?.focus()
  }, [isOpen, failed])

  useEffect(() => {
    const dialog = dialogRef.current
    const container = containerRef.current
    if (!isOpen || !dialog || !container) return

    let cancelled = false
    let widget: ShareInstance | undefined
    const trigger = document.activeElement
    setReady(false)
    setFailed(false)
    dialog.showModal()

    // Load the pinned official library only when sharing is requested.
    import("@aossie-org/social-share-button")
      .then(() => {
        if (cancelled) return
        const SocialShareButton = window.SocialShareButton
        if (!SocialShareButton) throw new Error("Share library was not initialized")
        widget = new SocialShareButton({
          container,
          showButton: false,
          platforms: ["twitter", "linkedin", "telegram", "whatsapp", "reddit", "discord", "email"],
          description: "Explore Gluon, a decentralized stablecoin creation platform.",
          analytics: false,
        })

        const modal = widget.modal
        if (!modal) throw new Error("Share modal was not initialized")

        // Keep the library's UI and actions inside a native modal dialog so the
        // browser manages focus containment, background inertness, and Escape.
        // The widget's own "dark" class would override Gluon's light theme tokens.
        modal.classList.remove("dark", "light")
        modal.classList.add("gluon-social-share")
        container.appendChild(modal)
        widget.closeModal = () => onCloseRef.current()

        const title = modal.querySelector("h3")
        if (title) {
          title.id = titleId
          title.textContent = "Share Gluon"
        }
        modal.querySelectorAll("button").forEach((button) => {
          button.type = "button"
        })
        modal.querySelectorAll("svg").forEach((icon) => icon.setAttribute("aria-hidden", "true"))
        const closeButton = modal.querySelector<HTMLButtonElement>(".social-share-modal-close")
        closeButton?.setAttribute("aria-label", "Close sharing")
        const copyButton = modal.querySelector(".social-share-copy-btn")
        copyButton?.setAttribute("aria-live", "polite")

        widget.openModal()
        setReady(true)
        closeButton?.focus()
      })
      .catch((error) => {
        console.error("Social sharing error:", error)
        if (!cancelled) {
          widget?.destroy()
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
      widget?.destroy()
      dialog.close()
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [isOpen, attempt, titleId])

  return (
    <dialog
      ref={dialogRef}
      className="gluon-share-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      {!ready && isOpen && (
        <div className="gluon-share-loading">
          <div className="social-share-modal-content">
            <div className="social-share-modal-header">
              <h3 id={titleId}>Share Gluon</h3>
              <button
                type="button"
                className="social-share-modal-close"
                aria-label="Close sharing"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
            <div className="p-6 text-sm text-muted-foreground">
              <p role="status">{failed ? "Share options could not load." : "Loading share options…"}</p>
              {failed && (
                <button
                  type="button"
                  ref={retryRef}
                  className="social-share-copy-btn mt-4"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div ref={containerRef} />
    </dialog>
  )
}
