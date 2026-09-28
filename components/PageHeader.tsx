import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Shared header for app routes (Explorer, Create, Reactor). */
export function PageHeader({
  title,
  description,
  meta,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  className?: string
}) {
  return (
    <header className={cn("mb-10 text-center sm:mb-12", className)}>
      <h1 className="type-heading text-balance text-foreground">{title}</h1>
      {description && (
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {description}
        </p>
      )}
      {meta && <div className="mt-4 flex justify-center">{meta}</div>}
    </header>
  )
}
