import { ServerAPI } from ".."

export const Plugins = {
  loader: async () => {
    ServerAPI.plugins.status.get()
    ServerAPI.plugins.routes.get()
  },
}
