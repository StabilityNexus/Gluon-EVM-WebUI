import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeftRight, Info } from "lucide-react"
import { type TokenOption, allowedTargets } from "../interactionUtils"
import type { InteractionModel } from "../hooks/useReactorInteraction"

type ConversionInputsProps = {
  model: Pick<
    InteractionModel,
    | "nativeAsset"
    | "useNativeBase"
    | "baseSymbolText"
    | "fromBalanceDisplay"
    | "fromToken"
    | "setFromToken"
    | "disabledTokens"
    | "baseAssetName"
    | "neutronSymbolText"
    | "protonSymbolText"
    | "fromInputType"
    | "fromInputPlaceholder"
    | "fromInputValue"
    | "fromInputReadOnly"
    | "setAmount"
    | "renderMaxButton"
    | "handleMaxClick"
    | "toToken"
    | "setToToken"
    | "breakdownPopover"
    | "toLabel"
    | "bundleLabel"
    | "activeBaseSymbol"
    | "toInputType"
    | "toInputPlaceholder"
    | "toInputValue"
    | "toInputReadOnly"
  >
}

export function ConversionInputs({ model }: ConversionInputsProps) {
  const {
    nativeAsset,
    useNativeBase,
    baseSymbolText,
    fromBalanceDisplay,
    fromToken,
    setFromToken,
    disabledTokens,
    baseAssetName,
    neutronSymbolText,
    protonSymbolText,
    fromInputType,
    fromInputPlaceholder,
    fromInputValue,
    fromInputReadOnly,
    setAmount,
    renderMaxButton,
    handleMaxClick,
    toToken,
    setToToken,
    breakdownPopover,
    toLabel,
    bundleLabel,
    activeBaseSymbol,
    toInputType,
    toInputPlaceholder,
    toInputValue,
    toInputReadOnly,
  } = model

  return (
    <>
      <div className="space-y-3 rounded-xl border border-border bg-background p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>From</span>
          <span className="font-mono text-xs text-foreground/80">
            {fromBalanceDisplay}
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:h-14">
          <Select
            value={fromToken}
            onValueChange={(value) => setFromToken(value as TokenOption)}
          >
            <SelectTrigger className="h-12 sm:h-14 w-full sm:w-48 sm:flex-none bg-background/80">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASE" disabled={disabledTokens.BASE}>
                {useNativeBase && nativeAsset
                  ? `${nativeAsset.nativeSymbol} (native)`
                  : `${baseAssetName} (${baseSymbolText})`}
              </SelectItem>
              <SelectItem value="NEUTRON" disabled={disabledTokens.NEUTRON}>
                {neutronSymbolText}
              </SelectItem>
              <SelectItem value="PROTON" disabled={disabledTokens.PROTON}>
                {protonSymbolText}
              </SelectItem>
              <SelectItem value="BUNDLE" disabled={disabledTokens.BUNDLE}>
                {`${neutronSymbolText} + ${protonSymbolText}`}
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            type={fromInputType}
            placeholder={fromInputPlaceholder}
            value={fromInputValue}
            onChange={(event) => {
              if (fromInputReadOnly) return
              setAmount(event.target.value)
            }}
            readOnly={fromInputReadOnly}
            className="w-full sm:flex-1 sm:min-w-0 text-xl sm:text-2xl font-semibold h-12 sm:h-14 bg-background/60"
          />

          {renderMaxButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto h-12 sm:h-14 border-border hover:bg-muted"
              onClick={handleMaxClick}
            >
              Max
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          aria-label="Reverse conversion direction"
          className="size-11 rounded-full border border-border bg-background p-0 hover:bg-secondary"
          onClick={() => {
            const newFrom = toToken
            const newTo = allowedTargets[newFrom][0]
            setFromToken(newFrom)
            setToToken(newTo)
          }}
        >
          <ArrowLeftRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-background p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>To</span>
          <div className="flex items-center gap-2">
            {breakdownPopover && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-border p-1 text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-2 text-sm" align="end">
                  <p className="font-semibold text-foreground/90">
                    {breakdownPopover.title}
                  </p>
                  <div className="space-y-1 font-mono text-xs">
                    {breakdownPopover.rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-muted-foreground">
                          {row.label}
                        </span>
                        <span className="text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <span className="font-mono text-xs text-foreground/80">
              {toLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:h-14">
          <Select
            value={toToken}
            onValueChange={(value) => setToToken(value as TokenOption)}
          >
            <SelectTrigger className="h-12 sm:h-14 sm:w-52 sm:flex-none bg-background/80">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              {allowedTargets[fromToken].map((target) => (
                <SelectItem key={target} value={target}>
                  {target === "BUNDLE"
                    ? bundleLabel
                    : target === "BASE"
                      ? activeBaseSymbol
                      : target === "NEUTRON"
                        ? neutronSymbolText
                        : protonSymbolText}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type={toInputType}
            placeholder={toInputPlaceholder}
            value={toInputValue}
            onChange={(event) => {
              if (!toInputReadOnly) {
                setAmount(event.target.value)
              }
            }}
            readOnly={toInputReadOnly}
            className="w-full sm:flex-1 sm:min-w-0 text-xl sm:text-2xl font-semibold h-12 sm:h-14 bg-background/60"
          />
        </div>
      </div>
    </>
  )
}
