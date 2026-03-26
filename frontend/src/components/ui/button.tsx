import React, { type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "ghost" | "outline";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-teal-500 hover:bg-teal-600 text-white",
  ghost: "bg-transparent hover:bg-white/10 text-white",
  outline: "border border-white/30 text-white hover:border-white",
};

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
  return (
    <button
      className={`px-4 py-2 rounded-md font-semibold transition ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
