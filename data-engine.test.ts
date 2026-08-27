// Stage 1 test — verifies the storage layer round-trips data correctly.
// Real data-engine parsing/profiling tests arrive in Stage 2/3.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { createStore } from "../storage/fileStore";

interface DummyRecord {
  id: string;
  value: number;
}

const TEST_ENTITY = "test-entity";
const TEST_FOLDER = path.join(process.cwd(), "data", TEST_ENTITY);

describe("fileStore (Stage 1 storage layer)", () => {
  afterAll(async () => {
    await fs.rm(TEST_FOLDER, { recursive: true, force: true });
  });

  it("saves and loads a record", async () => {
    const store = createStore<DummyRecord>(TEST_ENTITY);
    await store.save("abc123", { id: "abc123", value: 42 });

    const loaded = await store.load("abc123");
    expect(loaded).toEqual({ id: "abc123", value: 42 });
  });

  it("returns null for a record that does not exist", async () => {
    const store = createStore<DummyRecord>(TEST_ENTITY);
    const loaded = await store.load("does-not-exist");
    expect(loaded).toBeNull();
  });

  it("lists saved record ids", async () => {
    const store = createStore<DummyRecord>(TEST_ENTITY);
    await store.save("rec1", { id: "rec1", value: 1 });
    await store.save("rec2", { id: "rec2", value: 2 });

    const ids = await store.list();
    expect(ids).toEqual(expect.arrayContaining(["abc123", "rec1", "rec2"]));
  });
});
