import type { Metadata } from "next"
import type { ReactNode } from "react"

// The exported /c page needs a reactor query parameter and is not a landing page.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
}

export default function InteractionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
