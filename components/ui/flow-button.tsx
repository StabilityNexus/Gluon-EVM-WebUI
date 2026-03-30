"use client";

import Link from "next/link";
import { type ReactNode } from "react";

interface FlowButtonProps {
  text?: string;
  href?: string;
  onClick?: () => void;
  "aria-label"?: string;
}

export function FlowButton({
  text = "Modern Button",
  href,
  onClick,
  "aria-label": ariaLabel,
}: FlowButtonProps): ReactNode {
  const buttonClasses =
    "flow-button-nav group relative flex items-center gap-1 overflow-hidden rounded-[100px] border-[1px] border-transparent bg-transparent font-semibold text-black dark:text-white cursor-pointer transition-all duration-300 ease-out hover:border-black dark:hover:border-white hover:text-white dark:hover:text-black hover:rounded-[12px] active:scale-[0.98] !text-[16px] !px-[20px] !py-[10px]";
  const buttonStyle = { padding: "10px 20px", fontSize: "16px" };

  const content = (
    <>
      <span
        className="relative z-[1] -translate-x-2 group-hover:translate-x-0 transition-all duration-300 ease-out !text-[16px]"
        style={{ fontSize: "16px" }}
      >
        {text}
      </span>
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black dark:bg-white rounded-full opacity-0 group-hover:w-[96px] group-hover:h-[96px] group-hover:opacity-100 transition-all duration-300 ease-out"
        style={{ backdropFilter: "blur(10px)" }}
        aria-hidden="true"
      ></span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={buttonClasses}
        style={buttonStyle}
        aria-label={ariaLabel || text}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={buttonClasses}
      style={buttonStyle}
      onClick={onClick}
      aria-label={ariaLabel || text}
      type="button"
    >
      {content}
    </button>
  );
}
