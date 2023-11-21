import { useResolvedPath } from "@remix-run/react";
import { useEventSource } from "remix-utils/sse/react";

export const useUploadProgress = <T>(uploadId: string) => {
  const path = useResolvedPath(`./progress/${uploadId}`);
  const progressStream = useEventSource(path.pathname, { event: uploadId });

  if (!progressStream) {
    return null;
  }

  // TODO: Error handling
  const event = JSON.parse(progressStream) as T;

  return event;
};
