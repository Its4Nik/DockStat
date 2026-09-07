import { redirect, useNavigate, useOutletContext } from "react-router"
import type { RootContext } from "~/root"
import type { Route } from "../routes/+types/layout"

export const middleware: Route.MiddlewareFunction[] = [
  async () => {
    const isNotLoggedIn = useOutletContext<RootContext>().auth.user === null

    if (isNotLoggedIn) {
      return redirect("/login", {statusText: "Not Authorized", status: 401})
    }
  }
]

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return (<>{children}</>)
}
