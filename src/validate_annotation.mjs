import fs from "node:fs";

const [schemaPath, jsonlPath] = process.argv.slice(2);
if (!schemaPath || !jsonlPath) {
  throw new Error("Usage: node src/validate_annotation.mjs SCHEMA JSONL");
}

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const lines = fs.readFileSync(jsonlPath, "utf8").split(/\r?\n/).filter(Boolean);
const records = lines.map((line, index) => {
  try { return JSON.parse(line); }
  catch (error) { throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`); }
});

const allowedKinds = new Set(schema.properties.record_kind.enum);
const allowedRepresentations = new Set(schema.$defs.analysis.properties.representation.enum);
const ids = new Set();

for (const [index, record] of records.entries()) {
  const label = `line ${index + 1}`;
  for (const field of schema.required) {
    if (!(field in record)) throw new Error(`${label}: missing ${field}`);
  }
  if (record.schema_version !== "0.1.0") throw new Error(`${label}: wrong schema_version`);
  if (!allowedKinds.has(record.record_kind)) throw new Error(`${label}: invalid record_kind`);
  if (ids.has(record.record_id)) throw new Error(`${label}: duplicate record_id`);
  ids.add(record.record_id);

  const box = record.source?.bbox_normalized;
  if (!Array.isArray(box) || box.length !== 4 || box.some((v) => typeof v !== "number" || v < 0 || v > 1)) {
    throw new Error(`${label}: invalid normalized bbox`);
  }
  if (!(box[0] < box[2] && box[1] < box[3])) throw new Error(`${label}: bbox must have positive area`);
  if (!Number.isInteger(record.source.digital_page) || record.source.digital_page < 1) throw new Error(`${label}: invalid digital_page`);
  if (record.source.coordinate_space !== "pdf_page_normalized_top_left") throw new Error(`${label}: invalid coordinate_space`);

  const confidence = record.observation?.confidence;
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) throw new Error(`${label}: invalid confidence`);
  if (!Array.isArray(record.parse_candidates) || !Array.isArray(record.derivations) || !Array.isArray(record.analyses)) {
    throw new Error(`${label}: layered fields must be arrays`);
  }
  if (record.observation.diplomatic_text === null && record.derivations.length > 0) {
    throw new Error(`${label}: cannot derive from an unread observation without an explicit parse`);
  }
  const candidateIds = new Set(record.parse_candidates.map((candidate) => candidate.candidate_id));
  for (const derivation of record.derivations) {
    if (!candidateIds.has(derivation.input_candidate_id)) throw new Error(`${label}: derivation references missing parse candidate`);
  }
  const derivationIds = new Set(record.derivations.map((derivation) => derivation.derivation_id));
  for (const analysis of record.analyses) {
    if (!allowedRepresentations.has(analysis.representation)) throw new Error(`${label}: invalid representation`);
    for (const derivationId of analysis.input_derivation_ids) {
      if (!derivationIds.has(derivationId)) throw new Error(`${label}: analysis references missing derivation`);
    }
  }
}

const orderKeys = records.map((record) => `${record.source.witness_id}|${record.source.digital_page}|${record.source.reading_order_key}`);
if (new Set(orderKeys).size !== orderKeys.length) throw new Error("Duplicate reading_order_key within witness/page");

const roundTripped = JSON.parse(JSON.stringify(records));
if (JSON.stringify(roundTripped) !== JSON.stringify(records)) throw new Error("JSON round trip changed record content");

console.log(`OK: ${records.length} records; unique IDs; bboxes, layer references and JSON round trip valid.`);
