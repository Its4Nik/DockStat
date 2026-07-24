import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"
import type { DataPipeGraph } from "widgets/client"

/**
 * Dataflow mutations for saving and evaluating data-pipe graphs.
 */
export const useDataflowMutations = () => {
  const eden = useContext(EdenClientContext)

  const saveDataflowMutation = eden.mutateRoute({
    invalidateQueries: [["fetchDashboard"]],
    mutationKey: ["saveDataflow"],
    routeBuilder: ({ dashboardId }: { dashboardId: string }) => api.widgets["data-pipe"]({ dashboardId }).put,
    toast: {
      errorTitle: () => "Could not save dataflow",
      successTitle: () => "Dataflow saved",
    },
  })

  const evaluateDataflowMutation = eden.mutateRoute({
    mutationKey: ["evaluateDataflow"],
    routeBuilder: ({ dashboardId }: { dashboardId: string }) =>
      api.widgets["data-pipe"].evaluate({ dashboardId }).post,
    toast: {
      errorTitle: () => "Could not evaluate dataflow",
      successTitle: () => "Dataflow evaluated",
    },
  })

  return {
    evaluateDataflowMutation,
    saveDataflowMutation,
  }
}
