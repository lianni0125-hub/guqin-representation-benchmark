import fs from "node:fs";
import path from "node:path";
const fixturePath = process.argv[2] || "fixtures/synthetic_t2_events.jsonl";
const rows = fs.readFileSync(path.resolve(fixturePath), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const required = ["event_id", "source_id", "piece_group", "sequence_id", "event_index", "context", "predictors", "target_raw", "target_class"];
const predictorFields = ["score_onset", "degree", "range", "string", "position", "right_finger_raw", "left_pitch_tech_raw", "left_timbre_tech_raw"];
const ids = new Set(); const sequenceIndices = new Map();
for (const [line, row] of rows.entries()) {
  for (const field of required) if (!(field in row)) throw new Error(`line ${line + 1}: missing ${field}`);
  for (const field of predictorFields) if (!(field in row.predictors)) throw new Error(`line ${line + 1}: missing predictors.${field}`);
  if (!Number.isInteger(row.event_index) || row.event_index < 0) throw new Error(`line ${line + 1}: invalid event_index`);
  if (ids.has(row.event_id)) throw new Error(`line ${line + 1}: duplicate event_id`); ids.add(row.event_id);
  const indices = sequenceIndices.get(row.sequence_id) || []; indices.push(row.event_index); sequenceIndices.set(row.sequence_id, indices);
}
for (const [sequence, indices] of sequenceIndices) { indices.sort((a, b) => a - b); if (indices.some((value, index) => value !== index)) throw new Error(`${sequence}: non-contiguous event_index`); }
if (new Set(rows.map(row => row.piece_group)).size < 2) throw new Error("fixture needs at least two groups");
if (new Set(rows.map(row => row.target_class)).size < 2) throw new Error("fixture needs at least two classes");
if (rows.some(row => row.source_id !== "SYNTHETIC")) throw new Error("public fixture may contain synthetic rows only");
console.log(JSON.stringify({status: "PASS", fixture: fixturePath.replaceAll("\\", "/"), rows: rows.length, groups: new Set(rows.map(row => row.piece_group)).size}));
