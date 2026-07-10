import React from 'react';

interface FieldProps {
  label?: React.ReactNode;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Field — wrapper label + input conforme au design system.
 * - Label : --text-sm / --font-weight-medium / --color-text-primary
 * - Gap label→input : --space-2 (toujours, jamais plus, jamais moins)
 * - Astérisque requis : --color-primary
 */
export function Field({ label, hint, required, children, fullWidth, className }: FieldProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gridColumn: fullWidth ? '1 / -1' : undefined,
      }}
    >
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
            lineHeight: '18px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-primary)', marginLeft: 'var(--space-1)' }}>*</span>
          )}
        </label>
      )}
      {children}
      {hint && (
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--space-1)',
          display: 'block',
        }}>
          {hint}
        </span>
      )}
    </div>
  );
}
