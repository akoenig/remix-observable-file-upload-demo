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

import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";

import { InfoCircledIcon } from "@radix-ui/react-icons";
import { json, unstable_parseMultipartFormData } from "@remix-run/node";
import { Form, Link, useLoaderData, useResolvedPath } from "@remix-run/react";
import { nanoid } from "nanoid";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { Progress } from "~/components/ui/progress.tsx";
import { uploadEventBus } from "~/utils/UploadEventBus.server.ts";
import { redirectWithConfetti } from "~/utils/confetti.server.ts";
import { createObservableFileUploadHandler } from "~/utils/createObservableFileUploadHandler.server.ts";
import { useUploadProgress } from "~/utils/useUploadProgress.ts";

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
  const uploadId = nanoid();

  return json({ uploadId });
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId");

  const maxPartSize = 100_000_000; // 100 MB

  if (!uploadId) {
    throw new Response(null, {
      status: 400,
      statusText: "Upload ID is missing.",
    });
  }

  // Get the overall filesize of the uploadable file.
  const filesize = Number(request.headers.get("Content-Length"));

  if (filesize > maxPartSize) {
    throw new Response(null, {
      status: 400,
      statusText: "File size exceeded",
    });
  }

  const observableFileUploadHandler = createObservableFileUploadHandler({
    avoidFileConflicts: true,
    maxPartSize,
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

  await unstable_parseMultipartFormData(request, observableFileUploadHandler);

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
          This example demonstrates a basic implementation of an observable file
          upload by utilizing a file input field and an action. Although the
          client implementation is straightforward, the example streams the
          upload progress to the client via{" "}
          <Link
            className="text-pink-500 underline"
            to="https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"
          >
            SSE
          </Link>{" "}
          and displays it as a progress bar.
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

          <p className="text-center text-muted-foreground">
            <small>
              max. 100 MB (configurable via{" "}
              <Link
                to="https://github.com/akoenig/remix-observable-file-upload-demo/blob/d617b3a3f90fe8e87ef56081cf95512095332b6e/app/routes/upload.basic.tsx#L74"
                className="text-pink-500 underline"
              >
                maxPartSize
              </Link>
              )
            </small>
          </p>

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
