"use client";
import type { ResidentAttachment } from "./schema";
const allowed = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
export const attachmentAccept = allowed.join(",");
export function validateFiles(files: File[]) {
  if (files.length > 5) throw new Error("Add up to five photos or videos.");
  if (files.reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024)
    throw new Error("Keep the combined attachments under 25 MB.");
  for (const file of files) {
    if (!allowed.includes(file.type) || !file.size)
      throw new Error("Choose a JPG, PNG, WebP, MP4, WebM, or MOV file.");
    if (file.size > (file.type.startsWith("image/") ? 10 : 20) * 1024 * 1024)
      throw new Error(
        "Photos must be under 10 MB; videos must be under 20 MB.",
      );
  }
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("property-hub-demo-attachments", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Your browser couldn’t open local attachment storage."));
  });
}
export interface AttachmentProvider {
  save(requestId: string, files: File[]): Promise<ResidentAttachment[]>;
  load(key: string): Promise<Blob | undefined>;
  remove(keys: string[]): Promise<void>;
}
export const localAttachmentProvider: AttachmentProvider = {
  async save(requestId, files) {
    validateFiles(files);
    if (!files.length) return [];
    const db = await openDb();
    const metadata = files.map((file) => {
      const id = crypto.randomUUID();
      return {
        id,
        name: file.name,
        mime: file.type,
        size: file.size,
        key: `${requestId}/${id}`,
      };
    });
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      files.forEach((file, i) =>
        tx.objectStore("files").put(file, metadata[i].key),
      );
      tx.oncomplete = () => {
        db.close();
        resolve(metadata);
      };
      tx.onabort = () => {
        db.close();
        reject(
          new Error(
            "Attachments couldn’t be saved. Try smaller files or submit without attachments.",
          ),
        );
      };
      tx.onerror = () => {
        /* The aborted transaction reports a single error. */
      };
    });
  },
  async load(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction("files").objectStore("files").get(key);
      request.onsuccess = () => {
        db.close();
        resolve(request.result as Blob | undefined);
      };
      request.onerror = () => {
        db.close();
        reject(new Error("This attachment couldn’t be loaded."));
      };
    });
  },
  async remove(keys) {
    if (!keys.length) return;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      keys.forEach((key) => tx.objectStore("files").delete(key));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        reject(new Error("Local attachments couldn’t be removed."));
      };
    });
  },
};
