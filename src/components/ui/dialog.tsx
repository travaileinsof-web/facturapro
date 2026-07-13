import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

/** Three fixed sizes only — never create a custom width per form */
export type ModalSize = 'sm' | 'md' | 'lg'

const MODAL_SIZE_MAP: Record<ModalSize, string> = {
  sm: 'w-[calc(100vw-2rem)] sm:w-full max-w-[var(--modal-width-sm)]',   /* 480px — Catalog */
  md: 'w-[calc(100vw-2rem)] sm:w-full max-w-[var(--modal-width-md)]',   /* 720px — Client, Receipt */
  lg: 'w-[calc(100vw-2rem)] lg:w-full max-w-[var(--modal-width-lg)]',   /* 960px — Invoice */
}

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
        "fixed inset-0 isolate z-50 bg-black/25 supports-backdrop-filter:backdrop-blur-sm duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
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
  size = 'md',
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  size?: ModalSize
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          /* positioning */
          "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          /* structure */
          "flex flex-col overflow-hidden",
          /* size from design system */
          MODAL_SIZE_MAP[size],
          "max-h-[90vh]",
          /* visual */
          "bg-[var(--color-bg-modal-header)] text-[var(--color-text-primary)]",
          "shadow-[var(--shadow-lg)] rounded-[var(--radius-lg)]",
          "border border-[var(--color-border-subtle)]",
          /* animation */
          "duration-150 outline-none",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            style={{
              position: 'absolute',
              top: 'var(--space-4)',
              right: 'var(--space-4)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--color-border-subtle)';
              el.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'transparent';
              el.style.color = 'var(--color-text-secondary)';
            }}
          >
            <XIcon size={16} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/** MODAL HEADER — padding --space-5 all around, icon + title + subtitle, bottom border */
function DialogHeader({
  className,
  icon: Icon,
  title,
  desc,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string; className?: string; style?: React.CSSProperties }>
  title?: React.ReactNode
  desc?: React.ReactNode
}) {
  if (Icon || title || desc) {
    return (
      <div
        data-slot="dialog-header"
        className={cn("flex flex-col shrink-0", className)}
        style={{
          padding: 'var(--space-5)',
          background: 'var(--color-bg-modal-header)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {Icon && (
            <div
              style={{
                width: '40px',
                height: '40px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-primary-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Icon
                size={18}
                strokeWidth={1.75}
                color="var(--color-primary)"
                style={{ flexShrink: 0 } as React.CSSProperties}
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {title && (
              typeof title === 'string'
                ? <DialogTitle>{title}</DialogTitle>
                : title
            )}
            {desc && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>{desc}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 shrink-0", className)}
      style={{
        padding: 'var(--space-5)',
        background: 'var(--color-bg-modal-header)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}

/** MODAL FOOTER — footer bg, top border, buttons right-aligned with --space-3 gap */
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
      className={cn("flex shrink-0 mt-auto", className)}
      style={{
        padding: 'var(--space-4) var(--space-5)',
        background: 'var(--color-bg-modal-footer)',
        borderTop: '1px solid var(--color-border-subtle)',
        justifyContent: 'flex-end',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
      }}
      {...props}
    >
      {showCloseButton && (
        <DialogPrimitive.Close
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '0 var(--space-4)',
            height: '40px',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
          }}
        >
          Fermer
        </DialogPrimitive.Close>
      )}
      {children}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(className)}
      style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        margin: 0,
        lineHeight: '28px',
      }}
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
      className={cn(className)}
      style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}
      {...props}
    />
  )
}

/** MODAL BODY — scrollable, --space-5 padding, scroll indicators */
function DialogBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("flex-1 overflow-y-auto custom-scrollbar", className)}
      style={{
        background: 'var(--color-bg-modal-body)',
        padding: 'var(--space-5)',
        overscrollBehavior: 'contain',
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
