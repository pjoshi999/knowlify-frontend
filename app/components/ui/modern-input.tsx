import * as React from "react";

export type ModernInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  }
);
ModernInput.displayName = "ModernInput";

export { ModernInput };
