import type { ReactNode } from "react"
import { createPageMetadata } from "@/utils/seo"

export const metadata = createPageMetadata(
  "create",
  "Create a Reactor | Gluon",
  "Configure a Gluon reactor's reserve asset, oracle, treasury, and fees, then deploy it through a configured factory using your wallet.",
)

export default function CreateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
