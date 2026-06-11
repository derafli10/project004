import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-heading font-bold transition-all disabled:opacity-50 disabled:pointer-events-none border-brutal rounded-none focus:outline-none focus:ring-2 focus:ring-brutal-orange focus:ring-offset-2 focus:ring-offset-brutal-black min-h-[44px] min-w-[44px]';
    
    const variants = {
      primary: 'bg-brutal-black text-brutal-text border-brutal-border hover:shadow-brutal hover:-translate-y-[2px] hover:-translate-x-[2px]',
      secondary: 'bg-brutal-border text-brutal-black border-brutal-black hover:shadow-brutal hover:-translate-y-[2px] hover:-translate-x-[2px]',
      danger: 'bg-brutal-orange text-brutal-text border-brutal-orange hover:shadow-brutal hover:-translate-y-[2px] hover:-translate-x-[2px]',
      ghost: 'border-transparent bg-transparent hover:bg-brutal-border/10 text-brutal-text',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    return (
      <button ref={ref} className={combinedClassName} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button };
