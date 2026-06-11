import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level?: 'NORMAL' | 'WARNING' | 'DANGER';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', level = 'NORMAL', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-none border-brutal px-2.5 py-0.5 text-xs font-heading font-bold transition-colors min-h-[24px] uppercase';
    
    const variants = {
      NORMAL: 'bg-brutal-success/10 border-brutal-success text-brutal-success',
      WARNING: 'bg-brutal-warning/10 border-brutal-warning text-brutal-warning',
      DANGER: 'bg-brutal-orange/10 border-brutal-orange text-brutal-orange',
    };

    return (
      <span ref={ref} className={`${baseStyles} ${variants[level]} ${className}`} {...props} />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
