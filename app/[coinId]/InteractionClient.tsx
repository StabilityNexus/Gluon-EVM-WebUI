"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  Copy,
  Info,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import LightRays from "@/components/LightRays";
import Shuffle from "@/components/Shuffle";
import { StableCoinReactorABI, ERC20ABI } from "@/utils/abi/StableCoin";
import { PythABI } from "@/utils/abi/Pyth";
import {
  interactionAmountSchema,
  interactionInputSchema,
  interactionReactorAddressSchema,
} from "@/lib/validation/interaction";
import { toast } from "sonner";

type TokenOption = "BASE" | "BUNDLE" | "NEUTRON" | "PROTON";
type SwapRoute =
  | "FISSION"
  | "FUSION"
  | "PROTON_TO_NEUTRON"
  | "NEUTRON_TO_PROTON";
const allowedTargets: Record<TokenOption, TokenOption[]> = {
  BASE: ["BUNDLE"],
  BUNDLE: ["BASE"],
  NEUTRON: ["PROTON"],
  PROTON: ["NEUTRON"],
};

const routeMap: Record<string, SwapRoute> = {
  "BASE->BUNDLE": "FISSION",
  "BUNDLE->BASE": "FUSION",
  "PROTON->NEUTRON": "PROTON_TO_NEUTRON",
  "NEUTRON->PROTON": "NEUTRON_TO_PROTON",
};

const containerStyle = {
  fontFamily: "'Orbitron', 'Space Mono', 'Courier New', monospace",
  fontWeight: "500",
};

const formatPercentFromWad = (value?: bigint) => {
  if (!value) return "0.0%";
  const percent = Number(value) / 1e16;
  return `${percent.toFixed(1)}%`;
};

const formatFeeFromWad = (value?: bigint) => {
  if (!value) return "0.00%";
  return `${(Number(value) / 1e16).toFixed(2)}%`;
};

const trimFormattedAmount = (value: string, precision = 6) => {
  const [integer, fraction] = value.split(".");
  if (!fraction) return integer;
  const sliced = fraction.slice(0, precision).replace(/0+$/, "");
  return sliced.length ? `${integer}.${sliced}` : integer;
};

const formatBalance = (balance?: bigint, decimals?: number, precision = 4) => {
  if (balance === undefined || decimals === undefined) return "0";
  const formatted = formatUnits(balance, decimals);
  return trimFormattedAmount(formatted, precision);
};

const pow10 = (decimals: number) => BigInt(10) ** BigInt(decimals);

const safeParseUnits = (value: string, decimals?: number) => {
  if (decimals === undefined) return null;
  if (!value || Number(value) === 0) return BigInt(0);
  try {
    return parseUnits(value, decimals);
  } catch (error) {
    console.error("Failed to parse units:", error);
    return null;
  }
};

const shortenAddress = (value?: string, guard = 4) => {
  if (!value) return "—";
  if (value.length <= guard * 2 + 3) return value;
  return `${value.slice(0, guard + 2)}…${value.slice(-guard)}`;
};

const WAD = 10n ** 18n;
const PEGGED_ASSET_WAD = 10n ** 18n;

type PythPriceData = {
  price: number;
  expo: number;
  conf: number;
  publishTime: number;
};

const mulDiv = (a: bigint, b: bigint, denominator: bigint) => {
  if (denominator === 0n) return 0n;
  return (a * b) / denominator;
};

const scaleToWad = (value?: bigint, decimals?: number) => {
  if (value === undefined || decimals === undefined) return undefined;
  if (decimals === 0) return value * WAD;
  const scale = pow10(decimals);
  return scale === 0n ? undefined : mulDiv(value, WAD, scale);
};

const pythPriceToWad = (
  priceData: PythPriceData | null,
): bigint | undefined => {
  if (!priceData) return undefined;
  const { price, expo } = priceData;
  if (price <= 0 || !Number.isFinite(price)) return undefined;
  const unsignedPrice = BigInt(Math.trunc(price));
  if (unsignedPrice <= 0n) return undefined;
  if (expo >= 0) {
    const scale = 10n ** BigInt(expo);
    return unsignedPrice * scale * WAD;
  }
  const scale = 10n ** BigInt(-expo);
  return scale === 0n ? undefined : (unsignedPrice * WAD) / scale;
};

const computeQWad = (
  reserveWad?: bigint,
  neutronSupplyWad?: bigint,
  basePriceWad?: bigint,
  criticalReserveRatio?: bigint,
): bigint | undefined => {
  if (
    reserveWad === undefined ||
    neutronSupplyWad === undefined ||
    basePriceWad === undefined ||
    basePriceWad === 0n
  ) {
    return undefined;
  }
  if (neutronSupplyWad === 0n) return 0n;

  const pStarBaseWad = mulDiv(WAD, WAD, basePriceWad);
  if (pStarBaseWad === 0n) return undefined;

  const denom = mulDiv(neutronSupplyWad, pStarBaseWad, WAD);
  if (denom === 0n) return undefined;

  const rWad = mulDiv(reserveWad, WAD, denom);
  const critical =
    criticalReserveRatio && criticalReserveRatio > 0n
      ? criticalReserveRatio
      : WAD;
  let rTilde = rWad;
  if (rWad <= critical) {
    const diff = critical > WAD ? critical - WAD : 0n;
    const rOverStar = mulDiv(rWad, WAD, critical === 0n ? WAD : critical);
    const part = mulDiv(rOverStar, diff, WAD);
    rTilde = WAD + part;
  }
  if (rTilde === 0n) return undefined;
  const q = mulDiv(WAD, WAD, rTilde);
  return q > WAD ? WAD : q;
};

type InfoRow = {
  label: string;
  value: string;
  monospace?: boolean;
  emphasize?: boolean;
};

type InfoSection = {
  title: string;
  description?: string;
  items: InfoRow[];
};

const formatTokenValue = (
  amount: bigint | null | undefined,
  decimals?: number,
  symbol?: string,
  precision = 6,
) => {
  if (amount === null || amount === undefined || decimals === undefined)
    return "—";
  const formatted = formatBalance(amount, decimals, precision);
  return symbol ? `${formatted} ${symbol}` : formatted;
};

const formatWad = (value?: bigint, precision = 4) => {
  if (value === undefined) return "—";
  const formatted = formatUnits(value, 18);
  return trimFormattedAmount(formatted, precision);
};

