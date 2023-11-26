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

import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  {
    title: "🎉Successful upload!",
  },
];

export default function UploadDone() {
  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <h1 className="text-6xl font-extrabold">🎉</h1>
      <h2 className="text-4xl font-extrabold">Hooray!</h2>
      <p className="text-2xl text-muted-foreground">
        Your file upload was successful.
      </p>
    </div>
  );
}
