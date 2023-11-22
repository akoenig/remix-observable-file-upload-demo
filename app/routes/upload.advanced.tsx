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

import { json, unstable_parseMultipartFormData } from "@remix-run/node";
import { FileIcon, InfoCircledIcon, UploadIcon } from "@radix-ui/react-icons";
import {
  Form,
  useLoaderData,
  useResolvedPath,
  useSubmit,
} from "@remix-run/react";

import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { createObservableFileUploadHandler } from "remix-observable-file-uploader";
import { uploadEventBus } from "~/utils/UploadEventBus";
import { useUploadProgress } from "~/utils/useUploadProgress";

type UploadProgressEvent = Readonly<{
  uploadId: string;
  name: string;
  filename: string;
  filesizeInKilobytes: number;
  uploadedKilobytes: number;
  percentageStatus: number;
  remainingDurationInSeconds: number;
}>;

export const meta: MetaFunction = () => [
  {
    title: "Advanced Example",
  },
];

export function loader() {
  const uploadId = Date.now();

  return json({ uploadId });
}

export async function action({ request }: ActionFunctionArgs) {
  const start = Date.now();

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
  const filesizeInKilobytes = Math.floor(filesize / 1024);

  const fileUploadHandler = createObservableFileUploadHandler({
    onProgress({ name, filename, uploadedBytes }) {
      const elapsedMilliseconds = Date.now() - start;

      const averageSpeed = uploadedBytes / elapsedMilliseconds;
      const remainingBytes = filesize - uploadedBytes;
      const remainingDurationInMilliseconds = remainingBytes / averageSpeed;

      uploadEventBus.emit<UploadProgressEvent>({
        uploadId,
        name,
        filename,
        filesizeInKilobytes,
        remainingDurationInSeconds: Math.floor(
          remainingDurationInMilliseconds / 1000,
        ),
        uploadedKilobytes: Math.floor(uploadedBytes / 1024),
        percentageStatus: Math.floor((uploadedBytes * 100) / filesize),
      });
    },
    onDone({ name, filename }) {
      uploadEventBus.emit<UploadProgressEvent>({
        uploadId,
        name,
        filename,
        filesizeInKilobytes,
        remainingDurationInSeconds: 0,
        uploadedKilobytes: filesizeInKilobytes,
        percentageStatus: 100,
      });
    },
  });

  await unstable_parseMultipartFormData(request, fileUploadHandler);

  return null;
}

export default function AdvancedExample() {
  const submit = useSubmit();
  const loaderData = useLoaderData<typeof loader>();
  const currentPath = useResolvedPath(".");

  const progress = useUploadProgress<UploadProgressEvent>(loaderData.uploadId);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h3 className="text-xl font-bold">Advanced Example</h3>
        <p className="text-muted-foreground">
          This example showcases an advanced implementation of an observable
          file upload. In addition to observing the progress, it also displays
          the uploaded bytes and provides an estimate of the remaining upload
          time.
        </p>
      </header>

      <Card className="p-4 shadow-xl">
        <Form
          className="flex flex-col gap-4"
          method="POST"
          encType="multipart/form-data"
          action={`${currentPath.pathname}?uploadId=${loaderData.uploadId}`}
          onChange={(event) => {
            console.log(event);
            submit(event.currentTarget);
          }}
        >
          <label
            htmlFor="the-file"
            className="flex flex-col gap-2 items-center p-8 border-dashed rounded-lg border-slate-300 border-[1px]"
          >
            <UploadIcon className="w-8 h-8" />
            <p className="text-slate-500 text-sm">
              Select a file you want to upload.
            </p>
            <input
              id="the-file"
              name="the-file"
              type="file"
              className="hidden"
            />
          </label>

          {progress?.name ? (
            <div className="flex flex-col bg-slate-50 rounded-lg p-4 gap-4 border-slate-100 border-[1px]">
              <div className="flex gap-3">
                <FileIcon className="h-8 w-8" />
                <div className="flex flex-col gap-1 flex-1">
                  <h4 className="font-bold text-xs">{progress.filename}</h4>
                  <div className="flex text-xs text-muted-foreground">
                    <p className="flex-1">
                      {progress.uploadedKilobytes} KB /{" "}
                      {progress.filesizeInKilobytes} KB ·{" "}
                      {progress.remainingDurationInSeconds} seconds left
                    </p>
                    <p>{progress.percentageStatus}%</p>
                  </div>
                </div>
              </div>
              <Progress value={progress.percentageStatus} />
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
