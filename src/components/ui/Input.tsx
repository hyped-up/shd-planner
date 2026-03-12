// Styled text input with label and error state
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs uppercase tracking-wider text-foreground-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none transition-colors ${
            error
              ? "border-core-red focus:border-core-red"
              : "border-border focus:border-shd-orange"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-core-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
