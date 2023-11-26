/**
 * @akoenig/remix-observable-file-upload-demo
 *
 * Copyright, 2023 - André König, Hamburg, Germany
 *
 * All rights reserved
 */

/**
 * @author André König <hi@andrekoenig.de>
 *
 */

import {
  ExclamationTriangleIcon,
  FileTextIcon,
  GitHubLogoIcon,
} from "@radix-ui/react-icons";
import { Link, NavLink, Outlet } from "@remix-run/react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert.tsx";
import { Separator } from "~/components/ui/separator.tsx";
import { cn } from "~/framework/shadcn.ts";

export default function Index() {
  return (
    <div className="hidden space-y-6 p-10 pb-16 md:block">
      <div className="space-y-0.5 flex">
        <h2 className="text-xl font-extrabold tracking-tight flex-1">
          <Link to="/upload/basic">Remix Observable Uploads</Link>
        </h2>
        <ul className="flex gap-4">
          <li>
            <Link
              to="https://github.com/akoenig/remix-observable-file-uploads-demo"
              className="flex items-center gap-1"
            >
              <GitHubLogoIcon /> Repository
            </Link>
          </li>
          <li>
            <Link to="https://andrekoenig.de/articles/real-time-file-upload-progress-remix" className="flex items-center gap-1">
              <FileTextIcon /> Docs
            </Link>
          </li>
        </ul>
      </div>
      <Separator className="my-6" />

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5 flex flex-col gap-10 h-full">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-4">
            <NavLink
              to="/upload/basic"
              className={({ isActive }) =>
                cn(
                  "text-sm rounded-lg bg-muted py-2 px-4",
                  isActive && "bg-black text-white",
                )
              }
            >
              Basic
            </NavLink>
            <NavLink
              to="/upload/advanced"
              className={({ isActive }) =>
                cn(
                  "text-sm rounded-lg bg-muted py-2 px-4",
                  isActive && "bg-black text-white",
                )
              }
            >
              Advanced
            </NavLink>
          </nav>

          <Alert>
            <ExclamationTriangleIcon />
            <AlertTitle>Throttling</AlertTitle>
            <AlertDescription>
              For precise monitoring of the upload progress, throttle your
              browser's connection using the{" "}
              <Link
                to="https://developer.chrome.com/docs/devtools/settings/throttling/"
                className="text-pink-500 underline"
              >
                developer tools
              </Link>
              .
            </AlertDescription>
          </Alert>
        </aside>
        <div className="flex-1 lg:max-w-3xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
