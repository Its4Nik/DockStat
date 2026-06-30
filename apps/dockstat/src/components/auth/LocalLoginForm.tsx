import { Input } from "@dockstat/ui"
import { ArrowRight, Eye, EyeOff, Loader2, Shield } from "lucide-react"
import { useLocalLogin } from "@/hooks/useLocalLogin"

export function LocalLoginForm({
  error,
  setError,
}: {
  error: string | null
  setError: (err: string | null) => void
}) {
  const { formData, isSubmitting, showPassword, handleSubmit, updateField, togglePassword } =
    useLocalLogin({ error, setError })

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
          <Shield
            className="text-indigo-400"
            size={16}
          />
        </div>
        <div>
          <h3 className="font-semibold text-white/80">Local Account</h3>
          <p className="text-xs text-white/30">Use your username and password</p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30">
            Username
          </p>
          <div className="field-shell px-4 py-3">
            <Input
              className="bg-transparent! border-0! shadow-none! p-0! ring-0! w-full text-sm text-white/80 placeholder:text-white/25"
              disabled={isSubmitting}
              onChange={(v) => updateField("name", v)}
              placeholder="Enter your username"
              value={formData.name}
            />
          </div>
        </div>

        <div>
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30">
            Password
          </p>
          <div className="field-shell px-4 py-3 flex items-center">
            <Input
              className="bg-transparent! border-0! shadow-none! p-0! ring-0! w-full text-sm text-white/80 placeholder:text-white/25"
              disabled={isSubmitting}
              onChange={(v) => updateField("pass", v)}
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={formData.pass}
            />
            <button
              className="shrink-0 ml-2 p-1 rounded-md text-white/20 hover:text-white/40 transition-colors"
              onClick={togglePassword}
              tabIndex={-1}
              type="button"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          className="cta-button w-full py-3.5 text-white font-semibold text-sm flex items-center justify-center gap-2"
          disabled={isSubmitting || !formData.name || !formData.pass}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="animate-spin"
                size={16}
              />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  )
}
