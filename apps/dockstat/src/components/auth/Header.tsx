export function PageHeader() {
  return (
    <>
      <div className="hidden lg:block mb-8">
        <h2 className="text-3xl font-bold tracking-tight shimmer-text mb-2 text-primary-text">
          Welcome Back
        </h2>
        <p className="text-white/40">Sign in to your DockStat instance</p>
      </div>
      <div className="lg:hidden mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight shimmer-text mb-2">Welcome Back</h2>
        <p className="text-white/40">Sign in to your DockStat instance</p>
      </div>
    </>
  )
}
