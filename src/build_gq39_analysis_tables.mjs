import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const root = process.cwd();
const gqRoot = path.join(root, "external", "gq39", "Guqin-dataset-master");
const outDir = path.join(root, "data", "interim", "gq39_analysis_v1");
fs.mkdirSync(outDir, { recursive: true });

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out);
    else if (file.toLowerCase().endsWith(".xlsx")) out.push(file);
  }
  return out;
}
function norm(value) { return String(value ?? "").normalize("NFKC").trim(); }
function key(value) { return norm(value).toLowerCase(); }
function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function headers(rows) { return (rows[0] ?? []).map(norm); }
function indices(list, name) { return list.map((value, i) => key(value) === key(name) ? i : -1).filter(i => i >= 0); }
function firstIndex(list, name) { return indices(list, name)[0] ?? -1; }
function value(row, index) { return index >= 0 ? norm(row[index]) : ""; }
function pieceFrom(file) {
  const stem = path.basename(file).replace(/\.xlsx$/i, "").replace(/_p$/i, "");
  return (stem.match(/^[a-z]+/i)?.[0] ?? stem).toLowerCase();
}
function writeJsonl(file, rows) { fs.writeFileSync(file, rows.map(row => JSON.stringify(row)).join("\n") + "\n"); }

const t1Map = new Map([
  ["1", "stationary_press"], ["2", "continuous_oscillation"],
  ["3", "upward_motion"], ["3a", "upward_motion"], ["3b", "upward_motion"], ["3c", "upward_motion"], ["3a,3b", "upward_motion"],
  ["4", "downward_motion"], ["4a", "downward_motion"], ["4b", "downward_motion"],
  ["5", "up_return"], ["5a", "up_return"], ["6", "down_return"], ["6a", "down_return"],
]);
const t2Map = new Map([["1", "single_note_attack"], ["2", "multi_note_attack"]]);
const primary = [];
const secondaryAll = [];

for (const file of walk(path.join(gqRoot, "performance_annotation")).sort()) {
  const workbook = XLSX.readFile(file);
  for (const sheet of workbook.SheetNames) {
    if (sheet.toLowerCase().includes("contour")) continue;
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: null, raw: true });
    const hs = headers(rows);
    if (firstIndex(hs, "L tech(pitch)") < 0 || firstIndex(hs, "R finger") >= 0) continue;
    const idx = Object.fromEntries(["name", "section", "tuning", "mode", "degree", "range", "L tech(pitch)"].map(h => [h, firstIndex(hs, h)]));
    const onsetIdx = indices(hs, "onset")[0] ?? -1;
    const context = Object.fromEntries(["name", "section", "tuning", "mode"].map(h => [h, value(rows[1] ?? [], idx[h])]));
    const piece = pieceFrom(file);
    rows.slice(1).forEach((row, eventIndex) => {
      if (!row.slice(0, 13).some(cell => norm(cell) !== "")) return;
      const rawTarget = value(row, idx["L tech(pitch)"]);
      const mapped = t1Map.get(rawTarget) ?? null;
      primary.push({
        event_id: `T1:${path.basename(file)}:${sheet}:${eventIndex + 2}`,
        target_id: "T1_performed_lh_pitch_motion_6way",
        piece_group: piece,
        sequence_id: `${path.basename(file)}:${sheet}`,
        event_index: eventIndex,
        source: { file: path.basename(file), sheet, source_row: eventIndex + 2 },
        context,
        predictors: {
          degree: value(row, idx.degree), range: value(row, idx.range), score_onset: value(row, onsetIdx),
          bos: eventIndex === 0,
        },
        target_raw: rawTarget,
        target_class: mapped,
        eligible: mapped !== null,
        exclusion_reason: mapped === null ? (rawTarget ? "unmapped_target_code" : "missing_target") : null,
      });
    });
  }
}

