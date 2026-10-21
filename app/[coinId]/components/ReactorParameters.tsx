import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy } from "lucide-react"
import { shortenAddress, type InfoSection } from "../interactionUtils"
import { useClipboardCopy } from "../hooks/useClipboardCopy"

export function ReactorParameters({ infoSections }: { infoSections: InfoSection[] }) {
  const { copiedValue, handleCopy } = useClipboardCopy()
  if (infoSections.length === 0) return null

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6" aria-label="Reactor parameters">
      <h2 className="text-base font-semibold">Reactor Parameters</h2>
      <Tabs defaultValue="0" className="mt-4 gap-4">
        <TabsList aria-label="Reactor parameter groups" className="grid h-auto w-full max-w-full grid-cols-2 gap-1 p-1 sm:flex sm:w-fit sm:flex-wrap">
          {infoSections.map((section, index) => (
            <TabsTrigger key={index} value={String(index)} className="h-10 min-w-0 px-2 text-xs sm:max-w-[18rem] sm:flex-none sm:px-4 sm:text-sm">
              <span className="truncate" title={section.title}>{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {infoSections.map((section, index) => (
          <TabsContent key={index} value={String(index)}>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {section.items.map((row) => (
                <div key={row.label} className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border py-3 text-sm">
                  <dt className="min-w-0 break-words text-muted-foreground">{row.label}</dt>
                  <dd className={`min-w-0 break-words text-right tabular-nums ${row.emphasize ? "font-semibold" : "font-medium"}`}>
                    {row.monospace && row.value !== "—" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm" title={row.value}>{shortenAddress(row.value)}</span>
                        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => void handleCopy(row.value)}>
                          <Copy aria-hidden="true" className="size-3.5" />
                          <span className="sr-only">Copy {row.label}</span>
                        </Button>
                        {copiedValue === row.value && <span role="status" className="text-xs text-muted-foreground">Copied</span>}
                      </span>
                    ) : row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
