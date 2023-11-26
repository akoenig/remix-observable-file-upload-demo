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

/**
 * This is a fork of the official [unstable_createFileUploadHandler](https://github.com/remix-run/remix/blob/main/packages/remix-node/upload/fileUploadHandler.ts)
 * function by me [André König](https://andrekoenig.de).
 * 
 * I have extended the upload handler with two new callback functions
 * that can be defined to receive updates on the upload progress and
 * the status of a completed upload.
 *
 */

import type { Readable } from "node:stream";
import type {
  UploadHandler,
  UploadHandlerPart,
} from "@remix-run/server-runtime";

import { randomBytes } from "node:crypto";
import { createReadStream, createWriteStream, statSync } from "node:fs";
import { mkdir, rm, stat as statAsync, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, resolve as resolvePath } from "node:path";
import { finished } from "node:stream";
import { promisify } from "node:util";
import {
  createReadableStreamFromReadable,
  readableStreamToString,
} from "@remix-run/node";
import { MaxPartSizeExceededError } from "@remix-run/server-runtime";
// @ts-expect-error
import * as streamSlice from "stream-slice";

export type FileUploadHandlerFilterArgs = {
  filename: string;
  contentType: string;
  name: string;
};

export type FileUploadHandlerPathResolverArgs = {
  filename: string;
  contentType: string;
  name: string;
};

/**
 * Chooses the path of the file to be uploaded. If a string is not
 * returned the file will not be written.
 */
export type FileUploadHandlerPathResolver = (
  args: FileUploadHandlerPathResolverArgs,
) => string | undefined;

export type FileUploadHandlerOptions = {
  /**
   * Avoid file conflicts by appending a count on the end of the filename
   * if it already exists on disk. Defaults to `true`.
   */
  avoidFileConflicts?: boolean;
  /**
   * The directory to write the upload.
   */
  directory?: string | FileUploadHandlerPathResolver;
  /**
   * The name of the file in the directory. Can be a relative path, the directory
   * structure will be created if it does not exist.
   */
  file?: FileUploadHandlerPathResolver;
  /**
   * The maximum upload size allowed. If the size is exceeded an error will be thrown.
   * Defaults to 3000000B (3MB).
   */
  maxPartSize?: number;
  /**
   *
   * @param filename
   * @param contentType
   * @param name
   */
  filter?(args: FileUploadHandlerFilterArgs): boolean | Promise<boolean>;

  /**
   * Callback function invoked upon the successful uploading of a file chunk.
   * @param args
   * @returns
   */
  onProgress?: (args: {
    name: string;
    filename: string;
    contentType: string;
    uploadedBytes: number;
  }) => void;

  /**
   * Callback function triggered upon completion of the entire file upload process.
   * @param args
   * @returns
   */
  onDone?: (args: {
    name: string;
    filename: string;
    contentType: string;
    uploadedBytes: number;
  }) => void;
};

const defaultFilePathResolver: FileUploadHandlerPathResolver = ({
  filename,
}) => {
  const ext = filename ? extname(filename) : "";
  return `upload_${randomBytes(4).readUInt32LE(0)}${ext}`;
};

async function uniqueFile(filepath: string) {
  const ext = extname(filepath);
  let uniqueFilepath = filepath;

  for (
    let i = 1;
    await statAsync(uniqueFilepath)
      .then(() => true)
      .catch(() => false);
    i++
  ) {
    uniqueFilepath =
      (ext ? filepath.slice(0, -ext.length) : filepath) +
      `-${new Date().getTime()}${ext}`;
  }

  return uniqueFilepath;
}

