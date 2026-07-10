import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full bg-transparent outline-none transition-colors",
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--color-border-focus)] focus-visible:ring-1 focus-visible:ring-[var(--color-border-focus)]",
        className
      )}
      style={{
        minHeight: '96px',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-primary)'
      }}
      {...props}
    />
  )
}

export { Textarea }
