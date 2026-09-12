// MINE AI V0.1 — Storage layer
// This is the ONLY module in the entire system allowed to touch storage.
// Every engine and API route goes through this. Uses Vercel Blob instead of
// local disk, since serverless functions can't write to the project filesystem.

import { put, head, list as blobList } from "@vercel/blob";

export interface Store<T> {
  save(id: string, data: T): Promise<void>;
  load(id: string): Promise<T | null>;
  list(): Promise<string[]>;
}

function keyFor(entity: string, id: string): string {
  return `${entity}/${id}.json`;
}

/**
 * Creates a typed JSON store for one entity type
 * (e.g. "processed", "findings", "evidence", "economic", "reports").
 */
export function createStore<T>(entity: string): Store<T> {
  return {
    async save(id: string, data: T): Promise<void> {
      const pathname = keyFor(entity, id);
      await put(pathname, JSON.stringify(data, null, 2), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      });
    },

    async load(id: string): Promise<T | null> {
      const pathname = keyFor(entity, id);
      try {
        const meta = await head(pathname);
        const res = await fetch(meta.url);
        if (!res.ok) return null;
        return JSON.parse(await res.text()) as T;
      } catch (err: any) {
        if (err?.status === 404 || /not.?found/i.test(err?.message ?? "")) {
          return null;
        }
        throw err;
      }
    },

    async list(): Promise<string[]> {
      const { blobs } = await blobList({ prefix: `${entity}/` });
      return blobs
        .map((b) => b.pathname.split("/").pop() ?? "")
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""));
    },
  };
}

/**
 * Saves a raw uploaded file (CSV/XLSX) untouched, for audit-trail purposes.
 */
export async function saveRawUpload(
  id: string,
  buffer: Buffer,
  extension: string
): Promise<string> {
  const pathname = `uploads/${id}.${extension}`;
  const { url } = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: false,
  });
  return url;
}

export async function loadRawUpload(
  id: string,
  extension: string
): Promise<Buffer> {
  const meta = await head(`uploads/${id}.${extension}`);
  const res = await fetch(meta.url);
  return Buffer.from(await res.arrayBuffer());
}
