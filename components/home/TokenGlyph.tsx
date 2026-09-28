import { cn } from "@/lib/utils"

export type TokenKind = "base" | "neutron" | "proton"

const labels: Record<TokenKind, string> = {
  base: "Base",
  neutron: "Neutron",
  proton: "Proton",
}

/** The three protocol tokens as one consistent mark: an outlined base, a gold Neutron, a red Proton. */
export function TokenGlyph({ kind, className }: { kind: TokenKind; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-3 shrink-0 rounded-full",
        kind === "base" && "border-[1.5px] border-foreground/70",
        kind === "neutron" && "bg-neutron",
        kind === "proton" && "bg-proton",
        className,
      )}
    />
  )
}

export function TokenLabel({ kind }: { kind: TokenKind }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground">
      <TokenGlyph kind={kind} />
      {labels[kind]}
    </span>
  )
}
