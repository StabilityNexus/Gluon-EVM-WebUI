import React, { useId } from "react";

interface SolanaTokenIconProps {
  className?: string; // control rendered size, e.g. "w-8 h-8"
  symbol?: string; // e.g. "SOL", "USDC"
  bgColor?: string; // inner circle color
  ringColor?: string; // subtle rim stroke color
  fromColor?: string; // gradient start for shard
  toColor?: string; // gradient end for shard
}

const SolanaTokenIcon: React.FC<SolanaTokenIconProps> = ({
  className = "w-8 h-8",
  bgColor = "#14162B", // deep indigo fill
  ringColor = "rgba(255,255,255,0.12)",
  fromColor = "#627EEA", // classic Ethereum blue
  toColor = "#9EB5FF", // lighter accent
}) => {
  const gradientId = useId();
  const glowId = `${gradientId}-glow`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={`${gradientId}-title`}
    >
      <defs>
        {/* Ethereum shard gradients */}
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor={toColor} stopOpacity={0.45} />
          <stop offset="70%" stopColor={fromColor} stopOpacity={0.08} />
          <stop offset="100%" stopColor={fromColor} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Outer subtle rim */}
      <circle
        cx={32}
        cy={32}
        r={30}
        fill={bgColor}
        stroke={ringColor}
        strokeWidth={2}
      />

      {/* Inner soft inset ring for depth */}
      <circle
        cx={32}
        cy={32}
        r={22}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={2}
        opacity={0.4}
      />

      {/* Subtle glow */}
      <ellipse
        cx={32}
        cy={30}
        rx={18}
        ry={22}
        fill={`url(#${glowId})`}
        opacity={0.6}
      />

      {/* Ethereum diamond */}
      <g>
        {/* top facet */}
        <polygon
          points="32 14 42 33 32 28 22 33"
          fill={`url(#${gradientId})`}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={0.5}
        />
        {/* middle highlight */}
        <polygon
          points="32 28 42 33 32 38 22 33"
          fill="rgba(255,255,255,0.12)"
        />
        {/* bottom facet */}
        <polygon
          points="32 38 42 33 32 50 22 33"
          fill={`url(#${gradientId})`}
          opacity={0.85}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={0.5}
        />
      </g>
    </svg>
  );
};

export default SolanaTokenIcon;
