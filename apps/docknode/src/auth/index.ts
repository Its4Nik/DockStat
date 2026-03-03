import { betterAuth } from "better-auth"
import { apiKey } from "better-auth/plugins"

export const auth = betterAuth({
  logger: {
    disableColors: false,
    disabled: false,
    level: "debug",
  },
  plugins: [apiKey({ apiKeyHeaders: "x-docknode-key", defaultPrefix: "dn_" })],
})
