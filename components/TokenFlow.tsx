"use client";

import { useRef, forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import ErcIcon from "@/components/icons/ErcIcon";
import StableCoinIcon from "@/components/icons/StableCoinIcon";
import ReserveCoinIcon from "@/components/icons/ReserveCoinIcon";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-50 flex size-10 items-center justify-center rounded-full border bg-background relative",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

type TokenFlowToken =
  | "Fungible"
  | "Neutron"
  | "Proton"
  | "Base Token"
  | "stable token"
  | "Stable Token"
  | "leveraged yield token"
  | "Leveraged Yield Token";

const TokenFlow = ({
  fromTokens,
  toTokens,
  reverse = false,
  className = ""
}: {
  fromTokens: TokenFlowToken[];
  toTokens: TokenFlowToken[];
  reverse?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRefs = useRef<(HTMLDivElement | null)[]>([]);
  const toRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [refsReady, setRefsReady] = useState(false);

  useEffect(() => {
    const checkRefs = () => {
      const fromRefsReady = fromRefs.current.every((ref, index) =>
        index < fromTokens.length ? ref !== null && ref !== undefined : true
      );
      const toRefsReady = toRefs.current.every((ref, index) =>
        index < toTokens.length ? ref !== null && ref !== undefined : true
      );

      if (fromRefsReady && toRefsReady && containerRef.current) {
        setRefsReady(true);
      }
    };

    const timer = setTimeout(checkRefs, 100);
    return () => clearTimeout(timer);
  }, [fromTokens.length, toTokens.length]);

  const getTokenIcon = (token: TokenFlowToken) => {
    const iconProps = { className: "w-full h-full" };
    const normalized = token.toLowerCase();

    if (normalized === "stable token" || normalized === "neutron") {
      return <StableCoinIcon {...iconProps} />;
    }

    if (normalized === "leveraged yield token" || normalized === "proton") {
      return <ReserveCoinIcon {...iconProps} />;
    }

    return <ErcIcon {...iconProps} />;
  };

  return (
    <motion.div
      className={`w-full max-w-[32rem] h-full flex flex-col items-center justify-center space-y-3 border rounded-2xl p-3 sm:p-4 relative z-10 bg-grey-800 backdrop-blur-md border-white/30 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        ref={containerRef}
        className="relative flex w-full h-28 sm:h-32 items-center justify-between px-4 sm:px-6"
      >
        {/* From Tokens */}
        <div className="flex flex-col items-center space-y-3 relative z-10">
          {fromTokens.map((token, index) => (
            <motion.div
              key={`from-${token}-${index}`}
              className="flex flex-col items-center space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
            >
              <Circle ref={(el) => { fromRefs.current[index] = el; }}>
                {getTokenIcon(token)}
              </Circle>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                {token}
              </span>
            </motion.div>
          ))}
        </div>

        {/* To Tokens */}
        <div className="flex flex-col items-center space-y-3 relative z-10">
          {toTokens.map((token, index) => (
            <motion.div
              key={`to-${token}-${index}`}
              className="flex flex-col items-center space-y-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
            >
              <Circle ref={(el) => { toRefs.current[index] = el; }}>
                {getTokenIcon(token)}
              </Circle>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                {token}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Animated Beams */}
        {refsReady && (
          <div className="absolute inset-0 pointer-events-none z-1">
            {fromTokens.flatMap((_, fromIndex) =>
              toTokens.map((_, toIndex) => (
                <AnimatedBeam
                  key={`beam-${fromIndex}-${toIndex}`}
                  containerRef={containerRef}
                  fromRef={{ current: fromRefs.current[fromIndex] }}
                  toRef={{ current: toRefs.current[toIndex] }}
                  curvature={
                    fromTokens.length > 1 || toTokens.length > 1
                      ? fromIndex === 0 && toIndex === 0
                        ? -15
                        : fromIndex === 1 || toIndex === 1
                          ? 15
                          : 0
                      : 0
                  }
                  reverse={reverse}
                  duration={2.5}
                  delay={(fromIndex + toIndex) * 0.3}
                  gradientStartColor="#f59e0b"
                  gradientStopColor="#ef4444"
                  pathColor="#6b7280"
                  pathWidth={2}
                  pathOpacity={0.3}
                />
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TokenFlow;
