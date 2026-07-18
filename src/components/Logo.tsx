import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  showText?: boolean;
}

export function Logo({ className = '', width = 200, showText = true }: LogoProps) {
  // If showText is false, we might want to show an icon only version if we had one.
  // Assuming logo.png contains the full logo.
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} style={{ width }}>
      <img 
        src="/logo.png" 
        alt="FacturaPro Logo" 
        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}
