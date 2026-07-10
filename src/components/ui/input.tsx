import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full bg-transparent outline-none transition-colors",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--color-border-focus)] focus-visible:ring-1 focus-visible:ring-[var(--color-border-focus)]",
        className
      )}
      style={{
        height: '40px',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-sm)',
        padding: '0 12px',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-primary)'
      }}
      {...props}
    />
  )
}

export { Input }
