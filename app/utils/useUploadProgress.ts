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

import { useEventSource } from "remix-utils/sse/react";

export const useUploadProgress = <T>(
  uploadId: string,
  progressBaseUrl = "/upload/progress",
) => {
  const progressStream = useEventSource(`${progressBaseUrl}/${uploadId}`, {
    event: uploadId.toString(),
  });

  if (progressStream) {
    try {
      const event = JSON.parse(progressStream) as T;

      return { success: true, event } as const;
    } catch (cause) {
      return { success: false };
    }
  }
};
