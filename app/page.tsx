import { ArrowRight } from "lucide-react";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="card-brutal max-w-2xl w-full text-center space-y-8">
        <h1 className="text-brutal-text">
          Grade Optimizer
        </h1>
        
        <p className="text-brutal-text-secondary text-lg font-body">
          Enterprise-scale Academic Performance Management System
        </p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="border-brutal border-brutal-border p-4">
              <h3 className="text-brutal-orange text-xl mb-2">Integer Precision</h3>
              <p className="text-sm text-brutal-text-secondary">
                Zero floating-point errors with integer-based mathematics
              </p>
            </div>
            
            <div className="border-brutal border-brutal-border p-4">
              <h3 className="text-brutal-orange text-xl mb-2">Multi-Tenant</h3>
              <p className="text-sm text-brutal-text-secondary">
                Strict data isolation with session-based security
              </p>
            </div>
            
            <div className="border-brutal border-brutal-border p-4">
              <h3 className="text-brutal-orange text-xl mb-2">Brutalist Design</h3>
              <p className="text-sm text-brutal-text-secondary">
                High-contrast interface for maximum clarity
              </p>
            </div>
          </div>
          
          <button className="btn-brutal flex items-center justify-center gap-2 w-full touch-target">
            Get Started
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="border-t-brutal border-brutal-border pt-6">
          <p className="text-xs text-brutal-text-muted">
            Production-Ready • TypeScript Strict Mode • Next.js 15+
          </p>
        </div>
      </div>
    </main>
  );
}
