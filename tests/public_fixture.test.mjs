import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
const result = spawnSync(process.execPath, ["src/validate_public_fixture.mjs"], { encoding: "utf8" });
assert.equal(result.status, 0, result.stderr);
const report = JSON.parse(result.stdout);
assert.equal(report.status, "PASS"); assert.equal(report.rows, 16); assert.equal(report.groups, 4);
console.log("PASS: synthetic public fixture is structurally valid and contains no upstream rows");
