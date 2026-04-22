import { SiAuthentik, SiGithub, SiGoogle, SiKeycloak, SiOkta } from "@icons-pack/react-simple-icons"
import { LockKeyhole } from "lucide-react"

export function getProviderLogo(issuerUrl: string): { name: string; icon: React.ReactNode } {
  const lowerUrl = issuerUrl.toLowerCase()

  if (lowerUrl.includes("google.com")) {
    return { icon: <SiGoogle size={18} />, name: "Google" }
  }
  if (lowerUrl.includes("github.com")) {
    return { icon: <SiGithub size={18} />, name: "GitHub" }
  }
  if (lowerUrl.includes("authentik")) {
    return { icon: <SiAuthentik size={18} />, name: "Authentik" }
  }
  if (lowerUrl.includes("keycloak")) {
    return { icon: <SiKeycloak size={18} />, name: "Keycloak" }
  }
  if (lowerUrl.includes("okta.com")) {
    return { icon: <SiOkta size={18} />, name: "Okta" }
  }

  try {
    const url = new URL(issuerUrl)
    const hostname = url.hostname
    const name = hostname.replace("accounts.", "").replace("login.", "")
    return {
      icon: <LockKeyhole size={18} />,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }
  } catch {
    return { icon: <LockKeyhole size={18} />, name: "OAuth Provider" }
  }
}
