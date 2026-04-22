export function getProviderInfo(issuerUrl: string): { name: string; icon: string } {
  const lowerUrl = issuerUrl.toLowerCase()

  if (lowerUrl.includes("google.com")) {
    return { icon: "G", name: "Google" }
  }
  if (lowerUrl.includes("github.com")) {
    return { icon: "GH", name: "GitHub" }
  }
  if (lowerUrl.includes("microsoft.com") || lowerUrl.includes("login.microsoftonline.com")) {
    return { icon: "MS", name: "Microsoft" }
  }
  if (lowerUrl.includes("authentik")) {
    return { icon: "A", name: "Authentik" }
  }
  if (lowerUrl.includes("keycloak")) {
    return { icon: "K", name: "Keycloak" }
  }
  if (lowerUrl.includes("okta.com")) {
    return { icon: "O", name: "Okta" }
  }

  // Extract domain for custom providers
  try {
    const url = new URL(issuerUrl)
    const hostname = url.hostname
    const name = hostname.replace("accounts.", "").replace("login.", "")
    return {
      icon: name.slice(0, 2).toUpperCase(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }
  } catch {
    return { icon: "🔐", name: "OAuth Provider" }
  }
}
