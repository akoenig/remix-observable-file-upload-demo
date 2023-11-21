import {
  ActionFunctionArgs,
  json,
  redirect,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form, useLoaderData, useResolvedPath } from "@remix-run/react";
import { Progress } from "~/components/ui/progress";
import { createFileUploadHandler } from "~/uploader/createFileUploadHandler.server";
import { uploadEventBus } from "~/utils/UploadEventBus";
import { useUploadProgress } from "~/utils/useUploadProgress";

export async function loader() {
  const uploadId = Date.now().toString();

  return json({ uploadId });
}

type UploadProgressEvent = Readonly<{
  uploadId: string;
  name: string;
  filename: string;
  filesize: number;
  uploadedBytes: number;
  percentageStatus: number;
}>;

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId");

  if (!uploadId) {
    throw new Response(null, {
      status: 400,
      statusText: "Upload ID was not defined.",
    });
  }

  const filesize = Number(request.headers.get("Content-Length"));

  const fileUploadHandler = createFileUploadHandler({
    onProgress({ name, filename, uploadedBytes }) {
      uploadEventBus.emit<UploadProgressEvent>({
        uploadId,
        name,
        filename,
        filesize,
        uploadedBytes,
        percentageStatus: (uploadedBytes * 100) / filesize,
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

  return redirect("/upload");
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const path = useResolvedPath(".");
  const progress = useUploadProgress<UploadProgressEvent>(loaderData.uploadId);

  return (
    <>
      <p>{loaderData.uploadId}</p>
      <Form
        method="POST"
        encType="multipart/form-data"
        action={`${path.pathname}?uploadId=${loaderData.uploadId}`}
      >
        <input name="myFile" type="file" />

        <button type="submit">Upload</button>
      </Form>
      <div className="mx-auto w-1/2 mt-8">
        <Progress value={progress?.percentageStatus} />
        {progress?.percentageStatus ? (
          <div className="text-center">
            {Math.floor(progress?.percentageStatus ?? 0)}% -{" "}
            {progress?.uploadedBytes} / {progress?.filesize}
          </div>
        ) : null}
      </div>
    </>
  );
}
