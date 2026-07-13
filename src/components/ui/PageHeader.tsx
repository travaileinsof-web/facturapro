import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  badge?: string;
}

export function PageHeader({ title, description, icon, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start"
      style={{
        gap: 'var(--space-4)',
        paddingBottom: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
      }}>
      {/* Gold accent line */}
      <div style={{
        position: 'absolute',
        bottom: -1,
        left: 0,
        width: '64px',
        height: '2px',
        background: 'var(--gold)',
      }} />

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        {icon && (
          <div style={{
            width: '46px', height: '46px',
            background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
            border: '1px solid var(--border-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--foreground)',
              letterSpacing: '-0.4px',
              margin: 0,
              lineHeight: 1.2
            }}>
              {title}
            </h1>
            {badge && (
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                background: 'var(--gold-dim)',
                border: '1px solid var(--border-gold)',
                padding: 'var(--space-1) var(--space-2)',
              }}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p style={{
              fontSize: '13px',
              color: 'var(--foreground-muted)',
              marginTop: 'var(--space-1)',
              maxWidth: '560px',
              lineHeight: 1.55
            }}>
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full md:w-auto mt-4 md:mt-0" style={{ flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
