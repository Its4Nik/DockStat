import { ProtectedRoute as PRoute } from "@dockstat/auth/client"
import { Route, Routes } from "react-router"

const CreateRoutes = ({
  protectedRoutes,
  routes,
}: {
  routes?: Array<{ path: string; element: React.ReactNode }>
  protectedRoutes?: Array<{
    path: string
    element: React.ReactNode
    loadingComponent?: React.ReactNode
  }>
}) => {
  return (
    <Routes>
      {(protectedRoutes ?? []).map((r) => {
        return (
          <Route
            element={
              <PRoute
                loadingComponent={r.loadingComponent}
                redirectTo={"/login"}
              >
                {r.element}
              </PRoute>
            }
            path={r.path}
          />
        )
      })}
      {(routes ?? []).map((r) => {
        return (
          <Route
            element={r.element}
            path={r.path}
          />
        )
      })}
    </Routes>
  )
}

export default CreateRoutes