for (const file of walk(path.join(gqRoot, "score_annotation")).sort()) {
  const workbook = XLSX.readFile(file);
  for (const sheet of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: null, raw: true });
    const hs = headers(rows);
    if (firstIndex(hs, "R tech") < 0 || firstIndex(hs, "R finger") < 0) continue;
    const fields = ["name", "section", "tuning", "mode", "degree", "range", "onset", "string", "position", "R finger", "L finger", "R tech", "L tech(pitch)", "L tech (timbre)"];
    const idx = Object.fromEntries(fields.map(h => [h, firstIndex(hs, h)]));
    const context = Object.fromEntries(["name", "section", "tuning", "mode"].map(h => [h, value(rows[1] ?? [], idx[h])]));
    const piece = pieceFrom(file);
    rows.slice(1).forEach((row, eventIndex) => {
      if (!row.slice(0, 14).some(cell => norm(cell) !== "")) return;
      const rawTarget = value(row, idx["R tech"]);
      const mapped = t2Map.get(rawTarget) ?? null;
      let reason = null;
      if (!mapped) reason = rawTarget === "" ? "missing_target" : rawTarget === "0" ? "documented_excluded_code_0" : rawTarget === "3a" ? "out_of_binary_scope_3a" : "unmapped_target_code";
      secondaryAll.push({
        event_id: `T2:${path.basename(file)}:${sheet}:${eventIndex + 2}`,
        target_id: "T2_score_rh_attack_binary",
        piece_group: piece,
        sequence_id: `${path.basename(file)}:${sheet}`,
        event_index: eventIndex,
        source: { file: path.basename(file), sheet, source_row: eventIndex + 2 },
        context,
        predictors: {
          degree: value(row, idx.degree), range: value(row, idx.range), score_onset: value(row, idx.onset),
          string: value(row, idx.string), position: value(row, idx.position),
          right_finger_raw: value(row, idx["R finger"]),
          left_finger_raw: value(row, idx["L finger"]), left_pitch_tech_raw: value(row, idx["L tech(pitch)"]),
          left_timbre_tech_raw: value(row, idx["L tech (timbre)"]), bos: eventIndex === 0,
        },
        target_raw: rawTarget,
        target_class: mapped,
        eligible: mapped !== null,
        exclusion_reason: reason,
      });
    });
  }
}

const secondary = secondaryAll.filter(row => row.eligible);
const classCounts = rows => Object.fromEntries([...Object.entries(Object.groupBy(rows, row => row.target_class)).map(([k, v]) => [k, v.length])].sort());
const pieceClassCounts = rows => Object.fromEntries(Object.entries(Object.groupBy(rows, row => row.piece_group)).sort().map(([piece, pieceRows]) => [piece, classCounts(pieceRows)]));
const foldCoverage = rows => {
  const allClasses = [...new Set(rows.map(row => row.target_class))].sort();
  const pieces = [...new Set(rows.map(row => row.piece_group))].sort();
  return pieces.map(heldout => {
    const test = rows.filter(row => row.piece_group === heldout);
    const train = rows.filter(row => row.piece_group !== heldout);
    const trainCounts = classCounts(train);
    const testCounts = classCounts(test);
    return {
      heldout_piece_group: heldout,
      train_rows: train.length,
      test_rows: test.length,
      train_missing_classes: allClasses.filter(label => !trainCounts[label]),
      test_missing_classes: allClasses.filter(label => !testCounts[label]),
      train_class_counts: trainCounts,
      test_class_counts: testCounts,
    };
  });
};
const reasonCounts = rows => Object.fromEntries([...Object.entries(Object.groupBy(rows.filter(row => !row.eligible), row => row.exclusion_reason)).map(([k, v]) => [k, v.length])].sort());
const missingCounts = (rows, fields) => Object.fromEntries(fields.map(field => [field, rows.filter(row => norm(row.predictors[field]) === "").length]));
const duplicateIds = rows => rows.length - new Set(rows.map(row => row.event_id)).size;
const orderIssues = rows => Object.values(Object.groupBy(rows, row => row.sequence_id)).filter(seq => seq.some((row, i) => row.event_index !== i)).length;
const forbiddenPredictorKeys = ["pitch", "contour", "duration", "performance_onset", "R tech", "L tech(pitch)"];
const forbiddenHits = [...primary, ...secondaryAll].flatMap(row => Object.keys(row.predictors).filter(field => forbiddenPredictorKeys.includes(field)).map(field => `${row.event_id}:${field}`));

