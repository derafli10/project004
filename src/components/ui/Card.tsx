import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`bg-brutal-black border-brutal-border border-brutal rounded-none shadow-brutal p-6 ${className}`} 
        {...props} 
      />
    );
  }
);
Card.displayName = 'Card';

export { Card };
