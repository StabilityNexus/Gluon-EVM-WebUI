import type { ReactNode } from "react"
import { createPageMetadata } from "@/utils/seo"

export const metadata = createPageMetadata(
  "explorer",
  "Reactor Explorer | Gluon",
  "Explore Gluon reactors on configured EVM networks and view their reserve assets, neutron tokens, and proton tokens.",
)

export default function ExplorerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
