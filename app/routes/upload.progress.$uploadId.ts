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

import type { LoaderFunctionArgs } from "@remix-run/node";
import type { UploadEvent } from "~/utils/UploadEventBus.server.ts";

import { eventStream } from "remix-utils/sse/server";
import { uploadEventBus } from "~/utils/UploadEventBus.server.ts";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const uploadId = params.uploadId;

  if (!uploadId) {
    throw new Response(null, {
      status: 400,
      statusText: "Upload ID is missing.",
    });
  }

  return eventStream(request.signal, (send) => {
    const handle = (event: UploadEvent) => {
      send({
        event: event.uploadId,
        data: JSON.stringify(event),
      });
    };

    uploadEventBus.addListener(uploadId, handle);

    return () => {
      uploadEventBus.removeListener(uploadId, handle);
    };
  });
}
