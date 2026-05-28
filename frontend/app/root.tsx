import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { LinksFunction } from 'react-router'
import appStyles from './app.css?url'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: appStyles },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fintech App</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gray-50">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
