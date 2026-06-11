import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-11 w-full border-brutal border-brutal-border bg-brutal-black px-3 py-2 text-base text-brutal-text placeholder:text-brutal-text-muted focus:outline-none focus:ring-2 focus:ring-brutal-orange focus:border-brutal-orange disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
