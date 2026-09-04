import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("init.sql should have default '' and not strictly NOT NULL for member2", () => {
  const initSql = fs.readFileSync("init.sql", "utf-8");
  assert.match(initSql, /member2_name VARCHAR\(100\) DEFAULT ''/);
  assert.match(initSql, /member2_student_id VARCHAR\(20\) DEFAULT ''/);
});

test("src/lib/db.js should contain migration to drop NOT NULL from member2 columns", () => {
  const dbJs = fs.readFileSync("src/lib/db.js", "utf-8");
  assert.match(dbJs, /ALTER COLUMN member2_name DROP NOT NULL/);
  assert.match(dbJs, /ALTER COLUMN member2_student_id DROP NOT NULL/);
  assert.match(dbJs, /ALTER COLUMN member2_name SET DEFAULT ''/);
  assert.match(dbJs, /ALTER COLUMN member2_student_id SET DEFAULT ''/);
});
