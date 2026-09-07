import Loaders from "~/.server/loader"
import type { Route } from "./+types/login"
import { AnimatedIconBackground } from "~/components/LoginBg"
import { floatingIcons } from "~/components/consts/icons"
import Actions from "~/.server/action"
import { Button, Card, Divider, Input, Slides } from "@dockstat/ui"
import DockStatLogo from "~/assets/DockStat-wide-white.png"
import { Form } from "react-router"
import { validate, withValidation } from "~/.server/middleware/withValidation"
import z, { unknown } from "zod"
import { useEffect, useState } from "react"
import { HeroPanel } from "~/components/Hero"


export async function loader() {
  return {
    isGuestRegistrationAllowed: Loaders.Auth.isGuestRegAllowed(),
    authProviders: Loaders.Auth.getAuthProviders(),
  }
}

const validation = withValidation({
  localLogin: validate(
    z.object({ name: z.string().min(1), pass: z.string().min(1) }),
    Actions.Auth.localLogin
  ),
  register: validate(
    z.object({ name: z.string().min(1), pass: z.string().min(8) }),
    Actions.Auth.register
  ),
})

export const middleware: Route.MiddlewareFunction[] = [validation.middleware]
export const action = validation.action

function LoginForm() {
  return <Form method="post" className="w-full space-y-2">
    <Input<typeof validation._ops> type="operation" value="localLogin" />
    <Input type="text" name="name" placeholder="Username" />
    <Input type="password" name="pass" placeholder="Password" />
    <Divider />
    <Button type="submit" fullWidth>Log in</Button>
  </Form>
}

function RegisterForm() {
  return <Form method="post" className="w-full space-y-2">
    <Input<typeof validation._ops> type="operation" value="register" />
    <Input type="text" name="name" placeholder="Username" />
    <Input type="password" name="pass" placeholder="Password" />
    <Divider />
    <Button type="submit" fullWidth>Register</Button>
  </Form>
}

export default function Login({loaderData, actionData}: Route.ComponentProps) {
  const [isErrored, setIsErrored] = useState<string | boolean>(false)
  const [isSuccess, setIsSuccess] = useState<string | boolean>(false)
  const { isGuestRegistrationAllowed, authProviders } = loaderData

  useEffect(() => {
    if(actionData){
    if (actionData.success === false) {
      setIsErrored(actionData.message)
    } else if (actionData.success === true) {
      setIsSuccess(actionData.message)
    }}
  }, [actionData])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsErrored(false)
    }, 5 * 1000)
    return () => clearTimeout(timeout)
  }, [isErrored])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsSuccess(false)
    }, 5 * 1000)
    return () => clearTimeout(timeout)
  }, [isSuccess])

  return (
    <AnimatedIconBackground icons={floatingIcons} isError={isErrored !== false}>
      <div className="w-[90%] mx-auto flex flex-row justify-between">
        <HeroPanel error={isErrored} success={isSuccess}/>
        <Slides className="duration-500 animate-fade-in h-fit my-auto" connected glass variant="default" cardVariant="elevated" header="Login Method" buttonPosition="center">
          {{
            "Local Login": <LoginForm />,
            "OIDC Providers": <div>OIDC Providers</div>,
            "Register": isGuestRegistrationAllowed ? <RegisterForm /> : null,
          }}
        </Slides>
      </div>
      </AnimatedIconBackground>
  )
}
