import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const expected = {
  piece_groups: 10,
  score_rows: 1929,
  performance_rows: 2303,
  duplicated_score_template_rows: 2344,
  musicxml_files: 71,
  musicxml_notes: 39623,
  primary_target_rows: 2303,
  secondary_target_rows: 1712,
};

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, predicate, out);
    else if (predicate(file)) out.push(file);
  }
  return out;
}

function sha256(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

function gitRevision(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const sources = [
  {
    source_id: "E001_GQ39",
    rights_tier: "local_only_no_explicit_licence",
    root: path.join(root, "external", "gq39", "Guqin-dataset-master"),
    files: dir => walk(dir, file => file.toLowerCase().endsWith(".xlsx")),
    role: "principal_joint_pitch_gesture_corpus",
  },
  {
    source_id: "E002_MUSICXML",
    rights_tier: "local_only_no_explicit_licence",
    root: path.join(root, "external", "guqin_musicxml", "Guqin-Dataset-master", "Guqin_Dataset_v1", "xml_no_split"),
    revisionRoot: path.join(root, "external", "guqin_musicxml", "Guqin-Dataset-master"),
    files: dir => walk(dir, file => file.toLowerCase().endsWith(".xml")),
    role: "pitch_auxiliary",
  },
  {
    source_id: "E004_KUISCIMA",
    rights_tier: "GPL-3.0_repository_material_facsimiles_excluded",
    root: path.join(root, "external", "KuiSCIMA-main", "KuiSCIMA", "symbolic_dataset"),
    revisionRoot: path.join(root, "external", "KuiSCIMA-main"),
    files: dir => walk(dir, file => file.toLowerCase().endsWith(".json")),
    role: "historical_symbolic_structure",
  },
  {
    source_id: "E003_GUQINMM",
    rights_tier: "local_only_asset_scope_unresolved",
    root: path.join(root, "external", "guqinMM-main", "guqin_jzp", "JZPNet", "data", "jzp"),
    revisionRoot: path.join(root, "external", "guqinMM-main"),
    files: dir => walk(dir, file => path.relative(dir, file).replaceAll("\\", "/") === "wushen_1/metadata_3.txt"),
    role: "notation_structure_coverage",
  },
];

const manifestRows = [];
const sourceSummary = [];
for (const source of sources) {
  if (!fs.existsSync(source.root)) throw new Error(`Missing frozen source root: ${source.root}`);
  const files = source.files(source.root).sort((a, b) => a.localeCompare(b));
  if (!files.length) throw new Error(`No selected input files for ${source.source_id}`);
  for (const file of files) {
    const stat = fs.statSync(file);
    manifestRows.push({
      source_id: source.source_id,
      role: source.role,
      rights_tier: source.rights_tier,
      relative_path: path.relative(root, file).replaceAll("\\", "/"),
      size_bytes: stat.size,
      sha256: sha256(file),
    });
  }
  sourceSummary.push({
    source_id: source.source_id,
    role: source.role,
    rights_tier: source.rights_tier,
    selected_file_count: files.length,
    selected_bytes: files.reduce((n, file) => n + fs.statSync(file).size, 0),
    git_revision: gitRevision(source.revisionRoot ?? source.root),
  });
}

const auditFile = path.join(root, "metadata", "full_corpus_grouping_audit.json");
const registryFile = path.join(root, "experiments", "experiment_registry_v0_1.json");
const audit = JSON.parse(fs.readFileSync(auditFile, "utf8"));
const registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
const observed = {
  piece_groups: audit.gq39.independent_piece_groups,
  score_rows: audit.gq39.score_rows,
  performance_rows: audit.gq39.performance_rows,
  duplicated_score_template_rows: audit.gq39.duplicated_score_template_rows_in_performance_workbooks,
  musicxml_files: audit.musicxml.whole_piece_files,
  musicxml_notes: audit.musicxml.total_notes,
  primary_target_rows: registry.targets.find(t => t.role === "primary")?.eligible_rows,
  secondary_target_rows: registry.targets.find(t => t.role === "secondary")?.eligible_rows,
};
for (const [key, value] of Object.entries(expected)) {
  if (observed[key] !== value) throw new Error(`Freeze mismatch ${key}: expected ${value}, observed ${observed[key]}`);
}
const guqinmmSummary = sourceSummary.find(source => source.source_id === "E003_GUQINMM");
if (guqinmmSummary?.selected_file_count !== 1) throw new Error(`guqinMM freeze must contain only wushen_1 metadata; observed ${guqinmmSummary?.selected_file_count}`);

const groupCsv = fs.readFileSync(path.join(root, "metadata", "gq39_piece_groups.csv"), "utf8").trim().split(/\r?\n/);
const groups = groupCsv.slice(1).map(line => line.split(",")[0]);
if (groups.length !== expected.piece_groups || new Set(groups).size !== groups.length) throw new Error("Piece groups are missing or duplicated");
const folds = groups.map((heldout, index) => ({
  outer_fold: index + 1,
  heldout_piece_group: heldout,
  training_piece_groups: groups.filter(group => group !== heldout).join("|"),
  split_hash: crypto.createHash("sha256").update(JSON.stringify({ heldout, train: groups.filter(group => group !== heldout) })).digest("hex"),
}));

const manifestCore = {
  manifest_version: "research-r1-inputs-v1",
  frozen_date: "2026-10-16",
  stage: "Research/R1",
  outcome_inspection_status: "no representation-model outcomes computed",
  selection_policy: "Only files read by the frozen reuse-first analysis route are included; historical scan PDFs and augmented OCR images are excluded.",
  expected_counts: expected,
  observed_counts: observed,
  sources: sourceSummary,
  files: manifestRows,
};
const manifestHash = crypto.createHash("sha256").update(JSON.stringify(manifestCore)).digest("hex");
const manifest = { ...manifestCore, manifest_sha256: manifestHash };

fs.writeFileSync(path.join(root, "metadata", "research_input_manifest_v1.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(root, "experiments", "outer_folds_v1.csv"), [
  ["outer_fold", "heldout_piece_group", "training_piece_groups", "split_hash"],
  ...folds.map(row => [row.outer_fold, row.heldout_piece_group, row.training_piece_groups, row.split_hash]),
].map(row => row.map(csvCell).join(",")).join("\n") + "\n");

console.log(JSON.stringify({
  status: "PASS",
  manifest_sha256: manifestHash,
  selected_files: manifestRows.length,
  selected_bytes: sourceSummary.reduce((n, source) => n + source.selected_bytes, 0),
  source_summary: sourceSummary,
  observed_counts: observed,
  outer_folds: folds.length,
}, null, 2));