export default function InteractionClient({ coinId }: { coinId: string }) {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const reactorAddress = coinId === "c" ? searchParams.get("coin") : coinId;

  const [fromToken, setFromToken] = useState<TokenOption>("BASE");
  const [toToken, setToToken] = useState<TokenOption>("BUNDLE");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [hasSetDefaultRecipient, setHasSetDefaultRecipient] = useState(false);
  const [oracleTip, setOracleTip] = useState("");
  const [isOracleTipExpanded, setIsOracleTipExpanded] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isFetchingOracleUpdate, setIsFetchingOracleUpdate] = useState(false);
  const [pythPrice, setPythPrice] = useState<PythPriceData | null>(null);
  const [isLoadingPythPrice, setIsLoadingPythPrice] = useState(false);
  const [pythPriceError, setPythPriceError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (address && recipient === "" && !hasSetDefaultRecipient) {
      setRecipient(address);
      setHasSetDefaultRecipient(true);
    }
  }, [address, recipient, hasSetDefaultRecipient]);

  useEffect(() => {
    const targets = allowedTargets[fromToken];
    if (!targets.includes(toToken)) {
      setToToken(targets[0]);
    }
  }, [fromToken, toToken]);

  const route: SwapRoute | null = useMemo(() => {
    const key = `${fromToken}->${toToken}`;
    return routeMap[key] || null;
  }, [fromToken, toToken]);

  const reactorAddressValidation = useMemo(
    () => interactionReactorAddressSchema.safeParse(reactorAddress ?? ""),
    [reactorAddress],
  );
  const validatedReactorAddress = reactorAddressValidation.success
    ? (reactorAddressValidation.data as `0x${string}`)
    : undefined;

  const publicClient = usePublicClient();

  if (!reactorAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Reactor Address</h2>
          <p className="text-muted-foreground">
            Please provide a valid reactor address.
          </p>
        </div>
      </div>
    );
  }

  if (!validatedReactorAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid Reactor Address</h2>
          <p className="text-muted-foreground">
            Please provide a valid reactor contract address.
          </p>
        </div>
      </div>
    );
  }

  const { data: vaultName } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "vaultName",
  });

  const { data: oracleAddress } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "PYTH_ORACLE",
  });

  const { data: reactorPriceId } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "PRICE_ID",
  });

  useEffect(() => {
    if (!reactorPriceId) {
      setPythPrice(null);
      setPythPriceError("Price feed unavailable for this reactor");
      setIsLoadingPythPrice(false);
      return;
    }

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchPrice = async () => {
      setIsLoadingPythPrice(true);
      try {
        const response = await fetch("/api/pyth-price", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priceId: reactorPriceId }),
        });
        const payload = (await response.json().catch(() => ({}))) as
          | (PythPriceData & { error?: undefined })
          | { error?: string };

        if (!response.ok || !("price" in payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : `Pyth price request failed (${response.status})`,
          );
        }

        if (!isCancelled) {
          setPythPrice({
            price: payload.price,
            expo: payload.expo,
            conf: payload.conf,
            publishTime: payload.publishTime,
          });
          setPythPriceError(null);
        }
      } catch (error) {
        console.error("Failed to fetch Pyth price:", error);
        if (!isCancelled) {
          setPythPrice(null);
          setPythPriceError(
            error instanceof Error ? error.message : "Failed to fetch price",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPythPrice(false);
        }
      }
    };

    fetchPrice();
    intervalId = setInterval(fetchPrice, 15000);

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [reactorPriceId]);

  const { data: baseToken, refetch: refetchBaseToken } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "BASE_TOKEN",
  });

  const { data: baseAssetNameContract } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "baseAssetName",
  });

  const { data: baseAssetSymbolContract } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "baseAssetSymbol",
  });

  const { data: peggedAssetNameContract } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "peggedAssetName",
  });

  const { data: peggedAssetSymbolContract } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "peggedAssetSymbol",
  });

  const { data: neutronToken, refetch: refetchNeutronToken } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "NEUTRON_TOKEN",
  });

  const { data: protonToken, refetch: refetchProtonToken } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "PROTON_TOKEN",
  });

  const { data: treasury } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "TREASURY",
  });

  const { data: fissionFee, refetch: refetchFissionFee } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "FISSION_FEE",
  });

  const { data: fusionFee, refetch: refetchFusionFee } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "FUSION_FEE",
  });

  const { data: reserve, refetch: refetchReserve } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "reserve",
  });

  const { data: criticalReserveRatio } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "CRITICAL_RESERVE_RATIO",
  });

  const { data: onChainBasePriceWad } = useReadContract({
    address: validatedReactorAddress,
    abi: StableCoinReactorABI,
    functionName: "getBasePriceInPeggedAsset",
    query: {
      enabled: !!reactorAddress,
    },
  });

  const { data: neutronTotalSupply, refetch: refetchNeutronTotalSupply } =
    useReadContract({
      address: neutronToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "totalSupply",
      query: {
        enabled: !!neutronToken,
      },
    });

  const { data: protonTotalSupply, refetch: refetchProtonTotalSupply } =
    useReadContract({
      address: protonToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "totalSupply",
      query: {
        enabled: !!protonToken,
      },
    });

  const { data: baseDecimals } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "decimals",
    query: {
      enabled: !!baseToken,
    },
  });

  const { data: neutronDecimals } = useReadContract({
    address: neutronToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "decimals",
    query: {
      enabled: !!neutronToken,
    },
  });

  const { data: protonDecimals } = useReadContract({
    address: protonToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "decimals",
    query: {
      enabled: !!protonToken,
    },
  });

  const { data: baseSymbol } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "symbol",
    query: {
      enabled: !!baseToken,
    },
  });

  const { data: neutronSymbol } = useReadContract({
    address: neutronToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "symbol",
    query: {
      enabled: !!neutronToken,
    },
  });

  const { data: protonSymbol } = useReadContract({
    address: protonToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "symbol",
    query: {
      enabled: !!protonToken,
    },
  });

  const { data: baseBalance, refetch: refetchBaseBalance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!baseToken,
    },
  });

  const { data: neutronBalance, refetch: refetchNeutronBalance } =
    useReadContract({
      address: neutronToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
      query: {
        enabled: !!address && !!neutronToken,
      },
    });

  const { data: protonBalance, refetch: refetchProtonBalance } =
    useReadContract({
      address: protonToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
      query: {
        enabled: !!address && !!protonToken,
      },
    });

  const { data: baseAllowance, refetch: refetchBaseAllowance } =
    useReadContract({
      address: baseToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [address as `0x${string}`, validatedReactorAddress],
      query: {
        enabled: !!address && !!baseToken,
      },
    });

  const baseDecimalsNumber =
    typeof baseDecimals === "number" ? baseDecimals : undefined;
  const neutronDecimalsNumber =
    typeof neutronDecimals === "number"
      ? (neutronDecimals as number)
      : undefined;
  const protonDecimalsNumber =
    typeof protonDecimals === "number" ? (protonDecimals as number) : undefined;

  const reserveWad = useMemo(
    () => scaleToWad(reserve, baseDecimalsNumber),
    [reserve, baseDecimalsNumber],
  );
  const neutronSupplyWad = useMemo(
    () => scaleToWad(neutronTotalSupply, neutronDecimalsNumber),
    [neutronTotalSupply, neutronDecimalsNumber],
  );
  const protonSupplyWad = useMemo(
    () => scaleToWad(protonTotalSupply, protonDecimalsNumber),
    [protonTotalSupply, protonDecimalsNumber],
  );
  const basePriceWad = useMemo(() => {
    const fromPyth = pythPrice ? pythPriceToWad(pythPrice) : undefined;
    if (fromPyth && fromPyth > 0n) return fromPyth;
    if (typeof onChainBasePriceWad === "bigint" && onChainBasePriceWad > 0n) {
      return onChainBasePriceWad;
    }
    return undefined;
  }, [pythPrice, onChainBasePriceWad]);
  const qWad = useMemo(
    () =>
      computeQWad(
        reserveWad,
        neutronSupplyWad,
        basePriceWad,
        criticalReserveRatio,
      ),
    [reserveWad, neutronSupplyWad, basePriceWad, criticalReserveRatio],
  );
  const neutronPriceInBaseDerived = useMemo(() => {
    if (!reserveWad || reserveWad === 0n) return 0n;
    if (!basePriceWad || basePriceWad === 0n) return undefined;
    if (neutronTotalSupply === undefined || neutronDecimalsNumber === undefined)
      return undefined;
    if (neutronTotalSupply === 0n) {
      return mulDiv(PEGGED_ASSET_WAD, WAD, basePriceWad);
    }
    if (!neutronSupplyWad || neutronSupplyWad === 0n) return undefined;
    const q = qWad;
    if (q === undefined) return undefined;
    return mulDiv(q, reserveWad, neutronSupplyWad);
  }, [
    reserveWad,
    neutronSupplyWad,
    basePriceWad,
    neutronTotalSupply,
    neutronDecimalsNumber,
    qWad,
  ]);

  const protonPriceInBaseDerived = useMemo(() => {
    if (!reserveWad || !basePriceWad) return undefined;
    if (protonTotalSupply === undefined || protonDecimalsNumber === undefined)
      return undefined;
    if (protonTotalSupply === 0n) return WAD;
    if (!protonSupplyWad || protonSupplyWad === 0n) return undefined;
    const q = qWad;
    if (q === undefined) return undefined;
    const oneMinusQ = q >= WAD ? 0n : WAD - q;
    return mulDiv(oneMinusQ, reserveWad, protonSupplyWad);
  }, [
    reserveWad,
    protonSupplyWad,
    protonTotalSupply,
    protonDecimalsNumber,
    qWad,
    basePriceWad,
  ]);

  const neutronPricePeggedDerived = useMemo(() => {
    if (!basePriceWad || !neutronPriceInBaseDerived) return undefined;
    return mulDiv(neutronPriceInBaseDerived, basePriceWad, WAD);
  }, [basePriceWad, neutronPriceInBaseDerived]);

  const protonPricePeggedDerived = useMemo(() => {
    if (!basePriceWad || !protonPriceInBaseDerived) return undefined;
    return mulDiv(protonPriceInBaseDerived, basePriceWad, WAD);
  }, [basePriceWad, protonPriceInBaseDerived]);

  const reserveRatioDerived = useMemo(() => {
    if (!reserveWad) return undefined;
    if (!basePriceWad || basePriceWad === 0n) return undefined;
    if (!neutronSupplyWad) return undefined;
    if (reserveWad === 0n) return 0n;
    if (neutronSupplyWad === 0n) return undefined;
    const reserveValuePegged = mulDiv(reserveWad, basePriceWad, WAD);
    if (reserveValuePegged === 0n) return 0n;
    return mulDiv(reserveValuePegged, WAD, neutronSupplyWad);
  }, [reserveWad, basePriceWad, neutronSupplyWad]);

  const baseSymbolText =
    typeof baseSymbol === "string" && baseSymbol.length > 0
      ? baseSymbol
      : typeof baseAssetSymbolContract === "string" &&
          baseAssetSymbolContract.length > 0
        ? baseAssetSymbolContract
        : "BASE";
  const baseAssetName =
    typeof baseAssetNameContract === "string" &&
    baseAssetNameContract.length > 0
      ? baseAssetNameContract
      : baseSymbolText || "Base Asset";
  const peggedSymbolText =
    typeof peggedAssetSymbolContract === "string" &&
    peggedAssetSymbolContract.length > 0
      ? peggedAssetSymbolContract
      : "PEG";
  const peggedAssetName =
    typeof peggedAssetNameContract === "string" &&
    peggedAssetNameContract.length > 0
      ? peggedAssetNameContract
      : peggedSymbolText;
  const neutronSymbolText =
    typeof neutronSymbol === "string" ? neutronSymbol : "NEUTRON";
  const protonSymbolText =
    typeof protonSymbol === "string" ? protonSymbol : "PROTON";
  const neutronPriceInBase = neutronPriceInBaseDerived;
  const protonPriceInBase = protonPriceInBaseDerived;
  const neutronPricePegged = neutronPricePeggedDerived;
  const protonPricePegged = protonPricePeggedDerived;
  const reserveRatio = reserveRatioDerived;
  const basePricePegged = basePriceWad;
  const baseAssetDisplay = `${baseAssetName} (${baseSymbolText})`;
  const peggedAssetDisplay = `${peggedAssetName} (${peggedSymbolText})`;
  const fissionFeeText =
    typeof fissionFee === "bigint" ? formatPercentFromWad(fissionFee) : "—";
  const fusionFeeText =
    typeof fusionFee === "bigint" ? formatPercentFromWad(fusionFee) : "—";
  const basePricePeggedText =
    basePricePegged !== undefined
      ? `${formatWad(basePricePegged)} ${peggedSymbolText}/${baseSymbolText}`
      : isLoadingPythPrice
        ? "Loading…"
        : pythPriceError
          ? "Oracle unavailable"
          : "—";
  const reserveRatioText = (() => {
    if (reserve === undefined) return "—";
    if (reserve === 0n) return "0%";
    if (neutronTotalSupply !== undefined && neutronTotalSupply === 0n) {
      return "∞ (bootstrap)";
    }
    if (reserveRatio === undefined) {
      return isLoadingPythPrice
        ? "Loading…"
        : pythPriceError
          ? "Oracle unavailable"
          : "—";
    }
    return formatPercentFromWad(reserveRatio);
  })();
  const criticalRatioText = criticalReserveRatio
    ? formatPercentFromWad(criticalReserveRatio)
    : "—";

  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApproving,
  } = useWriteContract();
  const {
    data: fissionHash,
    writeContract: writeFission,
    isPending: isFissioning,
  } = useWriteContract();
  const {
    data: fusionHash,
    writeContract: writeFusion,
    isPending: isFusing,
  } = useWriteContract();
  const {
    data: protonToNeutronHash,
    writeContract: writeProtonToNeutron,
    isPending: isProtonToNeutronPending,
  } = useWriteContract();
  const {
    data: neutronToProtonHash,
    writeContract: writeNeutronToProton,
    isPending: isNeutronToProtonPending,
  } = useWriteContract();

  const { isLoading: isApprovingTx, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });
  const { isLoading: isFissionTx, isSuccess: isFissionSuccess } =
    useWaitForTransactionReceipt({
      hash: fissionHash,
    });
  const { isLoading: isFusionTx, isSuccess: isFusionSuccess } =
    useWaitForTransactionReceipt({
      hash: fusionHash,
    });
  const {
    isLoading: isProtonToNeutronTx,
    isSuccess: isProtonToNeutronSuccess,
  } = useWaitForTransactionReceipt({
    hash: protonToNeutronHash,
  });
  const {
    isLoading: isNeutronToProtonTx,
    isSuccess: isNeutronToProtonSuccess,
  } = useWaitForTransactionReceipt({
    hash: neutronToProtonHash,
  });

  useEffect(() => {
    if (
      isApproveSuccess ||
      isFissionSuccess ||
      isFusionSuccess ||
      isProtonToNeutronSuccess ||
      isNeutronToProtonSuccess
    ) {
      void refetchBaseBalance();
      void refetchNeutronBalance();
      void refetchProtonBalance();
      void refetchBaseAllowance();
      void refetchReserve();
      void refetchNeutronTotalSupply();
      void refetchProtonTotalSupply();
      void refetchFissionFee();
      void refetchFusionFee();
      void refetchBaseToken();
      void refetchNeutronToken();
      void refetchProtonToken();
      setAmount("");
      if (
        isFissionSuccess ||
        isProtonToNeutronSuccess ||
        isNeutronToProtonSuccess
      ) {
        setOracleTip("");
      }
    }
  }, [
    isApproveSuccess,
    isFissionSuccess,
    isFusionSuccess,
    isProtonToNeutronSuccess,
    isNeutronToProtonSuccess,
    refetchBaseBalance,
    refetchNeutronBalance,
    refetchProtonBalance,
    refetchBaseAllowance,
    refetchReserve,
    refetchNeutronTotalSupply,
    refetchProtonTotalSupply,
    refetchFissionFee,
    refetchFusionFee,
    refetchBaseToken,
    refetchNeutronToken,
    refetchProtonToken,
  ]);

  const vaultHeading =
    typeof vaultName === "string" && vaultName.length > 0
      ? `${vaultName} Reactor`
      : "StableCoin Reactor";

  useEffect(() => {
    if (isFissionSuccess) toast.success("Base converted into neutron + proton");
  }, [isFissionSuccess]);

  useEffect(() => {
    if (isFusionSuccess) toast.success("Neutron + proton redeemed for base");
  }, [isFusionSuccess]);

  useEffect(() => {
    if (isProtonToNeutronSuccess)
      toast.success("Proton successfully transmuted to neutron");
  }, [isProtonToNeutronSuccess]);

  useEffect(() => {
    if (isNeutronToProtonSuccess)
      toast.success("Neutron successfully transmuted to proton");
  }, [isNeutronToProtonSuccess]);

  const routeRequiresApproval = route === "FISSION";

  const parsedAmountForApproval = useMemo(() => {
    if (baseDecimalsNumber === undefined) return null;
    if (!amount) return null;
    return safeParseUnits(amount, baseDecimalsNumber);
  }, [amount, baseDecimalsNumber]);
  const needsApproval =
    routeRequiresApproval &&
    baseAllowance !== undefined &&
    parsedAmountForApproval !== null &&
    parsedAmountForApproval > (baseAllowance || BigInt(0));

  const isProcessing =
    isApproving ||
    isApprovingTx ||
    isFissioning ||
    isFissionTx ||
    isFusing ||
    isFusionTx ||
    isProtonToNeutronPending ||
    isProtonToNeutronTx ||
    isNeutronToProtonPending ||
    isNeutronToProtonTx ||
    isFetchingOracleUpdate;

  const fromLabel = useMemo(() => {
    switch (fromToken) {
      case "BASE":
        return baseSymbolText;
      case "NEUTRON":
        return neutronSymbolText;
      case "PROTON":
        return protonSymbolText;
      case "BUNDLE":
        return `${neutronSymbolText} + ${protonSymbolText}`;
      default:
        return "Token";
    }
  }, [fromToken, baseSymbolText, neutronSymbolText, protonSymbolText]);

  const toLabel = useMemo(() => {
    switch (toToken) {
      case "BASE":
        return baseSymbolText;
      case "NEUTRON":
        return neutronSymbolText;
      case "PROTON":
        return protonSymbolText;
      case "BUNDLE":
        return `${neutronSymbolText} + ${protonSymbolText}`;
      default:
        return "Token";
    }
  }, [toToken, baseSymbolText, neutronSymbolText, protonSymbolText]);

  const handleApprove = () => {
    if (!writeApprove || !baseToken) return;

    const amountValidation = interactionAmountSchema.safeParse(amount);
    if (!amountValidation.success) {
      setHasAttemptedSubmit(true);
      toast.error(
        amountValidation.error.issues[0]?.message ?? "Enter a valid amount",
      );
      return;
    }

    if (baseDecimalsNumber === undefined) {
      toast.error("Base token decimals not available");
      return;
    }
    const parsedAmount = parsedAmountForApproval;
    if (parsedAmount === null) {
      toast.error("Invalid amount for approval");
      return;
    }
    try {
      writeApprove({
        address: baseToken as `0x${string}`,
        abi: ERC20ABI,
        functionName: "approve",
        args: [
          validatedReactorAddress,
          parsedAmount === BigInt(0)
            ? parseUnits("1000000", baseDecimalsNumber)
            : parsedAmount,
        ],
      });
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve tokens");
    }
  };

  const handleSwap = async () => {
    setHasAttemptedSubmit(true);

    if (!route) {
      toast.error("Unsupported conversion path");
      return;
    }

    const validation = interactionInputSchema.safeParse({
      amount,
      recipient,
      oracleTip: shouldShowOracleTip ? oracleTip : "",
    });
    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message ??
          "Please fix the highlighted input errors",
      );
      return;
    }

    const validatedInput = validation.data;

    try {
      switch (route) {
        case "FISSION": {
          if (!baseDecimalsNumber) {
            toast.error("Base token decimals not available yet");
            return;
          }
          const parsed = safeParseUnits(
            validatedInput.amount,
            baseDecimalsNumber,
          );
          if (parsed === null) {
            toast.error("Invalid base amount");
            return;
          }

          let tipValue = 0n;
          if (shouldShowOracleTip) {
            const resolvedTip = resolveOracleTipValue(validatedInput.oracleTip);
            if (resolvedTip === null) return;
            tipValue = resolvedTip;
          }

          let updateData: `0x${string}`[] = [];

          if (tipValue > 0n) {
            try {
              const { updateData: payload, requiredFee } =
                await fetchOracleUpdatePayload();
              updateData = payload;
              if (requiredFee !== undefined && tipValue < requiredFee) {
                toast.error("Oracle tip is below the required Pyth fee");
                return;
              }
            } catch (error) {
              console.error("Failed to fetch oracle update data:", error);
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to fetch oracle update data",
              );
              return;
            }
          }

          if (tipValue === 0n && publicClient) {
            try {
              await publicClient.simulateContract({
                address: validatedReactorAddress,
                abi: StableCoinReactorABI,
                functionName: "fission",
                args: [parsed, validatedInput.recipient as `0x${string}`, []],
                value: 0n,
                account: address ? (address as `0x${string}`) : undefined,
              });
            } catch (simulationError) {
              console.error("Fission simulation failed:", simulationError);
              toast.error(
                shouldShowOracleTip
                  ? "Oracle price appears stale. Provide an oracle tip to refresh before splitting."
                  : "Oracle price appears stale. Please retry once the oracle updates.",
              );
              return;
            }
          }

          console.debug("Submitting fission", {
            vault: reactorAddress,
            baseAmount: parsed.toString(),
            recipient: validatedInput.recipient,
            oracleTip: tipValue.toString(),
            updateDataLength: updateData.length,
          });

          await writeFission({
            address: validatedReactorAddress,
            abi: StableCoinReactorABI,
            functionName: "fission",
            args: [
              parsed,
              validatedInput.recipient as `0x${string}`,
              updateData,
            ],
            value: tipValue,
          });
          break;
        }
        case "FUSION": {
          if (!baseDecimalsNumber) {
            toast.error("Base token decimals not available yet");
            return;
          }
          const parsed = safeParseUnits(
            validatedInput.amount,
            baseDecimalsNumber,
          );
          if (parsed === null) {
            toast.error("Invalid base amount");
            return;
          }
          await writeFusion({
            address: validatedReactorAddress,
            abi: StableCoinReactorABI,
            functionName: "fusion",
            args: [parsed, validatedInput.recipient as `0x${string}`],
          });
          break;
        }
        case "PROTON_TO_NEUTRON": {
          if (protonDecimalsNumber === undefined) {
            toast.error("Proton token decimals not available");
            return;
          }
          const parsed = safeParseUnits(
            validatedInput.amount,
            protonDecimalsNumber,
          );
          if (parsed === null) {
            toast.error("Invalid proton amount");
            return;
          }

          let tipValue = 0n;
          if (shouldShowOracleTip) {
            const resolvedTip = resolveOracleTipValue(validatedInput.oracleTip);
            if (resolvedTip === null) return;
            tipValue = resolvedTip;
          }

          let updateData: `0x${string}`[] = [];
          if (tipValue > 0n) {
            try {
              const { updateData: payload, requiredFee } =
                await fetchOracleUpdatePayload();
              updateData = payload;
              if (requiredFee !== undefined && tipValue < requiredFee) {
                toast.error("Oracle tip is below the required Pyth fee");
                return;
              }
            } catch (error) {
              console.error("Failed to fetch oracle update data:", error);
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to fetch oracle update data",
              );
              return;
            }
          }

          await writeProtonToNeutron({
            address: validatedReactorAddress,
            abi: StableCoinReactorABI,
            functionName: "transmuteProtonToNeutron",
            args: [
              parsed,
              validatedInput.recipient as `0x${string}`,
              updateData,
            ],
            value: tipValue,
          });
          break;
        }
        case "NEUTRON_TO_PROTON": {
          if (neutronDecimalsNumber === undefined) {
            toast.error("Neutron token decimals not available");
            return;
          }
          const parsed = safeParseUnits(
            validatedInput.amount,
            neutronDecimalsNumber,
          );
          if (parsed === null) {
            toast.error("Invalid neutron amount");
            return;
          }

          let tipValue = 0n;
          if (shouldShowOracleTip) {
            const resolvedTip = resolveOracleTipValue(validatedInput.oracleTip);
            if (resolvedTip === null) return;
            tipValue = resolvedTip;
          }

          let updateData: `0x${string}`[] = [];
          if (tipValue > 0n) {
            try {
              const { updateData: payload, requiredFee } =
                await fetchOracleUpdatePayload();
              updateData = payload;
              if (requiredFee !== undefined && tipValue < requiredFee) {
                toast.error("Oracle tip is below the required Pyth fee");
                return;
              }
            } catch (error) {
              console.error("Failed to fetch oracle update data:", error);
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to fetch oracle update data",
              );
              return;
            }
          }

          await writeNeutronToProton({
            address: validatedReactorAddress,
            abi: StableCoinReactorABI,
            functionName: "transmuteNeutronToProton",
            args: [
              parsed,
              validatedInput.recipient as `0x${string}`,
              updateData,
            ],
            value: tipValue,
          });
          break;
        }
        default:
          toast.error("Unsupported conversion path");
      }
    } catch (error) {
      console.error("Swap execution error:", error);
      toast.error("Transaction failed to send");
    }
  };

  const disabledTokens: Record<TokenOption, boolean> = {
    BASE: !baseToken,
    BUNDLE: !neutronToken || !protonToken,
    NEUTRON: !neutronToken,
    PROTON: !protonToken,
  };

  const fromBalanceDisplay = useMemo(() => {
    switch (fromToken) {
      case "BASE":
        return formatBalance(baseBalance, baseDecimalsNumber);
      case "NEUTRON":
        return formatBalance(neutronBalance, neutronDecimalsNumber);
      case "PROTON":
        return formatBalance(protonBalance, protonDecimalsNumber);
      case "BUNDLE":
        return `${neutronSymbolText}: ${formatBalance(
          neutronBalance,
          neutronDecimalsNumber,
        )} · ${protonSymbolText}: ${formatBalance(
          protonBalance,
          protonDecimalsNumber,
        )}`;
      default:
        return "0";
    }
  }, [
    fromToken,
    baseBalance,
    neutronBalance,
    protonBalance,
    baseDecimalsNumber,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronSymbol,
    protonSymbol,
  ]);

  const swapDescription = useMemo(() => {
    switch (route) {
      case "FISSION":
        return `Convert ${baseSymbolText} into ${neutronSymbolText} + ${protonSymbolText}.`;
      case "FUSION":
        return `Redeem ${neutronSymbolText} + ${protonSymbolText} back into ${baseSymbolText}.`;
      case "PROTON_TO_NEUTRON":
        return `Transmute ${protonSymbolText} into ${neutronSymbolText} using the β⁺ pathway.`;
      case "NEUTRON_TO_PROTON":
        return `Transmute ${neutronSymbolText} into ${protonSymbolText} using the β⁻ pathway.`;
      default:
        return "Select a supported conversion pair to continue.";
    }
  }, [route, baseSymbolText, neutronSymbolText, protonSymbolText]);

  const actionLabel = useMemo(() => {
    switch (route) {
      case "FISSION":
        return "Split Base";
      case "FUSION":
        return "Merge Tokens";
      case "PROTON_TO_NEUTRON":
        return "Transmute β⁺";
      case "NEUTRON_TO_PROTON":
        return "Transmute β⁻";
      default:
        return "Select Pair";
    }
  }, [route]);

  const handleMaxClick = () => {
    if (
      fromToken === "BASE" &&
      baseBalance &&
      baseDecimalsNumber !== undefined
    ) {
      const formatted = formatUnits(baseBalance, baseDecimalsNumber);
      setAmount(trimFormattedAmount(formatted, 6));
    } else if (
      fromToken === "NEUTRON" &&
      neutronBalance &&
      neutronDecimalsNumber !== undefined
    ) {
      const formatted = formatUnits(neutronBalance, neutronDecimalsNumber);
      setAmount(trimFormattedAmount(formatted, 6));
    } else if (
      fromToken === "PROTON" &&
      protonBalance &&
      protonDecimalsNumber !== undefined
    ) {
      const formatted = formatUnits(protonBalance, protonDecimalsNumber);
      setAmount(trimFormattedAmount(formatted, 6));
    }
  };

  const renderMaxButton =
    fromToken === "BASE" || fromToken === "NEUTRON" || fromToken === "PROTON";

  const baseAmountRaw = useMemo(() => {
    if (!baseDecimalsNumber) return null;
    if (!amount) return null;
    return safeParseUnits(amount, baseDecimalsNumber);
  }, [amount, baseDecimalsNumber]);

  const parsedProtonAmount = useMemo(() => {
    if (route !== "PROTON_TO_NEUTRON") return null;
    if (!protonDecimalsNumber) return null;
    if (!amount) return null;
    return safeParseUnits(amount, protonDecimalsNumber);
  }, [route, amount, protonDecimalsNumber]);

  const parsedNeutronAmount = useMemo(() => {
    if (route !== "NEUTRON_TO_PROTON") return null;
    if (!neutronDecimalsNumber) return null;
    if (!amount) return null;
    return safeParseUnits(amount, neutronDecimalsNumber);
  }, [route, amount, neutronDecimalsNumber]);

  const isFissionRoute = route === "FISSION";
  const isFusionRoute = route === "FUSION";
  const shouldShowOracleTip = useMemo(() => {
    if (route === "FISSION") {
      if (protonTotalSupply === undefined) {
        return true;
      }
      return protonTotalSupply === 0n;
    }
    return route === "PROTON_TO_NEUTRON" || route === "NEUTRON_TO_PROTON";
  }, [route, protonTotalSupply]);

  useEffect(() => {
    if (!shouldShowOracleTip) {
      setIsOracleTipExpanded(false);
      setOracleTip("");
    }
  }, [shouldShowOracleTip]);

  const interactionValidationResult = useMemo(
    () =>
      interactionInputSchema.safeParse({
        amount,
        recipient,
        oracleTip: shouldShowOracleTip ? oracleTip : "",
      }),
    [amount, recipient, oracleTip, shouldShowOracleTip],
  );

  const interactionFieldErrors = useMemo(() => {
    if (interactionValidationResult.success) {
      return { amount: undefined, recipient: undefined, oracleTip: undefined };
    }

    const flattenedErrors =
      interactionValidationResult.error.flatten().fieldErrors;
    return {
      amount: flattenedErrors.amount?.[0],
      recipient: flattenedErrors.recipient?.[0],
      oracleTip: flattenedErrors.oracleTip?.[0],
    };
  }, [interactionValidationResult]);

  const resolveOracleTipValue = useCallback(
    (tipInput: string): bigint | null => {
      if (tipInput.length === 0) {
        return 0n;
      }
      try {
        return parseUnits(tipInput, 18);
      } catch (error) {
        console.error("Invalid oracle tip:", error);
        toast.error("Oracle tip must be a valid ETH amount");
        return null;
      }
    },
    [],
  );

  const fetchOracleUpdatePayload = useCallback(async () => {
    if (!oracleAddress) {
      throw new Error("Oracle address unavailable for this reactor");
    }
    if (!reactorPriceId) {
      throw new Error("Price feed ID unavailable for this reactor");
    }

    setIsFetchingOracleUpdate(true);
    try {
      const response = await fetch("/api/hermes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: reactorPriceId,
          oracleAddress,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        updateData?: string[];
        error?: string;
      };

      if (!response.ok) {
        const message =
          typeof payload.error === "string" ? payload.error : undefined;
        throw new Error(message ?? `Hermes proxy failed (${response.status})`);
      }

      const updateData = (payload.updateData ?? []).map(
        (entry) => entry as `0x${string}`,
      );
      if (updateData.length === 0) {
        throw new Error("Hermes proxy returned no update data");
      }

      let requiredFee: bigint | undefined;
      if (publicClient) {
        try {
          requiredFee = await publicClient.readContract({
            address: oracleAddress as `0x${string}`,
            abi: PythABI,
            functionName: "getUpdateFee",
            args: [updateData],
          });
        } catch (feeError) {
          console.error("Failed to estimate oracle fee:", feeError);
        }
      }

      return { updateData, requiredFee };
    } finally {
      setIsFetchingOracleUpdate(false);
    }
  }, [oracleAddress, reactorPriceId, publicClient]);

  const fissionBreakdown = useMemo(() => {
    if (!isFissionRoute) return null;
    if (!baseAmountRaw || baseAmountRaw <= 0n) return null;
    if (fissionFee === undefined || reserve === undefined) {
      return null;
    }

    const fee = mulDiv(baseAmountRaw, fissionFee, WAD);
    const netBase = baseAmountRaw - fee;
    if (netBase <= 0n) {
      return {
        baseIn: baseAmountRaw,
        fee,
        netBase,
        neutronOut: 0n,
        protonOut: 0n,
      };
    }

    if (
      baseDecimalsNumber === undefined ||
      neutronDecimalsNumber === undefined ||
      protonDecimalsNumber === undefined
    ) {
      return {
        baseIn: baseAmountRaw,
        fee,
        netBase,
        neutronOut: 0n,
        protonOut: 0n,
      };
    }

    const baseScale = pow10(baseDecimalsNumber);
    const netWad = mulDiv(netBase, WAD, baseScale);
    const bootstrap =
      reserve === 0n &&
      (neutronTotalSupply === undefined || neutronTotalSupply === 0n) &&
      (protonTotalSupply === undefined || protonTotalSupply === 0n);

    if (bootstrap) {
      if (basePricePegged === undefined) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        };
      }

      const depositValueWad = mulDiv(netWad, basePricePegged, WAD);
      if (depositValueWad === 0n) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        };
      }

      const neutronValueWad = depositValueWad / 3n;
      if (neutronValueWad === 0n) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        };
      }

      const baseForNeutronWad = mulDiv(neutronValueWad, WAD, basePricePegged);
      if (baseForNeutronWad === 0n || baseForNeutronWad >= netWad) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        };
      }

      const protonBaseWad = netWad - baseForNeutronWad;
      if (protonBaseWad === 0n) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        };
      }

      const neutronOut = mulDiv(
        neutronValueWad,
        pow10(neutronDecimalsNumber),
        WAD,
      );
      const protonOut = mulDiv(protonBaseWad, pow10(protonDecimalsNumber), WAD);

      return {
        baseIn: baseAmountRaw,
        fee,
        netBase,
        neutronOut,
        protonOut,
        basePriceWad: basePricePegged,
      };
    }

    if (
      !reserveWad ||
      reserveWad === 0n ||
      !neutronSupplyWad ||
      !protonSupplyWad
    ) {
      return null;
    }

    const neutronOutWad =
      neutronSupplyWad === 0n
        ? 0n
        : mulDiv(netWad, neutronSupplyWad, reserveWad);
    const protonOutWad =
      protonSupplyWad === 0n ? 0n : mulDiv(netWad, protonSupplyWad, reserveWad);

    const neutronOut = mulDiv(neutronOutWad, pow10(neutronDecimalsNumber), WAD);
    const protonOut = mulDiv(protonOutWad, pow10(protonDecimalsNumber), WAD);

    return {
      baseIn: baseAmountRaw,
      fee,
      netBase,
      neutronOut,
      protonOut,
    };
  }, [
    isFissionRoute,
    baseAmountRaw,
    fissionFee,
    reserve,
    baseDecimalsNumber,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronTotalSupply,
    protonTotalSupply,
    basePricePegged,
    reserveWad,
    neutronSupplyWad,
    protonSupplyWad,
  ]);

  const fusionBreakdown = useMemo(() => {
    if (!isFusionRoute) return null;
    if (!baseAmountRaw || baseAmountRaw <= 0n) return null;
    if (
      fusionFee === undefined ||
      reserve === undefined ||
      reserve === 0n ||
      neutronTotalSupply === undefined ||
      protonTotalSupply === undefined ||
      baseDecimalsNumber === undefined ||
      neutronDecimalsNumber === undefined ||
      protonDecimalsNumber === undefined
    ) {
      return null;
    }

    const denominator = WAD - fusionFee;
    if (denominator <= 0n) return null;

    const grossBase = mulDiv(baseAmountRaw, WAD, denominator);
    const fee = grossBase - baseAmountRaw;
    const baseScale = pow10(baseDecimalsNumber);
    const reserveWadValue = reserveWad;
    if (!reserveWadValue || reserveWadValue === 0n) return null;
    if (!neutronSupplyWad || !protonSupplyWad) return null;

    const grossBaseWad = mulDiv(grossBase, WAD, baseScale);

    const neutronBurnWad =
      neutronSupplyWad === 0n
        ? 0n
        : mulDiv(grossBaseWad, neutronSupplyWad, reserveWadValue);
    const protonBurnWad =
      protonSupplyWad === 0n
        ? 0n
        : mulDiv(grossBaseWad, protonSupplyWad, reserveWadValue);

    const neutronBurn = mulDiv(
      neutronBurnWad,
      pow10(neutronDecimalsNumber),
      WAD,
    );
    const protonBurn = mulDiv(protonBurnWad, pow10(protonDecimalsNumber), WAD);

    return {
      requestedBaseOut: baseAmountRaw,
      grossBase,
      fee,
      neutronBurn,
      protonBurn,
    };
  }, [
    isFusionRoute,
    baseAmountRaw,
    fusionFee,
    reserve,
    neutronTotalSupply,
    protonTotalSupply,
    baseDecimalsNumber,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    reserveWad,
    neutronSupplyWad,
    protonSupplyWad,
  ]);

  const fromBreakdownRows = useMemo(() => {
    if (isFusionRoute && fusionBreakdown) {
      return [
        {
          label: neutronSymbolText,
          value: formatTokenValue(
            fusionBreakdown.neutronBurn,
            neutronDecimalsNumber,
            neutronSymbolText,
          ),
        },
        {
          label: protonSymbolText,
          value: formatTokenValue(
            fusionBreakdown.protonBurn,
            protonDecimalsNumber,
            protonSymbolText,
          ),
        },
      ];
    }
    return [];
  }, [
    isFusionRoute,
    fusionBreakdown,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronSymbolText,
    protonSymbolText,
  ]);

  const fusionBundleSummary = useMemo(() => {
    if (!isFusionRoute) return "";
    if (!fromBreakdownRows.length) return "";
    return fromBreakdownRows.map((row) => row.value).join(" + ");
  }, [isFusionRoute, fromBreakdownRows]);

  const breakdownPopover = useMemo(() => {
    if (isFissionRoute && fissionBreakdown) {
      return {
        title: "Fission breakdown",
        rows: [
          {
            label: "Base supplied",
            value: formatTokenValue(
              fissionBreakdown.baseIn,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: "Fee retained",
            value: formatTokenValue(
              fissionBreakdown.fee,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: "Net base",
            value: formatTokenValue(
              fissionBreakdown.netBase,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: `Mint ${neutronSymbolText}`,
            value: formatTokenValue(
              fissionBreakdown.neutronOut,
              neutronDecimalsNumber,
              neutronSymbolText,
            ),
          },
          {
            label: `Mint ${protonSymbolText}`,
            value: formatTokenValue(
              fissionBreakdown.protonOut,
              protonDecimalsNumber,
              protonSymbolText,
            ),
          },
          {
            label: "Oracle price",
            value: (() => {
              const oraclePriceWad =
                fissionBreakdown.basePriceWad ?? basePricePegged;
              return oraclePriceWad
                ? `${formatWad(oraclePriceWad)} ${peggedSymbolText}/${baseSymbolText}`
                : "—";
            })(),
          },
        ],
      };
    }

    if (isFusionRoute && fusionBreakdown) {
      return {
        title: "Fusion breakdown",
        rows: [
          {
            label: "Base requested",
            value: formatTokenValue(
              fusionBreakdown.requestedBaseOut,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: "Gross base",
            value: formatTokenValue(
              fusionBreakdown.grossBase,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: "Fee withheld",
            value: formatTokenValue(
              fusionBreakdown.fee,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: `Burn ${neutronSymbolText}`,
            value: formatTokenValue(
              fusionBreakdown.neutronBurn,
              neutronDecimalsNumber,
              neutronSymbolText,
            ),
          },
          {
            label: `Burn ${protonSymbolText}`,
            value: formatTokenValue(
              fusionBreakdown.protonBurn,
              protonDecimalsNumber,
              protonSymbolText,
            ),
          },
        ],
      };
    }

    return null;
  }, [
    isFissionRoute,
    fissionBreakdown,
    baseDecimalsNumber,
    baseSymbolText,
    neutronSymbolText,
    neutronDecimalsNumber,
    protonSymbolText,
    protonDecimalsNumber,
    basePricePegged,
    isFusionRoute,
    fusionBreakdown,
  ]);

  const fissionMintSummary = useMemo(() => {
    if (!isFissionRoute || !fissionBreakdown) return "";
    const neutronText = formatTokenValue(
      fissionBreakdown.neutronOut,
      neutronDecimalsNumber,
      neutronSymbolText,
      4,
    );
    const protonText = formatTokenValue(
      fissionBreakdown.protonOut,
      protonDecimalsNumber,
      protonSymbolText,
      4,
    );
    return `${neutronText} + ${protonText}`;
  }, [
    isFissionRoute,
    fissionBreakdown,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronSymbolText,
    protonSymbolText,
  ]);

  const protonToNeutronSummary = useMemo(() => {
    if (route !== "PROTON_TO_NEUTRON") return "";
    if (!parsedProtonAmount || parsedProtonAmount <= 0n) return "";
    if (!protonPriceInBase || !neutronPriceInBase) return "";
    if (!neutronDecimalsNumber) return "";
    const grossBase = mulDiv(parsedProtonAmount, protonPriceInBase, WAD);
    if (grossBase === 0n) return "";
    const neutronOut = mulDiv(grossBase, WAD, neutronPriceInBase);
    if (neutronOut === 0n) return "";
    return formatTokenValue(
      neutronOut,
      neutronDecimalsNumber,
      neutronSymbolText,
      4,
    );
  }, [
    route,
    parsedProtonAmount,
    protonPriceInBase,
    neutronPriceInBase,
    neutronDecimalsNumber,
    neutronSymbolText,
  ]);

  const neutronToProtonSummary = useMemo(() => {
    if (route !== "NEUTRON_TO_PROTON") return "";
    if (!parsedNeutronAmount || parsedNeutronAmount <= 0n) return "";
    if (!neutronPriceInBase || !protonPriceInBase) return "";
    if (!protonDecimalsNumber) return "";
    const grossBase = mulDiv(parsedNeutronAmount, neutronPriceInBase, WAD);
    if (grossBase === 0n) return "";
    const protonOut = mulDiv(grossBase, WAD, protonPriceInBase);
    if (protonOut === 0n) return "";
    return formatTokenValue(
      protonOut,
      protonDecimalsNumber,
      protonSymbolText,
      4,
    );
  }, [
    route,
    parsedNeutronAmount,
    neutronPriceInBase,
    protonPriceInBase,
    protonDecimalsNumber,
    protonSymbolText,
  ]);

  const fromInputReadOnly = isFusionRoute;
  const fromInputType = isFusionRoute ? "text" : "number";
  const fromInputValue = isFusionRoute ? fusionBundleSummary : amount;
  const fromInputPlaceholder = isFusionRoute
    ? fusionBundleSummary ||
      `${neutronSymbolText} + ${protonSymbolText} burn calculated automatically`
    : "0.0";

  const toInputReadOnly = !isFusionRoute;
  const toInputType = isFusionRoute ? "number" : "text";
  const toInputValue = useMemo(() => {
    if (isFusionRoute) return amount;
    if (isFissionRoute && fissionMintSummary) return fissionMintSummary;
    if (route === "PROTON_TO_NEUTRON") return protonToNeutronSummary;
    if (route === "NEUTRON_TO_PROTON") return neutronToProtonSummary;
    return "";
  }, [
    isFusionRoute,
    amount,
    isFissionRoute,
    fissionMintSummary,
    route,
    protonToNeutronSummary,
    neutronToProtonSummary,
  ]);

  const toInputPlaceholder = useMemo(() => {
    if (isFusionRoute) {
      return `Enter the amount of ${baseSymbolText} you want back`;
    }
    if (isFissionRoute) {
      return fissionMintSummary || "Minted bundle appears here";
    }
    if (route === "PROTON_TO_NEUTRON") {
      return (
        protonToNeutronSummary || `Minted ${neutronSymbolText} appears here`
      );
    }
    if (route === "NEUTRON_TO_PROTON") {
      return (
        neutronToProtonSummary || `Minted ${protonSymbolText} appears here`
      );
    }
    return "Calculated on-chain";
  }, [
    isFusionRoute,
    baseSymbolText,
    isFissionRoute,
    fissionMintSummary,
    route,
    protonToNeutronSummary,
    neutronToProtonSummary,
    neutronSymbolText,
    protonSymbolText,
  ]);

  const showValidationErrors =
    hasAttemptedSubmit ||
    amount.trim().length > 0 ||
    recipient.trim().length > 0 ||
    (shouldShowOracleTip && oracleTip.trim().length > 0);
  const amountErrorText = showValidationErrors
    ? interactionFieldErrors.amount
    : undefined;
  const recipientErrorText = showValidationErrors
    ? interactionFieldErrors.recipient
    : undefined;
  const oracleTipErrorText =
    shouldShowOracleTip && showValidationErrors
      ? interactionFieldErrors.oracleTip
      : undefined;

  const treasuryAddress = typeof treasury === "string" ? treasury : undefined;
  const oracleAddressText =
    typeof oracleAddress === "string" ? oracleAddress : undefined;
  const priceFeedIdText =
    typeof reactorPriceId === "string" ? reactorPriceId : undefined;
  const baseTokenAddress =
    typeof baseToken === "string" ? baseToken : undefined;

  const reserveBalanceText =
    reserve && baseDecimalsNumber !== undefined
      ? `${formatBalance(reserve, baseDecimalsNumber)} ${baseSymbolText}`
      : "—";
  const neutronSupplyText =
    neutronTotalSupply !== undefined && neutronDecimalsNumber !== undefined
      ? formatBalance(neutronTotalSupply, neutronDecimalsNumber)
      : "—";
  const protonSupplyText =
    protonTotalSupply !== undefined && protonDecimalsNumber !== undefined
      ? formatBalance(protonTotalSupply, protonDecimalsNumber)
      : "—";
  const neutronBasePriceText =
    neutronPriceInBase !== undefined
      ? `${formatWad(neutronPriceInBase)} ${baseSymbolText}`
      : "—";
  const protonBasePriceText =
    protonPriceInBase !== undefined
      ? `${formatWad(protonPriceInBase)} ${baseSymbolText}`
      : "—";
  const neutronPegPriceText =
    neutronPricePegged !== undefined
      ? `${formatWad(neutronPricePegged)} ${peggedSymbolText}`
      : "—";
  const protonPegPriceText =
    protonPricePegged !== undefined
      ? `${formatWad(protonPricePegged)} ${peggedSymbolText}`
      : "—";
  const bundleLabel = `${neutronSymbolText} + ${protonSymbolText}`;

  const handleCopy = async (value?: string) => {
    if (!value || value === "—") {
      toast.error("Nothing to copy");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard unavailable in this environment");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      toast.success("Copied to clipboard");
      setTimeout(() => {
        setCopiedValue((current) => (current === value ? null : current));
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy value");
    }
  };

  const infoSections = useMemo<InfoSection[]>(() => {
    const sections: InfoSection[] = [];

    sections.push({
      title: "Vault Posture",
      description: "Core reserve state and fee policy for this reactor.",
      items: [
        {
          label: "Reserve Balance",
          value: reserveBalanceText,
          emphasize: true,
        },
        { label: "Reserve Ratio", value: reserveRatioText },
        { label: "Critical Ratio", value: criticalRatioText },
        { label: "Base/Peg Price", value: basePricePeggedText },
        { label: "Fission Fee", value: fissionFeeText },
        { label: "Fusion Fee", value: fusionFeeText },
        { label: "Base Asset", value: baseAssetDisplay },
        { label: "Pegged Asset", value: peggedAssetDisplay },
      ],
    });

    sections.push({
      title: "Program Addresses",
      description: "Key accounts that control this vault.",
      items: [
        {
          label: "Vault Address",
          value: reactorAddress ?? "—",
          monospace: true,
        },
        { label: "Treasury", value: treasuryAddress ?? "—", monospace: true },
        {
          label: "Oracle (Pyth)",
          value: oracleAddressText ?? "—",
          monospace: true,
        },
        {
          label: "Price Feed ID",
          value: priceFeedIdText ?? "—",
          monospace: true,
        },
        {
          label: "Base Token",
          value: baseTokenAddress ?? "—",
          monospace: true,
        },
      ],
    });

    sections.push({
      title: `${neutronSymbolText} Metrics`,
      description: "Stable asset supply and price snapshots.",
      items: [
        { label: "Supply", value: neutronSupplyText, emphasize: true },
        {
          label: `${neutronSymbolText}/${baseSymbolText}`,
          value: neutronBasePriceText,
        },
        {
          label: `${neutronSymbolText}/${peggedSymbolText}`,
          value: neutronPegPriceText,
        },
      ],
    });

    sections.push({
      title: `${protonSymbolText} Metrics`,
      description: "Volatile asset issuance and pricing context.",
      items: [
        { label: "Supply", value: protonSupplyText, emphasize: true },
        {
          label: `${protonSymbolText}/${baseSymbolText}`,
          value: protonBasePriceText,
        },
        {
          label: `${protonSymbolText}/${peggedSymbolText}`,
          value: protonPegPriceText,
        },
      ],
    });

    return sections;
  }, [
    reactorAddress,
    treasuryAddress,
    oracleAddressText,
    priceFeedIdText,
    baseTokenAddress,
    reserveBalanceText,
    reserveRatioText,
    criticalRatioText,
    fissionFeeText,
    fusionFeeText,
    baseAssetDisplay,
    peggedAssetDisplay,
    basePricePeggedText,
    neutronSupplyText,
    protonSupplyText,
    neutronBasePriceText,
    protonBasePriceText,
    neutronPegPriceText,
    protonPegPriceText,
    neutronSymbolText,
    protonSymbolText,
    baseSymbolText,
    peggedSymbolText,
  ]);

  return (
    <div className="min-h-screen relative" style={containerStyle}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#F7F7F7"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
        className="fixed inset-0 z-[1]"
      />

      <div className="container mx-auto px-4 py-8 relative z-[5]">
        <div className="text-center mb-10 space-y-2">
          <Shuffle
            text={vaultHeading}
            tag="h1"
            className="text-4xl lg:text-5xl text-foreground"
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce
            respectReducedMotion
          />
          <p className="text-sm text-muted-foreground">
            Manage flows between {baseAssetDisplay} and the {neutronSymbolText}/
            {protonSymbolText} bundle.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <Card className="backdrop-blur-md bg-background/60 border-white/40 shadow-2xl rounded-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                Swap Anywhere, Anytime
              </CardTitle>
              <p className="text-sm text-muted-foreground">{swapDescription}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-none border border-white/40 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/70">
                  <span>From</span>
                  <span className="font-mono text-xs text-white/80">
                    {fromBalanceDisplay}
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:h-14">
                  <Select
                    value={fromToken}
                    onValueChange={(value) =>
                      setFromToken(value as TokenOption)
                    }
                  >
                    <SelectTrigger className="h-12 sm:h-14 w-full sm:w-48 sm:flex-none bg-background/80">
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASE" disabled={disabledTokens.BASE}>
                        {`${baseAssetName} (${baseSymbolText})`}
                      </SelectItem>
                      <SelectItem
                        value="NEUTRON"
                        disabled={disabledTokens.NEUTRON}
                      >
                        {neutronSymbolText}
                      </SelectItem>
                      <SelectItem
                        value="PROTON"
                        disabled={disabledTokens.PROTON}
                      >
                        {protonSymbolText}
                      </SelectItem>
                      <SelectItem
                        value="BUNDLE"
                        disabled={disabledTokens.BUNDLE}
                      >
                        {`${neutronSymbolText} + ${protonSymbolText}`}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type={fromInputType}
                    placeholder={fromInputPlaceholder}
                    value={fromInputValue}
                    onChange={(event) => {
                      if (fromInputReadOnly) return;
                      setAmount(event.target.value);
                    }}
                    readOnly={fromInputReadOnly}
                    className={`w-full sm:flex-1 sm:min-w-0 text-xl sm:text-2xl font-semibold h-12 sm:h-14 bg-background/60 ${
                      amountErrorText && !fromInputReadOnly
                        ? "border-red-500"
                        : ""
                    }`}
                  />

                  {renderMaxButton && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto h-12 sm:h-14 border-white/40 hover:bg-white/10"
                      onClick={handleMaxClick}
                    >
                      Max
                    </Button>
                  )}
                </div>
                {amountErrorText && !fromInputReadOnly && (
                  <p className="text-xs text-red-400 font-mono tracking-wide">
                    {amountErrorText}
                  </p>
                )}
              </div>

              {shouldShowOracleTip && (
                <div className="rounded-none border border-dashed border-white/30 bg-white/5 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setIsOracleTipExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      <Zap className="h-4 w-4 text-primary" />
                      Oracle Tip
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-foreground transition-transform ${
                        isOracleTipExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOracleTipExpanded && (
                    <div className="mt-3 space-y-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        placeholder="0.00"
                        value={oracleTip}
                        onChange={(event) => setOracleTip(event.target.value)}
                        className={`font-mono text-sm bg-background/60 ${
                          oracleTipErrorText ? "border-red-500" : ""
                        }`}
                      />
                      {oracleTipErrorText && (
                        <p className="text-xs text-red-400 font-mono tracking-wide">
                          {oracleTipErrorText}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Provide an ETH tip to push a fresh Pyth price update
                        before executing this conversion.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-none h-12 w-12 p-0 bg-white/10 hover:bg-white/20"
                  onClick={() => {
                    const newFrom = toToken;
                    const newTo = allowedTargets[newFrom][0];
                    setFromToken(newFrom);
                    setToToken(newTo);
                  }}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-3 rounded-none border border-white/40 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/70">
                  <span>To</span>
                  <div className="flex items-center gap-2">
                    {breakdownPopover && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="rounded-none border border-white/40 p-1 text-foreground/70 transition-colors hover:border-white/40 hover:text-foreground"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-64 space-y-2 text-sm"
                          align="end"
                        >
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
                                <span className="text-foreground">
                                  {row.value}
                                </span>
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
                              ? baseSymbolText
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
                        setAmount(event.target.value);
                      }
                    }}
                    readOnly={toInputReadOnly}
                    className={`w-full sm:flex-1 sm:min-w-0 text-xl sm:text-2xl font-semibold h-12 sm:h-14 bg-background/60 ${
                      amountErrorText && !toInputReadOnly
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                </div>
                {amountErrorText && !toInputReadOnly && (
                  <p className="text-xs text-red-400 font-mono tracking-wide">
                    {amountErrorText}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Recipient Address
                </label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className={`font-mono text-sm bg-background/60 ${
                    recipientErrorText ? "border-red-500" : ""
                  }`}
                />
                {recipientErrorText && (
                  <p className="text-xs text-red-400 font-mono tracking-wide">
                    {recipientErrorText}
                  </p>
                )}
              </div>

              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none",
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <Button
                              onClick={openConnectModal}
                              className="w-full h-14 bg-[#E8BA10] hover:bg-[#d0a60e] text-black font-semibold text-lg border-0"
                            >
                              <Zap className="mr-2 h-5 w-5" />
                              Connect Wallet
                            </Button>
                          );
                        }

                        if (!route) {
                          return (
                            <Button
                              disabled
                              className="w-full h-14 bg-muted text-muted-foreground"
                            >
                              Select a valid pair
                            </Button>
                          );
                        }

                        if (!interactionValidationResult.success) {
                          return (
                            <Button
                              disabled
                              className="w-full h-14 bg-muted text-muted-foreground"
                            >
                              {amount.trim().length === 0 &&
                              recipient.trim().length === 0
                                ? "Enter amount and recipient"
                                : "Fix highlighted input errors"}
                            </Button>
                          );
                        }

                        if (needsApproval) {
                          return (
                            <Button
                              onClick={handleApprove}
                              disabled={isProcessing}
                              className="w-full h-14 bg-[#E8BA10] hover:bg-[#d0a60e] text-black font-semibold text-lg border-0"
                            >
                              {isApproving || isApprovingTx ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                                  Approving…
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-5 w-5" />
                                  Approve {baseSymbolText}
                                </>
                              )}
                            </Button>
                          );
                        }

                        return (
                          <Button
                            onClick={handleSwap}
                            disabled={isProcessing}
                            className="w-full h-14 bg-[#E8BA10] hover:bg-[#d0a60e] text-black font-semibold text-lg border-0 disabled:opacity-60"
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                                Processing…
                              </>
                            ) : (
                              actionLabel
                            )}
                          </Button>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </CardContent>
          </Card>
        </div>

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
                  Live configuration, oracle wiring, and treasury context for
                  this vault.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {infoSections.map((section) => (
                  <section
                    key={section.title}
                    className="rounded-xl border border-white/20 bg-white/5 px-5 py-6 backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                      <h3 className="text-sm font-semibold tracking-wide text-foreground">
                        {section.title}
                      </h3>
                      {section.description ? (
                        <p className="text-xs text-muted-foreground/80">
                          {section.description}
                        </p>
                      ) : null}
                    </div>
                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      {section.items.map((row) => {
                        const isCopyable = row.monospace && row.value !== "—";
                        const emphasisClasses = row.emphasize
                          ? "text-lg font-semibold tracking-tight"
                          : "text-sm";

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
                                    className="h-7 w-7 rounded-full border border-white/20 bg-white/5"
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
                                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
                        );
                      })}
                    </dl>
                  </section>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
