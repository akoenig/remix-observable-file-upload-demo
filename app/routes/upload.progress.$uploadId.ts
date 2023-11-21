import { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { UploadEvent, uploadEventBus } from "~/utils/UploadEventBus";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const uploadId = params.uploadId;

  // TODO: Add zod parsing
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
