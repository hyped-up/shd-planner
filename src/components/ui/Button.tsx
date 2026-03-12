// Reusable button component with Division 2 theme variants
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Variant class mappings
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-shd-orange hover:bg-shd-orange-hover text-background font-medium disabled:opacity-40 disabled:cursor-not-allowed",
  secondary:
    "border border-border bg-surface hover:bg-surface-hover text-foreground",
  ghost:
    "text-foreground-secondary hover:text-foreground hover:bg-surface-hover",
  danger:
    "bg-core-red/20 hover:bg-core-red/30 text-core-red font-medium",
};

// Size class mappings
const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-2.5 py-1.5 rounded",
  md: "text-sm px-4 py-2.5 rounded",
  lg: "text-base px-5 py-3 rounded-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center transition-colors cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
