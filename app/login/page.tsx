
export default function LoginPage() {
  // Temporary mock for development
  return (
    <div className="min-h-screen flex items-center justify-center text-white p-4">
      <div className="w-full max-w-md border-brutal border-white p-8">
        <h1 className="text-2xl font-grotesk font-bold mb-6 text-brutal-orange">Grade Optimizer Login</h1>
        <p className="font-sans mb-4 text-zinc-400">
          This is a temporary development login page. In production, this will be replaced by an actual authentication provider.
        </p>
        <form action="/api/auth/mock" method="POST" className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-sans text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-transparent border-2 border-zinc-700 p-2 font-mono focus:border-brutal-orange focus:outline-none rounded-none"
              placeholder="student@apps.ipb.ac.id"
            />
          </div>
          <div>
            <label htmlFor="tenantId" className="block font-sans text-sm font-medium mb-1">
              Tenant ID
            </label>
            <input
              id="tenantId"
              name="tenantId"
              type="text"
              required
              className="w-full bg-transparent border-2 border-zinc-700 p-2 font-mono focus:border-brutal-orange focus:outline-none rounded-none"
              placeholder="tenant-123"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brutal-orange text-brutal-black border-2 border-brutal-orange font-bold font-sans py-3 hover:bg-transparent hover:text-brutal-orange transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
