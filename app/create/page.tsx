"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import {
  useForm,
  Controller,
  type SubmitErrorHandler,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CheckCircle, Zap } from "lucide-react";
import { ChainSwitcher } from "@/components/ui/ChainSwitcher";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { type SupportedChainId } from "@/lib/chains";
import { StableCoinFactoryABI } from "@/utils/abi/StableCoinFactory";
import { StableCoinFactories } from "@/utils/addresses";
import { toast } from "sonner";
import Shuffle from "@/components/Shuffle";
import TargetCursor from "@/components/TargetCursor";
import TokenSelector from "@/components/TokenSelector";
import {
  createReactorSchema,
  type CreateReactorFormValues,
} from "@/lib/validation/reactor";

export default function CreatePage() {
  const {
    address,
    chainId,
    isConnected,
    isConnecting,
    isSwitchingChain,
    networkStatus,
    connectionError,
    switchError,
    connectWallet,
    disconnectWallet,
    switchToChain,
    supportedChains,
  } = useWalletConnection();
  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(
    supportedChains[0].id as SupportedChainId,
  );

  useEffect(() => {
    const matching = supportedChains.find((chain) => chain.id === chainId);
    if (matching) {
      setSelectedChainId(matching.id);
    }
  }, [chainId, supportedChains]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateReactorFormValues>({
    resolver: zodResolver(createReactorSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      vaultName: "",
      baseAssetName: "",
      baseAssetSymbol: "",
      peggedAssetName: "",
      peggedAssetSymbol: "",
      protonName: "",
      protonSymbol: "",
      baseToken: "" as `0x${string}`,
      oracleAddress: "" as `0x${string}`,
      priceId: "",
      treasury: (address || "") as `0x${string}`,
      criticalReserveRatio: 400,
    },
  });

  // Contract interaction
  const {
    data: hash,
    isPending: isDeploying,
    writeContractAsync,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const hasSetDefaultTreasury = useRef(false);

  useEffect(() => {
    if (!isConnected || !address || hasSetDefaultTreasury.current) {
      return;
    }

    const currentTreasury = getValues("treasury");
    if (!currentTreasury) {
      setValue("treasury", address, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }

    hasSetDefaultTreasury.current = true;
  }, [isConnected, address, getValues, setValue]);

  const onValidSubmit: SubmitHandler<CreateReactorFormValues> = async (
    values,
  ) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!writeContractAsync) {
      toast.error("Contract write function not available");
      return;
    }

    const factoryAddress =
      StableCoinFactories[chainId as keyof typeof StableCoinFactories];

    if (!factoryAddress) {
      toast.error(
        `Chain ID ${chainId} is not supported. Please switch to Citrea Testnet, Rootstock Testnet, or Scroll Sepolia.`,
      );
      return;
    }

    const criticalReserveRatioWad = parseUnits(
      (values.criticalReserveRatio / 100).toString(),
      18,
    );
    if (criticalReserveRatioWad < parseUnits("1", 18)) {
      toast.error("Critical reserve ratio must be at least 100%");
      return;
    }

    const account = address as `0x${string}`;

    try {
      await writeContractAsync({
        account,
        address: factoryAddress,
        abi: StableCoinFactoryABI,
        functionName: "deployReactor",
        args: [
          values.vaultName,
          values.baseAssetName,
          values.baseAssetSymbol,
          values.peggedAssetName,
          values.peggedAssetSymbol,
          values.baseToken as `0x${string}`,
          values.oracleAddress as `0x${string}`,
          values.priceId as `0x${string}`,
          values.protonName,
          values.protonSymbol,
          values.treasury as `0x${string}`,
          BigInt(5000000000000000), // 0.5% fission fee (0.005e18)
          BigInt(5000000000000000), // 0.5% fusion fee (0.005e18)
          criticalReserveRatioWad,
        ],
      });
    } catch (error) {
      console.error("Deployment error:", error);
      toast.error("Failed to deploy reactor");
    }
  };

  const onInvalidSubmit: SubmitErrorHandler<CreateReactorFormValues> = () => {
    toast.error("Please fix the highlighted form errors before deploying");
  };
  const triggerDeploy = handleSubmit(onValidSubmit, onInvalidSubmit);
  const walletStatusMessage = useMemo(() => {
    if (!isConnected) return "Wallet disconnected. Connect to deploy.";
    if (isConnecting) return "Connecting wallet...";
    if (isSwitchingChain) return "Switching network in wallet...";
    if (networkStatus === "wrong")
      return "Wrong network. Switch to a supported chain.";
    if (networkStatus === "unknown")
      return "Unknown network detected. Switch to a supported chain.";
    if (isDeploying) return "Transaction submission in progress...";
    if (isConfirming) return "Waiting for transaction confirmation...";
    return "Wallet connected. Ready to deploy.";
  }, [
    isConnected,
    isConnecting,
    isSwitchingChain,
    networkStatus,
    isDeploying,
    isConfirming,
  ]);
  const firstValidationMessage = useMemo(() => {
    const candidates = Object.values(errors)
      .map((value) => value?.message)
      .filter((message): message is string => typeof message === "string");
    return candidates[0] ?? null;
  }, [errors]);

  const fieldBaseClasses =
    "bg-[#0B0E15] border border-white/30 text-[13px] font-semibold tracking-[0.2em] text-white/85 placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 focus:border-white/60 transition-colors duration-200 px-4 rounded-none font-mono cursor-text";
  const inputClasses = `${fieldBaseClasses} h-12`;

  return (
    <div
      className="min-h-screen bg-[#050608] text-white"
      style={{
        fontFamily:
          "'Space Mono', 'Syne', 'Orbitron', 'Courier New', monospace",
        fontWeight: "500",
      }}
    >
      {/* Target Cursor Effect */}
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor={false}
        ignoreSelector=".cursor-normal, input, textarea, select, button, .cursor-text, [role='combobox']"
      />

      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative overflow-hidden border border-white/25 bg-[#090B11]/85 shadow-[0_0_60px_rgba(0,0,0,0.65)] backdrop-blur-sm cursor-normal">
            <div className="flex items-center justify-between border-b border-white/20 bg-[#050608]/80 px-8 py-6 uppercase tracking-[0.3em] text-xs text-white/60">
              <div className="flex items-center gap-4 text-white">
                <span className="text-sm font-bold text-[#8FF7FF]">{"//"}</span>
                <Shuffle
                  text="Create Your Reactor"
                  tag="span"
                  className="text-sm font-semibold"
                  shuffleDirection="right"
                  duration={0.3}
                  animationMode="random"
                  shuffleTimes={1}
                  ease="power3.out"
                  stagger={0.02}
                  threshold={0.1}
                  triggerOnce
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-10 rounded-full border border-white/15 bg-white/10" />
                <span className="h-2 w-4 rounded-full border border-white/15 bg-white/5" />
              </div>
            </div>

            <div className="grid gap-10 px-8 py-10">
              {!isConnected && (
                <div className="flex items-center gap-3 border border-dashed border-white/30 bg-black/30 px-5 py-4 text-white/60">
                  <Wallet className="h-5 w-5" />
                  <span className="tracking-[0.2em] uppercase text-[11px]">
                    Connect your wallet to authorize deployment
                  </span>
                </div>
              )}

              <div className="grid gap-8">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Vault Name
                  </Label>
                  <Input
                    placeholder="Gold Backed Vault"
                    {...register("vaultName")}
                    className={inputClasses}
                  />
                  {errors.vaultName && (
                    <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                      {errors.vaultName.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                      Base Asset Name
                    </Label>
                    <Input
                      placeholder="Bitcoin Reserve"
                      {...register("baseAssetName")}
                      className={inputClasses}
                    />
                    {errors.baseAssetName && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.baseAssetName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                      Base Asset Symbol
                    </Label>
                    <Input
                      placeholder="BTC"
                      {...register("baseAssetSymbol", {
                        onChange: (event) => {
                          event.target.value = event.target.value.toUpperCase();
                        },
                      })}
                      className={`${inputClasses} font-mono`}
                    />
                    {errors.baseAssetSymbol && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.baseAssetSymbol.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Base Token (Collateral)
                  </Label>
                  <Controller
                    name="baseToken"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TokenSelector
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="0x..."
                        label=""
                        required={true}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Oracle (Pyth) Address
                  </Label>
                  <Input
                    placeholder="0x..."
                    {...register("oracleAddress")}
                    className={`${inputClasses} font-mono ${errors.oracleAddress ? "border-red-500" : ""}`}
                  />
                  {errors.oracleAddress && (
                    <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                      {errors.oracleAddress.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                      Critical Reserve Ratio (%)
                    </Label>
                    <Input
                      type="number"
                      min={100}
                      step={1}
                      placeholder="400"
                      {...register("criticalReserveRatio", {
                        valueAsNumber: true,
                      })}
                      className={`${inputClasses} ${errors.criticalReserveRatio ? "border-red-500" : ""}`}
                    />
                    {errors.criticalReserveRatio && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.criticalReserveRatio.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                      Price Feed ID
                    </Label>
                    <Input
                      placeholder="0x..."
                      {...register("priceId")}
                      className={`${inputClasses} font-mono text-xs ${errors.priceId ? "border-red-500" : ""}`}
                    />
                    {errors.priceId && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.priceId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-[#FFE66D]">
                      Stable Token
                    </p>
                    <Input
                      placeholder="Token Name"
                      {...register("peggedAssetName")}
                      className={inputClasses}
                    />
                    {errors.peggedAssetName && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.peggedAssetName.message}
                      </p>
                    )}
                    <Input
                      placeholder="SYMBOL"
                      {...register("peggedAssetSymbol", {
                        onChange: (event) => {
                          event.target.value = event.target.value.toUpperCase();
                        },
                      })}
                      className={`${inputClasses} font-mono`}
                    />
                    {errors.peggedAssetSymbol && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.peggedAssetSymbol.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-[#FF6B6B]">
                      Volatile Token
                    </p>
                    <Input
                      placeholder="Token Name"
                      {...register("protonName")}
                      className={inputClasses}
                    />
                    {errors.protonName && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.protonName.message}
                      </p>
                    )}
                    <Input
                      placeholder="SYMBOL"
                      {...register("protonSymbol", {
                        onChange: (event) => {
                          event.target.value = event.target.value.toUpperCase();
                        },
                      })}
                      className={`${inputClasses} font-mono`}
                    />
                    {errors.protonSymbol && (
                      <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                        {errors.protonSymbol.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Treasury (Fee Recipient)
                  </Label>
                  <Input
                    placeholder="0x..."
                    {...register("treasury")}
                    className={`${inputClasses} font-mono ${errors.treasury ? "border-red-500" : ""}`}
                  />
                  {errors.treasury && (
                    <p className="text-red-400 text-xs font-mono tracking-[0.1em]">
                      {errors.treasury.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {walletStatusMessage}
                </p>
                {!isConnected ? (
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-none border border-white/60 bg-white text-black hover:bg-[#C6FFDD] hover:text-[#050608] transition-colors duration-200 uppercase tracking-[0.3em] text-xs cursor-pointer"
                    onClick={() => void connectWallet()}
                    disabled={isConnecting}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    {isConnecting ? "Connecting Wallet" : "Connect Wallet"}
                  </Button>
                ) : networkStatus === "wrong" || networkStatus === "unknown" ? (
                  <div className="space-y-3 border border-white/30 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#FCA5A5]">
                      {networkStatus === "wrong"
                        ? "Wrong Network"
                        : "Unknown Network"}
                    </p>
                    <ChainSwitcher
                      value={selectedChainId}
                      onValueChange={setSelectedChainId}
                      onSwitch={() => void switchToChain(selectedChainId)}
                      isSwitching={isSwitchingChain}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-none border-white/60 text-white hover:bg-white/10"
                        onClick={disconnectWallet}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-none border border-white/60 bg-white text-black hover:bg-[#C6FFDD] hover:text-[#050608] transition-colors duration-200 uppercase tracking-[0.3em] text-xs cursor-pointer"
                    onClick={() => void triggerDeploy()}
                    disabled={
                      !isValid || isDeploying || isConfirming || isSubmitting
                    }
                  >
                    {isDeploying ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-black" />
                        Deploying
                      </>
                    ) : isConfirming ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-black" />
                        Confirming
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Deploy Reactor
                      </>
                    )}
                  </Button>
                )}

                {connectionError ? (
                  <p className="text-xs text-red-400">
                    {connectionError.message}
                  </p>
                ) : null}
                {switchError ? (
                  <p className="text-xs text-red-400">{switchError.message}</p>
                ) : null}
                {isConnected && networkStatus === "correct" && !isValid ? (
                  <p className="text-xs text-[#FCA5A5]">
                    Validation blocked:{" "}
                    {firstValidationMessage ??
                      "Please fix the highlighted form fields."}
                  </p>
                ) : null}

                {isSuccess && (
                  <div className="border border-[#34D399]/40 bg-[#10221A] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#34D399]" />
                      <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-[#34D399]">
                          Reactor Deployed
                        </div>
                        <div className="mt-1 font-mono text-xs text-[#86EFAC] break-all">
                          {hash}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
