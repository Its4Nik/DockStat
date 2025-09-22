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
export { loader, action } from "react-router-theme";
export const clientLogger = createLogger("DockStat-Client")

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className='bg-main-bg text-text-primary'>
        <Nav />
        {/* <CardNav brandName={'DockStat'} cardNavItems={NavItems} logo='/assets/DockStat-Logo.png'/> */}
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <Outlet />
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
