import fs from "node:fs";

const file = process.argv[2] ?? "experiments/experiment_registry_v0_1.json";
const registry = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];

if (registry.grouping.group_key !== "piece_group") errors.push("group_key must remain piece_group");
if (registry.grouping.outer_evaluation !== "leave_one_piece_out") errors.push("outer evaluation must remain leave_one_piece_out");
if (registry.grouping.outer_groups !== 10) errors.push("outer_groups must equal the audited ten GQ39 pieces");

const roles = registry.targets.map(target => target.role);
if (roles.filter(role => role === "primary").length !== 1) errors.push("exactly one primary target is required");
if (roles.filter(role => role === "secondary").length !== 1) errors.push("exactly one secondary target is required");

for (const target of registry.targets) {
  const mapped = Object.values(target.mapping).flat();
  if (new Set(mapped).size !== mapped.length) errors.push(`${target.target_id}: a raw target code maps to multiple classes`);
  const classTotal = Object.values(target.class_counts).reduce((sum, count) => sum + count, 0);
  if (classTotal !== target.eligible_rows) errors.push(`${target.target_id}: class counts do not sum to eligible_rows`);
  if (!target.prohibited_current_event_inputs.includes(target.raw_field)) errors.push(`${target.target_id}: raw target field is not explicitly prohibited as an input`);
}

const representations = Object.keys(registry.representation_inputs).filter(key => /^R[0-5]_/.test(key));
for (const expected of ["R0_atomic", "R1_pitch_centred", "R2_gesture_centred", "R3_flat_combined", "R4_multi_tier", "R5_context_physical"]) {
  if (!representations.includes(expected)) errors.push(`missing representation ${expected}`);
}

if (!String(registry.representation_inputs.R3_flat_combined).includes("same") || !String(registry.representation_inputs.R4_multi_tier).includes("no extra")) {
  errors.push("R3/R4 equal-information constraint is not explicit");
}
if (registry.metrics.primary !== "token_mean_negative_log_likelihood_nats") errors.push("primary metric changed");
if (registry.complexity.selection_rule.toLowerCase().includes("post-hoc scalar lambda") === false) errors.push("post-hoc complexity-weight prohibition missing");

if (errors.length) {
  console.error(errors.map(error => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}

console.log(`OK: registry ${registry.registry_version}; ${registry.targets.length} targets; ${representations.length} representations; leakage and grouping guards present.`);
