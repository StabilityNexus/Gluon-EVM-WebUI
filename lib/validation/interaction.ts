import { isAddress, parseUnits } from "viem";
import { z } from "zod";

const decimalInputRegex = /^\d+(\.\d+)?$/;

export const interactionAmountSchema = z
  .string()
  .trim()
  .min(1, "Enter a valid amount")
  .refine((value) => decimalInputRegex.test(value), "Enter a valid amount")
  .refine((value) => Number(value) > 0, "Enter a valid amount");

export const interactionRecipientSchema = z
  .string()
  .trim()
  .refine((value) => isAddress(value), "Enter a valid recipient address");

export const interactionOracleTipSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || decimalInputRegex.test(value), {
    message: "Oracle tip must be a valid ETH amount",
  })
  .refine((value) => {
    if (!value) return true;
    try {
      parseUnits(value, 18);
      return true;
    } catch {
      return false;
    }
  }, "Oracle tip must be a valid ETH amount");

export const interactionInputSchema = z.object({
  amount: interactionAmountSchema,
  recipient: interactionRecipientSchema,
  oracleTip: interactionOracleTipSchema,
});

export const interactionReactorAddressSchema = z
  .string()
  .trim()
  .refine((value) => isAddress(value), "Invalid reactor address");
