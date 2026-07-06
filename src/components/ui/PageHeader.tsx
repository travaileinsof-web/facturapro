import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingBottom: '24px',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {icon && (
          <div style={{
            width: '48px', height: '48px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)',
          }}>
            {icon}
          </div>
        )}
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--foreground)',
            letterSpacing: '-0.5px',
            margin: 0,
            lineHeight: 1.2
          }}>
            {title}
          </h1>
          {description && (
            <p style={{
              fontSize: '13px',
              color: 'var(--foreground-muted)',
              marginTop: '6px',
              maxWidth: '600px',
              lineHeight: 1.5
            }}>
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
