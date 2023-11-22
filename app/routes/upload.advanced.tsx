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

import { FileIcon, InfoCircledIcon, UploadIcon } from "@radix-ui/react-icons";
import { Form } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

export default function UploadWithProgressBar() {
  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h3 className="text-xl font-bold">Advanced Upload</h3>
        <p className="text-muted-foreground">
          This example showcases an advanced implementation of an observable
          file upload. In addition to observing the progress, it also displays
          the uploaded bytes and provides an estimate of the remaining upload
          time.
        </p>
      </header>

      <Card className="p-4 shadow-xl">
        <Form className="flex flex-col gap-4">
          <label
            htmlFor="upload"
            className="flex flex-col gap-2 items-center p-8 border-dashed rounded-lg border-slate-300 border-[1px]"
          >
            <UploadIcon className="w-8 h-8" />
            <p className="text-slate-500 text-sm">
              Select a file you want to upload.
            </p>
            <input id="upload" type="file" className="hidden" />
          </label>

          <div className="flex flex-col bg-slate-50 rounded-lg p-4 gap-4 border-slate-100 border-[1px]">
            <div className="flex gap-3">
              <FileIcon className="h-8 w-8" />
              <div className="flex flex-col gap-1 flex-1">
                <h4 className="font-bold text-xs">Filename.jpg</h4>
                <div className="flex text-xs text-muted-foreground">
                  <p className="flex-1">443KB / 2 seconds left</p>
                  <p>100%</p>
                </div>
              </div>
            </div>
            <Progress value={50} />
          </div>
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
