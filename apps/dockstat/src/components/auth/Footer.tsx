export function Footer({ showLocalHint }: { showLocalHint: boolean }) {
  return (
    <div className="text-center mt-8 space-y-2">
      <p className="text-xs text-white/20">
        By signing in, you sign in! Visit the{" "}
        <a href="https://outline.itsnik.de/s/dockstat/doc/setting-up-wip-lK4slg2Pea">setup guide</a>{" "}
        for more details.
      </p>
      {showLocalHint && (
        <p className="text-xs text-white/15">Can't see local login? Contact your administrator.</p>
      )}
    </div>
  )
}
