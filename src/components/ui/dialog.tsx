import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-sm duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-4rem)] -translate-x-1/2 -translate-y-1/2 bg-[var(--surface)] text-sm text-[var(--foreground)] shadow-[0_32px_96px_rgba(0,0,0,0.18)] rounded-none border border-[var(--border)] duration-150 outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97] overflow-hidden flex-col",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ 
  className, icon: Icon, title, desc, children, ...props 
}: React.ComponentProps<"div"> & { icon?: any, title?: React.ReactNode, desc?: React.ReactNode }) {
  if (Icon || title || desc) {
    return (
      <div data-slot="dialog-header" className={cn("flex flex-col bg-[var(--surface)] shrink-0", className)} {...props}>
        <div className="flex gap-6 items-center px-10 pt-10 pb-8">
          {Icon && (
            <div className="flex shrink-0 items-center justify-center bg-[var(--gold-dim)] text-[var(--gold)]" style={{ width: '54px', height: '54px', borderRadius: 0 }}>
              <Icon size={24} strokeWidth={1.5} />
            </div>
          )}
          <div className="flex flex-col justify-center">
            {title && (typeof title === 'string' ? <DialogTitle className="text-[20px] tracking-tight mb-1.5">{title}</DialogTitle> : title)}
            {desc && <p className="text-[14px] text-[var(--foreground-muted)] font-normal">{desc}</p>}
          </div>
        </div>
        <div className="h-[1px] bg-[var(--border)] w-full" />
        {children}
      </div>
    )
  }

  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 px-8 pt-8 pb-5 bg-[var(--surface)] border-b border-[var(--border)]", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-3 px-8 py-6 bg-[var(--surface-2)] border-t border-[var(--border)] sm:flex-row sm:justify-end mt-auto",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-display text-xl font-bold tracking-tight text-[var(--foreground)]",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
