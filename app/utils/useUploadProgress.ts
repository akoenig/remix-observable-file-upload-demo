import { useResolvedPath } from "@remix-run/react";
import { useEventSource } from "remix-utils/sse/react";

export const useUploadProgress = <T>(uploadId: number) => {
  // TODO: Make the event source URL configurable
  const progressStream = useEventSource(`/upload/progress/${uploadId}`, {
    event: uploadId.toString(),
  });

  if (!progressStream) {
    return null;
  }

  // TODO: Error handling
  const event = JSON.parse(progressStream) as T;

  return event;
};
