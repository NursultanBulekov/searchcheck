import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBackup, mergeBackup } from "./backups.ts";
const record = {
  id: "first",
  company: "Example",
  role: "Developer",
  url: "https://example.com/job",
  platform: "hh.kz",
  status: "Waiting",
  appliedOn: "2026-10-13",
  description: "Full job text",
  summary: "Short description",
  response: "Waiting for reply",
};
test("exported JSON round-trips all application fields", () => {
  assert.deepEqual(parseBackup(JSON.stringify([record])), [record]);
});
test("merge keeps local edits and repeat imports do not duplicate records", () => {
  const local = {
    ...record,
    status: "Interview",
    response: "Invitation received",
  };
  const newRecord = { ...record, id: "second", platform: "Telegram" };
  const first = mergeBackup(
    [local],
    parseBackup(JSON.stringify([record, newRecord])),
  );
  assert.equal(first.added, 1);
  assert.equal(first.skipped, 1);
  assert.deepEqual(first.applications, [newRecord, local]);
  const repeated = mergeBackup(first.applications, [record, newRecord]);
  assert.equal(repeated.added, 0);
  assert.deepEqual(repeated.applications, first.applications);
});
test("rejects malformed JSON, invalid fields, duplicate IDs and unsafe links", () => {
  for (const invalid of [
    "{",
    "{}",
    "[null]",
    JSON.stringify([{ ...record, status: "Unknown" }]),
    JSON.stringify([{ ...record, appliedOn: "2026-02-30" }]),
    JSON.stringify([{ ...record, url: "javascript:alert(1)" }]),
    JSON.stringify([record, record]),
  ])
    assert.throws(() => parseBackup(invalid));
});
test("accepts empty backups and discards unknown fields", () => {
  assert.deepEqual(parseBackup("[]"), []);
  assert.deepEqual(
    parseBackup(JSON.stringify([{ ...record, unexpected: "discard" }])),
    [record],
  );
});
