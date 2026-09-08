import { Button, Divider, Input, Slides } from "@dockstat/ui"
import { useEffect, useState } from "react"
import { Form, useNavigate } from "react-router"
import z from "zod"
import Actions from "~/.server/action"
import Loaders from "~/.server/loader"
import { validate, withValidation } from "~/.server/middleware/withValidation"
import { floatingIcons } from "~/components/consts/icons"
import { HeroPanel } from "~/components/Hero"
import { AnimatedIconBackground } from "~/components/LoginBg"
import type { Route } from "./+types/login"

export async function loader() {
  return {
    authProviders: Loaders.Auth.getAuthProviders(),
    isGuestRegistrationAllowed: Loaders.Auth.isGuestRegAllowed(),
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
  return (
    <Form
      className="w-full space-y-2"
      method="post"
    >
      <Input<typeof validation._ops>
        type="operation"
        value="localLogin"
      />
      <Input
        name="name"
        placeholder="Username"
        type="text"
      />
      <Input
        name="pass"
        placeholder="Password"
        type="password"
      />
      <Divider />
      <Button
        fullWidth
        type="submit"
      >
        Log in
      </Button>
    </Form>
  )
}

function RegisterForm() {
  return (
    <Form
      className="w-full space-y-2"
      method="post"
    >
      <Input<typeof validation._ops>
        type="operation"
        value="register"
      />
      <Input
        name="name"
        placeholder="Username"
        type="text"
      />
      <Input
        name="pass"
        placeholder="Password"
        type="password"
      />
      <Divider />
      <Button
        fullWidth
        type="submit"
        variant="secondary"
      >
        Register
      </Button>
    </Form>
  )
}

function OidcProviders({
  providers,
}: {
  providers: { id: string; name: string | null; icon: string | null }[]
}) {
  if (providers.length === 0) {
    return <p className="text-center text-sm opacity-70">No OIDC providers configured yet.</p>
  }

  return (
    <div className="w-full space-y-2">
      {providers.map((provider) => (
        <a
          className="block"
          href={`/api/v2/auth/${provider.id}/login`}
          key={provider.id}
        >
          <Button
            fullWidth
            type="button"
            variant="secondary"
          >
            {provider.icon && (
              <img
                alt=""
                aria-hidden
                className="h-4 w-4"
                src={provider.icon}
              />
            )}
            {provider.name ?? provider.id}
          </Button>
        </a>
      ))}
    </div>
  )
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const [isErrored, setIsErrored] = useState<string | boolean>(false)
  const [isSuccess, setIsSuccess] = useState<string | boolean>(false)
  const navigate = useNavigate()
  const { isGuestRegistrationAllowed, authProviders } = loaderData

  useEffect(() => {
    if (actionData) {
      if (actionData.success === false) {
        setIsErrored(actionData.message)
      } else if (actionData.success === true) {
        setIsSuccess(actionData.message)
      }
    }
  }, [actionData])

  // Head home as soon as the session cookie is set
  useEffect(() => {
    if (actionData?.success === true && "loggedIn" in actionData) {
      const timeout = setTimeout(() => navigate("/home", { replace: true }), 400)
      return () => clearTimeout(timeout)
    }
  }, [actionData, navigate])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsErrored(false)
    }, 5 * 1000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsSuccess(false)
    }, 5 * 1000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <AnimatedIconBackground
      icons={floatingIcons}
      isError={isErrored !== false}
    >
      <div className="w-[90%] mx-auto flex flex-row justify-between">
        <HeroPanel
          error={isErrored}
          success={isSuccess}
        />
        <Slides
          buttonPosition="center"
          cardVariant="elevated"
          className="duration-500 animate-fade-in h-fit my-auto"
          connected
          glass
          header="Login Method"
          variant="default"
        >
          {{
            "Local Login": <LoginForm />,
            "OIDC Providers": <OidcProviders providers={authProviders} />,
            Register: isGuestRegistrationAllowed ? <RegisterForm /> : null,
          }}
        </Slides>
      </div>
    </AnimatedIconBackground>
  )
}
