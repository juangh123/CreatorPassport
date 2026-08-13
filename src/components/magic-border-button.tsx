import React from "react";
import { cn } from "@/lib/utils";

interface MagicBorderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  containerClassName?: string;
  as?: React.ElementType;
  href?: string;
}

export const MagicBorderButton = ({
  children,
  className,
  containerClassName,
  as: Component = "button",
  ...props
}: MagicBorderButtonProps) => {
  return (
    <Component
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50",
        containerClassName
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span
        className={cn(
          "inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl",
          className
        )}
      >
        {children}
      </span>
    </Component>
  );
};
