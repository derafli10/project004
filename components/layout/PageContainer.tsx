import React from 'react';

export function PageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-col min-h-screen bg-brutal-black text-brutal-text">
      <div className="md:px-64 flex flex-col flex-1">
        <main id="main-content" tabIndex={-1} className={`flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 focus:outline-none ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
