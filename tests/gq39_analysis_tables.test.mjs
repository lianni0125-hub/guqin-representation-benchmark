import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run = spawnSync(process.execPath, ["src/build_gq39_analysis_tables.mjs"], { encoding: "utf8" });
assert.equal(run.status, 0, run.stderr);
const result = JSON.parse(run.stdout);
assert.equal(result.status, "PASS");
assert.equal(result.primary.eligible_rows, 2303);
assert.deepEqual(result.primary.class_counts, {
  continuous_oscillation: 109, down_return: 53, downward_motion: 167,
  stationary_press: 1484, up_return: 54, upward_motion: 436,
});
assert.equal(result.secondary.total_rows, 1929);
assert.equal(result.secondary.eligible_rows, 1712);
assert.equal(result.secondary.excluded_rows, 217);
assert.deepEqual(result.secondary.exclusion_reasons, {
  documented_excluded_code_0: 214, missing_target: 2, out_of_binary_scope_3a: 1,
});
assert.equal(result.prohibited_predictor_hits.length, 0);
assert.ok(result.primary.outer_fold_class_coverage.every(fold => fold.train_missing_classes.length === 0));
assert.ok(result.secondary.outer_fold_class_coverage.every(fold => fold.train_missing_classes.length === 0));
assert.equal(result.secondary.missing_predictors_eligible.string, 2);
assert.equal(result.secondary.missing_predictors_eligible.right_finger_raw, 0);
assert.equal(result.secondary.missing_predictors_eligible.left_timbre_tech_raw, 2);
console.log("PASS: canonical GQ39 analysis tables and exclusion accounting");
