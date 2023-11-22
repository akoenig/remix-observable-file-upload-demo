import {
  Link,
  Links,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "@remix-run/react";

import "~/styles/globals.css";
import { Separator } from "./components/ui/separator";
import { cn } from "./framework/shadcn";
import {
  ExclamationTriangleIcon,
  HeartFilledIcon,
} from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col h-full">
        <div className="flex-1">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <footer className="text-xs text-muted-foreground flex items-center justify-center py-4">
          <Link to="https://andrekoenig.de">
            Made by <span className="underline">André König</span>
          </Link>
        </footer>
      </body>
    </html>
  );
}