export function createObservableFileUploadHandler({
  directory = tmpdir(),
  avoidFileConflicts = true,
  file = defaultFilePathResolver,
  filter,
  maxPartSize = 3000000,
  onProgress,
  onDone,
}: FileUploadHandlerOptions = {}): UploadHandler {
  return async ({ name, filename, contentType, data }: UploadHandlerPart) => {
    if (
      !filename ||
      (filter && !(await filter({ name, filename, contentType })))
    ) {
      return undefined;
    }

    const dir =
      typeof directory === "string"
        ? directory
        : directory({ name, filename, contentType });

    if (!dir) {
      return undefined;
    }

    const filedir = resolvePath(dir);
    const path =
      typeof file === "string" ? file : file({ name, filename, contentType });

    if (!path) {
      return undefined;
    }

    let filepath = resolvePath(filedir, path);

    if (avoidFileConflicts) {
      filepath = await uniqueFile(filepath);
    }

    await mkdir(dirname(filepath), { recursive: true }).catch(() => {});

    const writeFileStream = createWriteStream(filepath);
    let size = 0;
    let deleteFile = false;

    const onWrite = () => {
      if (onProgress) {
        onProgress({ name, filename, contentType, uploadedBytes: size });
      }
    };

    try {
      for await (const chunk of data) {
        size += chunk.byteLength;
        if (size > maxPartSize) {
          deleteFile = true;
          throw new MaxPartSizeExceededError(name, maxPartSize);
        }
        writeFileStream.write(chunk, onWrite);
      }
    } finally {
      writeFileStream.end();
      await promisify(finished)(writeFileStream);

      if (deleteFile) {
        await rm(filepath).catch(() => {});
      }
    }

    if (onDone) {
      onDone({ name, filename, contentType, uploadedBytes: size });
    }
    // TODO: remove this typecast once TS fixed File class regression
    //  https://github.com/microsoft/TypeScript/issues/52166
    return new NodeOnDiskFile(filepath, contentType) as unknown as File;
  };
}

// TODO: remove this `Omit` usage once TS fixed File class regression
//  https://github.com/microsoft/TypeScript/issues/52166
export class NodeOnDiskFile implements Omit<File, "constructor"> {
  name: string;
  lastModified = 0;
  webkitRelativePath = "";

  // TODO: remove this property once TS fixed File class regression
  //  https://github.com/microsoft/TypeScript/issues/52166
  prototype = File.prototype;

  constructor(
    private filepath: string,
    public type: string,
    private slicer?: { start: number; end: number },
  ) {
    this.name = basename(filepath);
  }

  get size(): number {
    const stats = statSync(this.filepath);

    if (this.slicer) {
      const slice = this.slicer.end - this.slicer.start;
      return slice < 0 ? 0 : slice > stats.size ? stats.size : slice;
    }

    return stats.size;
  }

  slice(start?: number, end?: number, type?: string): Blob {
    let validatedStart = 0;
    let validatedEnd = this.size;

    if (typeof start === "number" && start < 0) {
      validatedStart = this.size + start;
    }
    if (typeof end === "number" && end < 0) {
      validatedEnd = this.size + end;
    }

    const startOffset = this.slicer?.start || 0;

    const startWithOffset = startOffset + validatedStart;
    const endWithOffset = startOffset + validatedEnd;

    return new NodeOnDiskFile(
      this.filepath,
      typeof type === "string" ? type : this.type,
      {
        start: startWithOffset,
        end: endWithOffset,
      },
      // TODO: remove this typecast once TS fixed File class regression
      //  https://github.com/microsoft/TypeScript/issues/52166
    ) as unknown as Blob;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    let stream: Readable = createReadStream(this.filepath);
    if (this.slicer) {
      stream = stream.pipe(
        streamSlice.slice(this.slicer.start, this.slicer.end),
      );
    }

    return new Promise((resolve, reject) => {
      // biome-ignore lint/suspicious/noExplicitAny:
      const buf: any[] = [];
      stream.on("data", (chunk) => buf.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(buf)));
      stream.on("error", (err) => reject(err));
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny:
  stream(): ReadableStream<any>;
  stream(): NodeJS.ReadableStream;
  // biome-ignore lint/suspicious/noExplicitAny:
  stream(): ReadableStream<any> | NodeJS.ReadableStream {
    let stream: Readable = createReadStream(this.filepath);
    if (this.slicer) {
      stream = stream.pipe(
        streamSlice.slice(this.slicer.start, this.slicer.end),
      );
    }
    return createReadableStreamFromReadable(stream);
  }

  async text(): Promise<string> {
    return readableStreamToString(this.stream());
  }

  public get [Symbol.toStringTag]() {
    return "File";
  }

  remove(): Promise<void> {
    return unlink(this.filepath);
  }
  getFilePath(): string {
    return this.filepath;
  }
}
