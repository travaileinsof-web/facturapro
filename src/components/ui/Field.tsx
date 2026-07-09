import React from 'react';

export function Field({ label, children, hint }: { label: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.2px' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginTop: '4px' }}>{hint}</p>}
    </div>
  );
}
