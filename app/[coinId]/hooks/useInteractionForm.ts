import { useEffect, useMemo, useRef, useState } from "react"
import {
  type TokenOption,
  type SwapRoute,
  allowedTargets,
  routeMap,
} from "../interactionUtils"
import type { InteractionContext } from "./interactionTypes"

type InteractionFormInput = Pick<InteractionContext, "address">

export function useInteractionForm({ address }: InteractionFormInput) {
  const [fromToken, setFromToken] = useState<TokenOption>("BASE")
  const [toToken, setToToken] = useState<TokenOption>("BUNDLE")
  const [amount, setAmount] = useState("")
  const [useNativeBase, setUseNativeBase] = useState(false)
  const [recipient, setRecipient] = useState("")
  const recipientEdited = useRef(false)

  useEffect(() => {
    if (address && !recipientEdited.current) {
      setRecipient(address)
    }
  }, [address])

  const updateRecipient = (value: string) => {
    recipientEdited.current = true
    setRecipient(value)
  }

  useEffect(() => {
    const targets = allowedTargets[fromToken]
    if (!targets.includes(toToken)) {
      setToToken(targets[0])
    }
  }, [fromToken, toToken])

  const route: SwapRoute | null = useMemo(() => {
    const key = `${fromToken}->${toToken}`
    return routeMap[key] || null
  }, [fromToken, toToken])

  return {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    amount,
    setAmount,
    useNativeBase,
    setUseNativeBase,
    recipient,
    setRecipient: updateRecipient,
    route,
  }
}

export type InteractionForm = ReturnType<typeof useInteractionForm>
