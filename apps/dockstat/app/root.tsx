import './app.css'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
} from 'react-router'
import type { Route } from './+types/root'
import { createLogger } from '@dockstat/logger';
import { Card, CardBody, CardFooter, CardHeader } from './components/ui/Card';
import Nav from './components/ui/Nav';
import type { DATABASE, THEME } from '@dockstat/typings';
import { useState } from 'react';
import { useOutletContext } from 'react-router';
export const clientLogger = createLogger("DockStat-Client")
export { loader } from "~/routes/api.v1.conf"

export function Body({ DB_Config, children }: { children: React.ReactNode, DB_Config: DATABASE.DB_config }) {
  return (
    <>
      <div className='mb-20'>
        <Nav links={DB_Config.nav_links} />
      </div>
      {children}
      <ScrollRestoration />
      <Scripts />
    </>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<DATABASE.DB_config>()
  const context = useOutletContext<OutletContext>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>

    </html>
  )
}

type OutletContext = {
  theme: THEME.ThemeTable | undefined
  setTheme: React.Dispatch<React.SetStateAction<THEME.ThemeTable | undefined>>
}

export default function App() {
  const [theme, setTheme] = useState<THEME.ThemeTable>()

  return (
    <Outlet context={{ theme: theme, setTheme: setTheme } satisfies OutletContext} />
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto text-text-primary">
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <Card>
            <CardHeader>
              <h1 className='text-3xl text-red-500'>{message}</h1>
            </CardHeader>
            <CardBody>
              <p>{details}</p>
            </CardBody>
            <CardFooter>
              <code>{stack}</code>
            </CardFooter>
          </Card>
        </pre>
      )}
    </main>
  )
}
