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
    <Card className="rounded-2xl border border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Swap Anywhere, Anytime
        </CardTitle>
        <p className="text-sm text-muted-foreground">{swapDescription}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <BaseAssetMode model={model} />
        <ConversionInputs model={model} />

        <div className="space-y-2">
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
