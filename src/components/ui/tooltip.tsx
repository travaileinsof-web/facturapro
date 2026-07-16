import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { top: '50%', right: '100%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { top: '50%', left: '100%', transform: 'translateY(-50%)', marginLeft: '8px' };
      case 'top':
      default:
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
    }
  };

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className="absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-md whitespace-nowrap shadow-md"
          style={getPositionStyles()}
        >
          {content}
          <div 
            className="absolute w-2 h-2 bg-gray-900 rotate-45"
            style={{
              ...(position === 'top' && { bottom: '-4px', left: '50%', marginLeft: '-4px' }),
              ...(position === 'bottom' && { top: '-4px', left: '50%', marginLeft: '-4px' }),
              ...(position === 'left' && { right: '-4px', top: '50%', marginTop: '-4px' }),
              ...(position === 'right' && { left: '-4px', top: '50%', marginTop: '-4px' }),
            }}
          />
        </div>
      )}
    </div>
  );
}
