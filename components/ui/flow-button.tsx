'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlowButtonProps {
  text?: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  'aria-label'?: string;
}

export function FlowButton({
  text = 'Modern Button',
  href,
  onClick,
  active = false,
  'aria-label': ariaLabel,
}: FlowButtonProps): ReactNode {
  const inner = (
    <motion.span
      className="group relative inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[17px] font-semibold tracking-[-0.01em]"
      whileHover={{ y: -1, scale: 1.025 }}
      whileTap={{ y: 0, scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 28,
      }}
    >
      {active && (
        <motion.span
          layoutId="desktop-navbar-active-pill"
          className="absolute inset-0 rounded-full bg-foreground shadow-sm"
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
            mass: 0.7,
          }}
          aria-hidden="true"
        />
      )}

      {!active && (
        <span
          aria-hidden="true"
          className="
            absolute inset-0 rounded-full
            bg-foreground/[0.09]
            opacity-0 scale-[0.82]
            transition-[opacity,transform]
            duration-300 ease-out
            group-hover:opacity-100
            group-hover:scale-100
          "
        />
      )}

      <span
        className={cn(
          'relative z-10 transition-colors duration-200',
          active
            ? 'text-background'
            : 'text-foreground'
        )}
      >
        {text}
      </span>
    </motion.span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel || text}
        aria-current={active ? 'page' : undefined}
        className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || text}
      className="inline-flex rounded-full"
    >
      {inner}
    </button>
  );
}
