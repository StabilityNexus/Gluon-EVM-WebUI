import { Button } from "@/components/ui/button"
import type { InteractionModel } from "../hooks/useReactorInteraction"

type BaseAssetModeProps = {
  model: Pick<
    InteractionModel,
    | "nativeAsset"
    | "route"
    | "useNativeBase"
    | "baseSymbolText"
    | "setUseNativeBase"
  >
}

export function BaseAssetMode({ model }: BaseAssetModeProps) {
  const {
    nativeAsset,
    route,
    useNativeBase,
    baseSymbolText,
    setUseNativeBase,
  } = model

  return (
    <>
      {nativeAsset && (route === "FISSION" || route === "FUSION") && (
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Base asset mode
            </span>
            <span className="text-xs font-mono text-foreground/70">
              {useNativeBase ? nativeAsset.nativeSymbol : baseSymbolText}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={useNativeBase ? "outline" : "default"}
              aria-pressed={!useNativeBase}
              onClick={() => setUseNativeBase(false)}
            >
              {baseSymbolText}
            </Button>

            <Button
              type="button"
              variant={useNativeBase ? "default" : "outline"}
              aria-pressed={useNativeBase}
              onClick={() => setUseNativeBase(true)}
            >
              {nativeAsset.nativeSymbol} (native)
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
