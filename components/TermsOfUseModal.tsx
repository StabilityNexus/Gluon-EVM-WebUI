"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  TERMS_OF_USE_PAGE_URL,
  TERMS_OF_USE_URL,
} from "@/utils/termsOfUse"

interface TermsOfUseModalProps {
  isOpen: boolean
  required: boolean
  onClose: () => void
  onAccept: () => void
}

export default function TermsOfUseModal({
  isOpen,
  required,
  onClose,
  onAccept,
}: TermsOfUseModalProps) {
  const [termsText, setTermsText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAccepted, setIsAccepted] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const controller = new AbortController()

    setTermsText("")
    setError(null)
    setIsAccepted(false)
    setIsLoading(true)

    fetch(TERMS_OF_USE_URL, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load Terms of Use (${response.status})`)
        }

        return response.text()
      })
      .then((text) => {
        if (!controller.signal.aborted) {
          setTermsText(text)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            "Unable to load the Terms of Use. Please check your connection and try again.",
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !required) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, required, onClose])

  if (!isOpen) return null

  const termsLoaded = Boolean(termsText) && !isLoading && !error

  const handleAccept = () => {
    if (!isAccepted || !termsLoaded) return
    onAccept()
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (!required && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-of-use-title"
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-md)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
          <h2
            id="terms-of-use-title"
            className="text-lg font-semibold tracking-[-0.01em] text-foreground"
          >
            Terms of Use
          </h2>

          {!required && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Terms of Use"
              className="grid size-9 place-items-center rounded-lg text-2xl leading-none text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-7">
          <div
            role="region"
            aria-label="Terms of Use text"
            tabIndex={0}
            className="max-h-[50vh] min-h-64 overflow-y-auto rounded-xl border border-border bg-background p-4 text-sm leading-6 text-foreground/85"
          >
            {isLoading && (
              <p className="text-muted-foreground">Loading Terms of Use…</p>
            )}

            {error && (
              <div className="space-y-3">
                <p className="text-danger">{error}</p>
                <a
                  href={TERMS_OF_USE_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Open Terms of Use on GitHub
                </a>
              </div>
            )}

            {termsText && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-6 text-base font-semibold text-foreground">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-sm leading-7 text-foreground/85">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-5 list-disc space-y-1.5 pl-6 text-sm leading-7 text-foreground/85">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-5 list-decimal space-y-1.5 pl-6 text-sm leading-7 text-foreground/85">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="pl-1">
                      {children}
                    </li>
                  ),
                  hr: () => (
                    <hr className="my-7 border-border" />
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-5 border-l-2 border-foreground/25 pl-4 text-sm italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
                      {children}
                    </code>
                  ),
                  table: ({ children }) => (
                    <div className="my-5 overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-2 align-top">
                      {children}
                    </td>
                  ),
                }}
              >
                {termsText}
              </ReactMarkdown>
            )}
          </div>

          <a
            href={TERMS_OF_USE_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            View the official Terms of Use source
          </a>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={isAccepted}
              disabled={!termsLoaded}
              onChange={(event) => setIsAccepted(event.target.checked)}
              className="mt-1 size-4 shrink-0"
            />
            <span className="text-sm leading-6 text-foreground">
              I have carefully read and I accept the Terms of Use.
            </span>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!isAccepted || !termsLoaded}
              onClick={handleAccept}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Accept Terms of Use
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
