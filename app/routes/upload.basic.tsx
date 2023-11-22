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
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";

import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  json,
  redirect,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form, Link, useLoaderData, useResolvedPath } from "@remix-run/react";
import { createObservableFileUploadHandler } from "remix-observable-file-uploader";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { uploadEventBus } from "~/utils/UploadEventBus";
import { useUploadProgress } from "~/utils/useUploadProgress";
import { redirectWithConfetti } from "~/utils/confetti.server";

type UploadProgressEvent = Readonly<{
  uploadId: string;
  name: string;
  filename: string;
  filesize: number;
  uploadedBytes: number;
  percentageStatus: number;
}>;

export const meta: MetaFunction = () => [
  {
    title: "Basic Example",
  },
];

export function loader() {
  const uploadId = Date.now();

  return json({ uploadId });
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId");

  if (!uploadId) {
    throw new Response(null, {
      status: 400,
      statusText: "Upload ID is missing.",
    });
  }

  // Get the overall filesize of the uploadable file.
  const filesize = Number(request.headers.get("Content-Length"));

  const fileUploadHandler = createObservableFileUploadHandler({
    maxPartSize: 100_000_000,
    onProgress({ name, filename, uploadedBytes }) {
      uploadEventBus.emit<UploadProgressEvent>({
        uploadId,
        name,
        filename,
        filesize,
        uploadedBytes,
        percentageStatus: Math.floor((uploadedBytes * 100) / filesize),
      });
    },
    onDone({ name, filename, uploadedBytes }) {
      uploadEventBus.emit<UploadProgressEvent>({
        uploadId,
        name,
        filename,
        filesize,
        uploadedBytes,
        percentageStatus: 100,
      });
    },
  });

  await unstable_parseMultipartFormData(request, fileUploadHandler);

  return redirectWithConfetti("/upload/done");
}

export default function BasicExample() {
  const loaderData = useLoaderData<typeof loader>();
  const currentPath = useResolvedPath(".");

  const progress = useUploadProgress<UploadProgressEvent>(loaderData.uploadId);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h3 className="text-xl font-bold">Basic Example</h3>
        <p className="text-muted-foreground">
          This example showcases a basic implementation of an observable file
          upload by utilizing an file input field an a action. Although the
          actual client implementation is straightforward, the demo still
          streams the upload progress to the client via{" "}
          <Link
            className="text-pink-500 underline"
            to="https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"
          >
            SSE
          </Link>
          .
        </p>
      </header>

      <Card className="p-4 shadow-xl">
        <Form
          className="flex flex-col gap-4"
          method="POST"
          encType="multipart/form-data"
          action={`${currentPath.pathname}?uploadId=${loaderData.uploadId}`}
        >
          <input name="the-file" type="file" />

          <Button type="submit">Upload</Button>

          {progress?.success && progress.event ? (
            <div className="flex flex-col gap-4">
              <Progress value={progress.event.percentageStatus} />
              <p className="text-center text-muted-foreground">
                {progress.event.percentageStatus}% ·{" "}
                {progress.event.uploadedBytes} / {progress.event.filesize} bytes
                transferred
              </p>
            </div>
          ) : null}
        </Form>
      </Card>

      <p className="flex gap-2 text-xs text-muted-foreground items-center justify-center p-4">
        <InfoCircledIcon className="w-4 h-4" />
        Although the uploaded files are deleted after some time, please refrain
        from uploading any sensitive files here.
      </p>
    </section>
  );
}