const primaryFile = path.join(outDir, "t1_performed_lh_motion.jsonl");
const secondaryFile = path.join(outDir, "t2_score_rh_attack_eligible.jsonl");
const exclusionFile = path.join(outDir, "t2_score_rh_attack_exclusions.jsonl");
writeJsonl(primaryFile, primary);
writeJsonl(secondaryFile, secondary);
writeJsonl(exclusionFile, secondaryAll.filter(row => !row.eligible));

const report = {
  report_version: "gq39-analysis-table-audit-v1.1",
  outcome_inspection_status: "R5/R0 outcomes inspected before schema v1.1 added right_finger_raw for preregistered historical-direction features",
  primary: {
    total_rows: primary.length, eligible_rows: primary.filter(row => row.eligible).length,
    excluded_rows: primary.filter(row => !row.eligible).length, class_counts: classCounts(primary.filter(row => row.eligible)),
    piece_class_counts: pieceClassCounts(primary.filter(row => row.eligible)),
    outer_fold_class_coverage: foldCoverage(primary.filter(row => row.eligible)),
    piece_counts: Object.fromEntries(Object.entries(Object.groupBy(primary, row => row.piece_group)).map(([k, v]) => [k, v.length])),
    missing_predictors: missingCounts(primary, ["degree", "range", "score_onset"]), duplicate_event_ids: duplicateIds(primary), sequence_order_issues: orderIssues(primary),
  },
  secondary: {
    total_rows: secondaryAll.length, eligible_rows: secondary.length, excluded_rows: secondaryAll.length - secondary.length,
    exclusion_reasons: reasonCounts(secondaryAll), class_counts: classCounts(secondary),
    piece_class_counts: pieceClassCounts(secondary), outer_fold_class_coverage: foldCoverage(secondary),
    piece_counts_eligible: Object.fromEntries(Object.entries(Object.groupBy(secondary, row => row.piece_group)).map(([k, v]) => [k, v.length])),
    missing_predictors_eligible: missingCounts(secondary, ["degree", "range", "score_onset", "string", "position", "right_finger_raw", "left_finger_raw", "left_pitch_tech_raw", "left_timbre_tech_raw"]),
    duplicate_event_ids: duplicateIds(secondaryAll), sequence_order_issues: orderIssues(secondaryAll),
  },
  prohibited_predictor_hits: forbiddenHits,
  restricted_table_hashes: {
    t1_sha256: sha(fs.readFileSync(primaryFile)), t2_eligible_sha256: sha(fs.readFileSync(secondaryFile)), t2_exclusions_sha256: sha(fs.readFileSync(exclusionFile)),
  },
};

const expectedT1 = { stationary_press: 1484, continuous_oscillation: 109, upward_motion: 436, downward_motion: 167, up_return: 54, down_return: 53 };
const expectedT2 = { single_note_attack: 1545, multi_note_attack: 167 };
if (report.primary.total_rows !== 2303 || report.primary.eligible_rows !== 2303 || JSON.stringify(report.primary.class_counts) !== JSON.stringify(Object.fromEntries(Object.entries(expectedT1).sort()))) throw new Error("T1 mapping/count invariant failed");
if (report.secondary.total_rows !== 1929 || report.secondary.eligible_rows !== 1712 || report.secondary.excluded_rows !== 217 || JSON.stringify(report.secondary.class_counts) !== JSON.stringify(Object.fromEntries(Object.entries(expectedT2).sort()))) throw new Error("T2 mapping/count invariant failed");
if (report.secondary.exclusion_reasons.documented_excluded_code_0 !== 214 || report.secondary.exclusion_reasons.out_of_binary_scope_3a !== 1 || report.secondary.exclusion_reasons.missing_target !== 2) throw new Error("T2 exclusion accounting failed");
if ([...report.primary.outer_fold_class_coverage, ...report.secondary.outer_fold_class_coverage].some(fold => fold.train_missing_classes.length)) throw new Error("An outer training fold lacks a target class");
if (report.primary.duplicate_event_ids || report.secondary.duplicate_event_ids || report.primary.sequence_order_issues || report.secondary.sequence_order_issues || forbiddenHits.length) throw new Error("Identity/order/leakage invariant failed");

fs.writeFileSync(path.join(root, "metadata", "gq39_analysis_table_audit_v1.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: "PASS", ...report }, null, 2));
