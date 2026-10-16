import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const run = spawnSync(process.execPath, ["src/freeze_research_inputs.mjs"], { encoding: "utf8" });
assert.equal(run.status, 0, run.stderr);
const result = JSON.parse(run.stdout);
assert.equal(result.status, "PASS");
assert.equal(result.outer_folds, 10);
assert.equal(result.observed_counts.primary_target_rows, 2303);
assert.equal(result.observed_counts.secondary_target_rows, 1712);

const manifest = JSON.parse(fs.readFileSync("metadata/research_input_manifest_v1.json", "utf8"));
assert.equal(manifest.manifest_sha256, result.manifest_sha256);
assert.equal(manifest.files.length, result.selected_files);
assert.ok(manifest.files.every(row => /^[a-f0-9]{64}$/.test(row.sha256)));
assert.ok(manifest.files.every(row => !row.relative_path.toLowerCase().endsWith(".pdf")));
const guqinmmFiles = manifest.files.filter(row => row.source_id === "E003_GUQINMM");
assert.equal(guqinmmFiles.length, 1);
assert.match(guqinmmFiles[0].relative_path, /\/wushen_1\/metadata_3\.txt$/);

const folds = fs.readFileSync("experiments/outer_folds_v1.csv", "utf8").trim().split(/\r?\n/).slice(1);
assert.equal(folds.length, 10);
for (const line of folds) {
  const [fold, heldout, training] = line.split(",");
  assert.ok(Number(fold) >= 1 && Number(fold) <= 10);
  assert.equal(training.split("|").length, 9);
  assert.ok(!training.split("|").includes(heldout));
}
console.log("PASS: research input freeze and deterministic outer folds");
