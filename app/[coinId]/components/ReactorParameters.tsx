import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { shortenAddress, type InfoSection } from "../interactionUtils"

import { useClipboardCopy } from "../hooks/useClipboardCopy"

export function ReactorParameters({
  infoSections,
}: {
  infoSections: InfoSection[]
}) {
  const { copiedValue, handleCopy } = useClipboardCopy()
  return (
    <>
      {infoSections.length > 0 && (
        <div className="max-w-4xl mx-auto mt-16 sm:mt-24 lg:mt-40">
          <Card
            className="bg-background/50 border-white/40"
            style={{
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">
                Reactor Parameters
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Live configuration, oracle wiring, and treasury context for this
                vault.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {infoSections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-xl border border-white/20 bg-white/5 px-5 py-6 backdrop-blur-sm"
                >
                  <div className="flex min-h-[4rem] flex-col gap-1 border-b border-border/60 pb-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      {section.title}
                    </h3>
                    {section.description ? (
                      <p className="text-xs text-muted-foreground/80">
                        {section.description}
                      </p>
                    ) : null}
                  </div>
                  <dl className="divide-y divide-border/60">
                    {section.items.map((row) => {
                      const isCopyable = row.monospace && row.value !== "—"
                      const emphasisClasses = row.emphasize
                        ? "text-lg font-semibold tracking-tight"
                        : "text-sm"

                      return (
                        <div
                          key={`${section.title}-${row.label}`}
                          className="rounded-lg bg-white/[0.03] px-3 py-3"
                        >
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            {row.label}
                          </dt>
                          <dd
                            className={`mt-1 text-foreground ${emphasisClasses} ${
                              isCopyable ? "flex items-center gap-2" : ""
                            }`}
                          >
                            {isCopyable ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full border border-border bg-background hover:bg-muted"
                                  onClick={() => void handleCopy(row.value)}
                                >
                                  <Copy className="h-4 w-4" />
                                  <span className="sr-only">
                                    Copy {row.label}
                                  </span>
                                </Button>
                                <div className="flex flex-col">
                                  <span className="font-mono text-xs sm:text-sm">
                                    {shortenAddress(row.value)}
                                  </span>
                                  {copiedValue === row.value ? (
                                    <span className="text-xs text-muted-foreground">
                                      Copied
                                    </span>
                                  ) : null}
                                </div>
                              </>
                            ) : (
                              row.value
                            )}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </section>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
