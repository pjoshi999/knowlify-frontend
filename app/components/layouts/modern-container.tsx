import * as React from "react";

export interface ModernContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const ModernContainer = React.forwardRef<HTMLDivElement, ModernContainerProps>(
  ({ className, size = "xl", ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
      full: "max-w-full",
    };

    return (
      <div
        ref={ref}
        className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className || ""}`}
        {...props}
      />
    );
  }
);
ModernContainer.displayName = "ModernContainer";

export { ModernContainer };
