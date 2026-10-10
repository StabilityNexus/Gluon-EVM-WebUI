import { useState } from "react"
import { toast } from "sonner"

export function useClipboardCopy() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const handleCopy = async (value?: string) => {
    if (!value || value === "—") {
      toast.error("Nothing to copy")
      return
    }
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard unavailable in this environment")
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      toast.success("Copied to clipboard")
      setTimeout(() => {
        setCopiedValue((current) => (current === value ? null : current))
      }, 1800)
    } catch (error) {
      console.error("Copy failed:", error)
      toast.error("Failed to copy value")
    }
  }
  return { copiedValue, handleCopy }
}
