import type { LucideProps } from "lucide-react"
import type { ForwardRefExoticComponent } from "react"
import { mapIconNameToIcon } from "../settings/accounts/sections/oAuthProviders"

export function getProviderLogo(
  issuerUrl: string,
  iconName: string
): { name: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref">> } {
  const icon = mapIconNameToIcon(iconName)

  try {
    const url = new URL(issuerUrl)
    const hostname = url.hostname
    const name = hostname.replace("accounts.", "").replace("login.", "")
    return {
      icon,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }
  } catch {
    return { icon, name: "OAuth Provider" }
  }
}
