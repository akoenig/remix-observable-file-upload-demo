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

import { EventEmitter } from "events";

export type UploadEvent = Readonly<{
  uploadId: string;
}>;

class UploadEventBus {
  private readonly bus = new EventEmitter();

  addListener<T>(uploadId: string, listener: (event: T) => void) {
    this.bus.addListener(uploadId, listener);
  }

  removeListener<T>(uploadId: string, listener: (event: T) => void) {
    this.bus.removeListener(uploadId, listener);
  }

  emit<T extends UploadEvent>(event: T) {
    this.bus.emit(event.uploadId, event);
  }
}

export const uploadEventBus = new UploadEventBus();
