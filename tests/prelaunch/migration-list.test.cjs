// Every SQL file in prisma/sql must be registered in prebuild-db.cjs (and vice versa).
const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { migrationFiles } = require("../../scripts/prebuild-db.cjs")

test("prebuild-db lists every migration in prisma/sql", () => {
  const onDisk = fs
    .readdirSync(path.join(__dirname, "..", "..", "prisma", "sql"))
    .filter((f) => f.endsWith(".sql"))
    .sort()
  assert.deepEqual([...migrationFiles].sort(), onDisk)
})
