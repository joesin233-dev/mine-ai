// MINE AI V0.1 — Storage layer
// This is the ONLY module in the entire system allowed to touch storage.
// Every engine and API route goes through this. Uses Supabase Storage
// (swapped from Vercel Blob after hitting its free-tier operation limit).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eldnkrrnamccjorkzzpx.supabase.co";
const SUPABASE_KEY = "sb_publishable_x2ML6L_IEUcE1T299FaIRg_c8Qgq9mV";
const BUCKET_NAME = "mine-ai-uploads";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(pathname, blob, { upsert: true, contentType: "application/json" });
      if (error) throw new Error(`Supabase save failed: ${error.message}`);
    },

    async load(id: string): Promise<T | null> {
      const pathname = keyFor(entity, id);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(pathname);
      if (error) return null;
      const text = await data.text();
      return JSON.parse(text) as T;
    },

    async list(): Promise<string[]> {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(entity);
      if (error) throw new Error(`Supabase list failed: ${error.message}`);
      return (data ?? [])
        .map((f) => f.name)
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
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(pathname, buffer, { upsert: true });
  if (error) throw new Error(`Supabase raw upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(pathname);
  return data.publicUrl;
}

export async function loadRawUpload(
  id: string,
  extension: string
): Promise<Buffer> {
  const pathname = `uploads/${id}.${extension}`;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(pathname);
  if (error) throw new Error(`Supabase raw download failed: ${error.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
