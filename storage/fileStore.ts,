// MINE AI V0.1 — Storage layer
// This is the ONLY module in the entire system allowed to read/write disk.
// Every engine and API route goes through this. When V0.1 later moves to a
// real database, this file is the only one that needs to change.

import { promises as fs } from "fs";
import path from "path";

const DATA_ROOT = path.join(process.cwd(), "data");

export interface Store<T> {
  save(id: string, data: T): Promise<void>;
  load(id: string): Promise<T | null>;
  list(): Promise<string[]>;
}

function folderFor(entity: string): string {
  return path.join(DATA_ROOT, entity);
}

async function ensureFolder(folder: string): Promise<void> {
  await fs.mkdir(folder, { recursive: true });
}

/**
 * Creates a typed JSON file store for one entity folder
 * (e.g. "processed", "findings", "evidence", "economic", "reports").
 */
export function createStore<T>(entity: string): Store<T> {
  const folder = folderFor(entity);

  return {
    async save(id: string, data: T): Promise<void> {
      await ensureFolder(folder);
      const filePath = path.join(folder, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    },

    async load(id: string): Promise<T | null> {
      const filePath = path.join(folder, `${id}.json`);
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        return JSON.parse(raw) as T;
      } catch (err: any) {
        if (err.code === "ENOENT") return null;
        throw err;
      }
    },

    async list(): Promise<string[]> {
      await ensureFolder(folder);
      const files = await fs.readdir(folder);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""));
    },
  };
}

/**
 * Saves a raw uploaded file (CSV/XLSX) untouched, for audit-trail purposes.
 * Raw uploads are never parsed in place here — parsing happens in the data engine.
 */
export async function saveRawUpload(
  id: string,
  buffer: Buffer,
  extension: string
): Promise<string> {
  const folder = folderFor("uploads");
  await ensureFolder(folder);
  const filePath = path.join(folder, `${id}.${extension}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function loadRawUpload(
  id: string,
  extension: string
): Promise<Buffer> {
  const folder = folderFor("uploads");
  const filePath = path.join(folder, `${id}.${extension}`);
  return fs.readFile(filePath);
}
