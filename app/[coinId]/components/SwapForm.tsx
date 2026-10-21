import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import type { InteractionModel } from "../hooks/useReactorInteraction"
import { BaseAssetMode } from "./BaseAssetMode"
import { ConversionInputs } from "./ConversionInputs"
import { SwapAction } from "./SwapAction"

type SwapFormProps = {
  model: InteractionModel
}

export function SwapForm({ model }: SwapFormProps) {
  const { swapDescription, recipient, setRecipient } = model

  return (
    <Card className="h-full gap-4 rounded-2xl border border-border bg-card py-5 sm:py-6">
      <CardHeader className="space-y-1 px-5 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Convert tokens
        </CardTitle>
        <p className="text-sm text-muted-foreground">{swapDescription}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 sm:px-6">
        <BaseAssetMode model={model} />
        <ConversionInputs model={model} />
        {model.minimumOutputText && (
          <p className="text-sm text-muted-foreground">{model.minimumOutputText}</p>
        )}

        <div className="mt-auto space-y-2">
          <label htmlFor="recipient-address" className="text-sm text-muted-foreground">
            Recipient Address
          </label>
          <Input
            id="recipient-address"
            placeholder="0x..."
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            className="font-mono text-sm bg-background/60"
          />
        </div>

        <SwapAction model={model} />
      </CardContent>
    </Card>
  )
}
