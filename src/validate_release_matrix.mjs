import fs from "node:fs";
import path from "node:path";

const file = process.argv[2] ?? path.join("metadata", "release_matrix.csv");
const text = fs.readFileSync(file, "utf8").trim();
const lines = text.split(/\r?\n/);
const headers = lines.shift().split(",");
const rows = lines.map((line, index) => {
  const values = line.split(",");
  if (values.length !== headers.length) throw new Error(`CSV column mismatch on data row ${index + 1}`);
  return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
});

const unsafeStatuses = new Set(["unknown", "restricted", "scope_unresolved", "blocked_by_components", "local_research_only"]);
const directModes = new Set(["direct", "direct_with_terms", "direct_after_project_licence_selection"]);
const errors = [];

for (const row of rows) {
  if (!row.asset_id || !row.source_id || !row.release_mode || !row.rights_status) {
    errors.push(`${row.asset_id || "unknown row"}: missing required field`);
  }
  if (unsafeStatuses.has(row.rights_status) && directModes.has(row.release_mode)) {
    errors.push(`${row.asset_id}: unsafe rights status cannot use ${row.release_mode}`);
  }
  if (row.release_mode === "direct_with_terms" && (!row.licence_or_basis || !row.evidence_url)) {
    errors.push(`${row.asset_id}: direct_with_terms requires licence and evidence URL`);
  }
  if (row.release_mode === "prohibited" && row.public_payload !== "metadata citation only") {
    errors.push(`${row.asset_id}: prohibited asset may expose metadata citation only`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`PASS: ${rows.length} release-matrix rows satisfy the conservative publication boundary.`);
