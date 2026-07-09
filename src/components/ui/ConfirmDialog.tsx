import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  variant = 'primary'
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-none border-[var(--border)] shadow-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--foreground)]">{title}</DialogTitle>
          {description && <DialogDescription className="mt-2 text-[var(--foreground-muted)] text-[14px] leading-relaxed">{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="flex gap-3 justify-end sm:justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-none px-6 font-semibold">
            {cancelLabel}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'destructive' : 'default'} 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="rounded-none px-6 font-semibold shadow-sm"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
