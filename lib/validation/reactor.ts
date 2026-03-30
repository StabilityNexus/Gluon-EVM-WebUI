import { isAddress } from "viem";
import { z } from "zod";

const requiredTrimmedString = (label: string) =>
  z.string().trim().min(1, `${label} cannot be empty`);

const addressSchema = (label: string) =>
  requiredTrimmedString(label).refine((value) => isAddress(value), {
    message: `${label} must be a valid EVM address`,
  });

export const tokenConfigSchema = z.object({
  baseAssetName: requiredTrimmedString("Base asset name"),
  baseAssetSymbol: requiredTrimmedString("Base asset symbol"),
  peggedAssetName: requiredTrimmedString("Stable token name"),
  peggedAssetSymbol: requiredTrimmedString("Stable token symbol"),
  protonName: requiredTrimmedString("Proton token name"),
  protonSymbol: requiredTrimmedString("Proton token symbol"),
});

export const reactorConfigSchema = z.object({
  vaultName: requiredTrimmedString("Vault name"),
  baseToken: addressSchema("Base token"),
  oracleAddress: addressSchema("Oracle address"),
  priceId: z
    .string()
    .trim()
    .regex(/^0x[0-9a-fA-F]{64}$/, "Price feed ID must be a 32-byte hex value"),
  treasury: addressSchema("Treasury address"),
  criticalReserveRatio: z.coerce
    .number({ invalid_type_error: "Critical reserve ratio must be a number" })
    .min(100, "Critical reserve ratio must be at least 100%"),
});

export const createReactorSchema = reactorConfigSchema.merge(tokenConfigSchema);

export type CreateReactorFormValues = z.infer<typeof createReactorSchema>;
