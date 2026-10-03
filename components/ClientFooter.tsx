"use client"

import { useEffect, useState } from "react"
import Footer from "./Footer"
import ShareModal from "./ShareModal"
import TermsOfUseModal from "./TermsOfUseModal"
import {
  hasAcceptedTermsToday,
  markTermsAcceptedToday,
} from "@/utils/termsOfUse"

type TermsModalMode = "required" | "optional" | null

export default function ClientFooter() {
  const [termsModalMode, setTermsModalMode] =
    useState<TermsModalMode>(null)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    if (!hasAcceptedTermsToday(localStorage)) {
      setTermsModalMode("required")
    }
  }, [])

  const handleTermsClick = () => {
    setTermsModalMode("optional")
  }

  const handleTermsClose = () => {
    if (termsModalMode === "optional") {
      setTermsModalMode(null)
    }
  }

  const handleTermsAccept = () => {
    markTermsAcceptedToday(localStorage)
    setTermsModalMode(null)
  }

  const handleShareClick = () => {
    setIsShareModalOpen(true)
  }

  const handleShareClose = () => {
    setIsShareModalOpen(false)
  }

  return (
    <>
      <Footer
        onTermsClick={handleTermsClick}
        onShareClick={handleShareClick}
      />

      <TermsOfUseModal
        isOpen={termsModalMode !== null}
        required={termsModalMode === "required"}
        onClose={handleTermsClose}
        onAccept={handleTermsAccept}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareClose}
      />
    </>
  )
}
