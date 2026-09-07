import Loaders from "~/.server/loader"
import type { Route } from "./+types/login"
import { AnimatedIconBackground } from "~/components/LoginBg"
import { floatingIcons } from "~/components/consts/icons"
import Actions from "~/.server/action"
import { Button, Divider, Input, Slides } from "@dockstat/ui"
import DockStatLogo from "~/assets/DockStat-wide-white.png"
import { Form } from "react-router"
import { withValidation } from "~/.server/middleware/withValidation"
import z from "zod"


export async function loader() {
  return {
    isGuestRegistrationAllowed: Loaders.Auth.isGuestRegAllowed(),
    authProviders: Loaders.Auth.getAuthProviders(),
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()
  const operation = formData.get("__operation__")

  switch (operation) {
    case "localLogin":
      return await  withValidation(z.object(()), Actions.Auth.localLogin({ request, params }))
    case "register":
      return await Actions.Auth.register({ request, params })
    default:
      return "No Operation!"
  }
}

function RegisterForm() {
  return <Form method="post" className="w-full space-y-2">
    <input type="hidden" name="__operation__" value="register" />
    <Input type="text" name="username" placeholder="Username" />
    <Input type="password" name="password" placeholder="Password" />
    <Divider />
    <Button type="submit" fullWidth>Register</Button>
  </Form>
}

export default function Login({loaderData, actionData}: Route.ComponentProps) {
  const { isGuestRegistrationAllowed, authProviders } = loaderData

  return (
    <AnimatedIconBackground icons={floatingIcons}>
      <div className="w-[90%] mx-auto flex flex-row justify-between">
        <div>
          <img src={DockStatLogo} alt="DockStat Logo" className="h-40" />
        </div>
          <Slides connected variant="default" header="Login Method" className="max-w-96">
            {{
            "Local Login": <div>Local Login</div>,
            "OIDC Providers": <div>OIDC Providers</div>,
            "Register": isGuestRegistrationAllowed ? <RegisterForm /> : null,
          }}
        </Slides>
      </div>
      </AnimatedIconBackground>
  )
}
