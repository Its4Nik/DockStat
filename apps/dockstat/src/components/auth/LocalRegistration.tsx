import { Input } from "@dockstat/ui"
import { ArrowRight, DoorOpen, Eye, EyeOff, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useCreateUserMutations } from "@/hooks/mutations/registerUser"

export function LocalRegistration({
  allowGuest,
  isAuthenticated,
  setError,
}: {
  allowGuest: boolean
  isAuthenticated: boolean
  setError: (error: null | string) => void
}) {
  if (allowGuest === false && isAuthenticated !== true) {
    return null
  }

  const [name, setName] = useState<string>("")
  const [pass, setPass] = useState<string>("")
  const [showPass, setShowPass] = useState(false)

  const { registerLocalUser } = useCreateUserMutations()

  // Handle error from mutation
  useEffect(() => {
    if (registerLocalUser.error) {
      setError(registerLocalUser.error.toString())
    }
  }, [registerLocalUser.error, setError])

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(null)

    registerLocalUser.mutate({
      name,
      pass,
    })
  }

  const togglePassword = () => setShowPass(!showPass)

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
          <DoorOpen
            className="text-indigo-400"
            size={16}
          />
        </div>
        <div>
          <h3 className="font-semibold text-white/80">Register local Account</h3>
          <p className="text-xs text-white/30">Provide your username and password</p>
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
              disabled={registerLocalUser.isPending}
              onChange={(v) => setName(v)}
              placeholder="Enter your username"
              value={name}
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
              disabled={registerLocalUser.isPending}
              onChange={(v) => setPass(v)}
              placeholder="Enter your password"
              type={showPass ? "text" : "password"}
              value={pass}
            />
            <button
              className="shrink-0 ml-2 p-1 rounded-md text-white/20 hover:text-white/40 transition-colors"
              onClick={togglePassword}
              tabIndex={-1}
              type="button"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          className="cta-button w-full py-3.5 text-white font-semibold text-sm flex items-center justify-center gap-2"
          disabled={registerLocalUser.isPending || !name || !pass}
          type="submit"
        >
          {registerLocalUser.isPending ? (
            <>
              <Loader2
                className="animate-spin"
                size={16}
              />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  )
}
