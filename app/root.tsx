/**
 * @akoenig/remix-upload-progress-demo
 *
 * Copyright, 2023 - André König, Hamburg, Germany
 *
 * All rights reserved
 */

/**
 * @author André König <hi@andrekoenig.de>
 *
 */

import type { LoaderFunctionArgs } from "@remix-run/node";

import "~/styles/globals.css";

import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { json } from "@remix-run/node";
import { Confetti } from "~/components/Confetti";
import { getConfetti } from "./utils/confetti.server.ts";
import { combineHeaders } from "./utils/misc.server.ts";

export function loader({ request }: LoaderFunctionArgs) {
  const { confettiId, headers: confettiHeaders } = getConfetti(request);

  return json(
    {
      confettiId,
    },
    {
      headers: combineHeaders(confettiHeaders),
    },
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.90em%22 font-size=%2290%22>🌀</text></svg>"
        />
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

        <Confetti id={loaderData.confettiId} />
      </body>
    </html>
  );
}
