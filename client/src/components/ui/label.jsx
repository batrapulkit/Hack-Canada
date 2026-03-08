import * as React from "react";

export const Label = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={`text-sm font-medium text-slate-700 ${className}`}
      {...props}
    />
  );
});

Label.displayName = "Label";
