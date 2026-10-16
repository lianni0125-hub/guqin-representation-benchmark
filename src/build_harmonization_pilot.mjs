import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const root = process.cwd();
const outputDir = path.join(root, "results", "harmonization_pilot");
const sampleSize = 12;
const kuiSampleSize = 16;

function missing(...present) {
  return present.some(Boolean) ? null : "source_not_annotated";
}

function flattenTree(node, out = []) {
  if (node === null || node === undefined) return out;
  if (Array.isArray(node)) for (const item of node) flattenTree(item, out);
  else if (typeof node === "object") {
    if (Object.hasOwn(node, "content")) flattenTree(node.content, out);
    if (Object.hasOwn(node, "children")) flattenTree(node.children, out);
  } else out.push(node);
  return out;
}

function classifyLabels(labels) {
  const strings = labels.filter(value => typeof value === "string");
  return {
    sound_types: strings.filter(value => value.startsWith("TECHNIQUE_")),
    right_actions: strings.filter(value => value.startsWith("RIGHT_")),
    left_actions: strings.filter(value => value.startsWith("LEFT_") && !value.startsWith("LEFT_FINGER_")),
    left_fingers: strings.filter(value => value.startsWith("LEFT_FINGER_")),
    layout_operators: strings.filter(value => [...value].length === 1 && value.codePointAt(0) >= 0x2ff0 && value.codePointAt(0) <= 0x2fff),
    unresolved_numbers: labels.filter(value => typeof value === "number" || /^\d+$/.test(String(value))),
  };
}

function representations(record) {
  const pitch = record.views.pitch;
  const gesture = record.views.gesture;
  const notation = record.views.notation;
  const r1 = {
    sound_type: gesture.sound_types,
    string: gesture.strings,
    position: gesture.positions,
    degree: pitch.degree,
    range: pitch.range,
    absolute_pitch: pitch.absolute_pitch,
  };
  const r2 = {
    right_actions: gesture.right_actions,
    right_fingers: gesture.right_fingers,
    left_actions: gesture.left_actions,
    left_fingers: gesture.left_fingers,
    string: gesture.strings,
    position: gesture.positions,
  };
  return {
    R0: { source_token: record.observation.source_token },
    R1: r1,
    R2: r2,
    R3: { ...r1, ...r2, notation_atoms: notation.atomic_labels },
    R4: {
      tiers: { pitch: r1, gesture: r2, notation },
      relations: record.relations,
    },
    R5: {
      dataset: record.source.dataset,
      work: record.source.work,
      section: record.source.section,
      witness: record.source.witness,
      sequence_index: record.sequence_index,
    },
  };
}

function finalize(record) {
  record.representations = representations(record);
  return record;
}

function kuiRecords() {
  const file = path.join(root, "external", "KuiSCIMA-main", "KuiSCIMA", "symbolic_dataset", "01_symbolic_edition", "02_qinquyishou", "015_guyuan.json");
  const source = JSON.parse(fs.readFileSync(file, "utf8"));
  const items = source.content.filter(item => item.box_type === "Music").slice(0, kuiSampleSize);
  return items.map((item, index) => {
    const id = `KUI_GUYUAN_${String(index + 1).padStart(4, "0")}`;
    const notation = item.notation_content ?? { type: "NULL", content: null };
    const atoms = flattenTree(notation.content);
    const labels = classifyLabels(atoms);
    const previous = index > 0 ? `KUI_GUYUAN_${String(index).padStart(4, "0")}` : null;
    return finalize({
      record_id: id,
      source: { dataset: "KuiSCIMA_v2.0", work: "015_guyuan", section: null, witness: "symbolic_edition", rights_tier: "redistributable_GPL-3.0" },
      sequence_index: index,
      event_kind: notation.type === "LEFT_HAND" ? "dependent_continuation" : "notation_unit",
      observation: { source_token: JSON.stringify(notation.content), source_type: notation.type, lyric_text: item.text_content ?? null, raw_payload: notation },
      views: {
        notation: { tree: notation.content, atomic_labels: atoms, layout_operators: labels.layout_operators },
        gesture: { sound_types: labels.sound_types, right_actions: labels.right_actions, right_fingers: [], left_actions: labels.left_actions, left_fingers: labels.left_fingers, strings: [], positions: [], unresolved_numbers: labels.unresolved_numbers, mapping_status: "source_tree_preserved_numeric_roles_unresolved" },
        pitch: { degree: null, range: null, absolute_pitch: null, derivation_status: "not_derived" },
        time: { onset: null, duration: null, tier: null },
      },
      relations: notation.type === "LEFT_HAND" && previous ? [{ type: "depends_on_previous_sounding_candidate", target: previous, status: "analytic_candidate" }] : [],
      missingness: { pitch: "source_not_annotated", time: "source_not_annotated", gesture: missing(labels.right_actions.length, labels.left_actions.length, labels.sound_types.length) },
    });
  });
}

function gmmRecords() {
  const file = path.join(root, "external", "guqinMM-main", "guqin_jzp", "JZPNet", "data", "jzp", "wushen_1", "metadata_3.txt");
  const rows = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(row => row && !row.startsWith("id\t")).slice(0, sampleSize);
  return rows.map((row, index) => {
    const fields = row.split("\t");
    const atoms = JSON.parse(fields[1].replaceAll("'", '"'));
    const labels = classifyLabels(atoms);
    return finalize({
      record_id: `GMM_WS_REAL_${String(index + 1).padStart(4, "0")}`,
      source: { dataset: "guqinMM_JZPNet", work: "wusheng_qinpu", section: null, witness: "wushen_1_crop", rights_tier: "local_only_scope_unresolved" },
      sequence_index: index,
      event_kind: "notation_crop",
      observation: { source_token: atoms.join(" "), source_type: "tree_linearization", source_image_ref: fields[0], raw_payload: atoms },
      views: {
        notation: { tree: null, atomic_labels: atoms, layout_operators: labels.layout_operators },
        gesture: { sound_types: labels.sound_types, right_actions: labels.right_actions, right_fingers: [], left_actions: labels.left_actions, left_fingers: labels.left_fingers, strings: [], positions: [], unresolved_numbers: labels.unresolved_numbers, mapping_status: "linearization_preserved_numeric_roles_unresolved" },
        pitch: { degree: null, range: null, absolute_pitch: null, derivation_status: "not_derived" },
        time: { onset: null, duration: null, tier: null },
      },
      relations: [],
      missingness: { pitch: "source_not_annotated", time: "source_not_annotated", gesture: missing(labels.right_actions.length, labels.left_actions.length, labels.sound_types.length) },
    });
  });
}

function gq39Records() {
  const file = path.join(root, "external", "gq39", "Guqin-dataset-master", "score_annotation", "guan01.xlsx");
  const workbook = XLSX.readFile(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }).slice(0, sampleSize);
  let context = {};
  return rows.map((row, index) => {
    for (const key of ["name", "section", "tuning", "mode"]) if (row[key] !== null) context[key] = row[key];
    const sourcePayload = Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith("__EMPTY")));
    return finalize({
      record_id: `GQ39_GUAN01_${String(index + 1).padStart(4, "0")}`,
      source: { dataset: "GQ39", work: context.name ?? "guan_shan_yue", section: context.section ?? 1, witness: "score_annotation_guan01", rights_tier: "local_only_no_explicit_licence" },
      sequence_index: index,
      event_kind: "expert_annotated_event",
      observation: { source_token: JSON.stringify(sourcePayload), source_type: "score_event_row", raw_payload: sourcePayload },
      views: {
        notation: { tree: null, atomic_labels: [], layout_operators: [] },
        gesture: { sound_types: [], right_actions: row["R tech"] === null ? [] : [row["R tech"]], right_fingers: row["R finger"] === null ? [] : [row["R finger"]], left_actions: [row["L tech(pitch)"], row["L tech (timbre)"]].filter(value => value !== null), left_fingers: row["L finger"] === null ? [] : [row["L finger"]], strings: row.string === null ? [] : [row.string], positions: row.position === null ? [] : [row.position], unresolved_numbers: [], mapping_status: "raw_expert_codes_preserved_codebook_mapping_pending" },
        pitch: { degree: row.degree, range: row.range, absolute_pitch: null, derivation_status: "source_degree_and_range_only" },
        time: { onset: row.onset, duration: null, tier: "score_relative" },
      },
      relations: [],
      missingness: { notation_structure: "source_not_annotated", absolute_pitch: "source_not_annotated", gesture: missing(row["R tech"], row["L tech(pitch)"], row["L tech (timbre)"]) },
    });
  });
}

function tag(block, name) {
  return block.match(new RegExp(`<${name}>([^<]+)</${name}>`))?.[1] ?? null;
}

function musicXmlRecords() {
  const base = path.join(root, "external", "guqin_musicxml", "Guqin-Dataset-master", "Guqin_Dataset_v1", "xml_no_split");
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (file.toLowerCase().endsWith(".xml")) files.push(file);
    }
  };
  walk(base);
  files.sort();
  const file = files[0];
  const xml = fs.readFileSync(file, "utf8");
  const title = tag(xml, "work-title") ?? path.basename(file, ".xml");
  const blocks = [...xml.matchAll(/<note>([\s\S]*?)<\/note>/g)].slice(0, sampleSize).map(match => match[1]);
  return blocks.map((block, index) => {
    const rest = /<rest\s*\/?\s*>/.test(block);
    const step = tag(block, "step");
    const alter = tag(block, "alter");
    const octave = tag(block, "octave");
    const pitch = rest || !step ? null : `${step}${alter === "1" ? "#" : alter === "-1" ? "b" : ""}${octave ?? ""}`;
    const overtone = /<staccato\s*\/?\s*>/.test(block);
    return finalize({
      record_id: `MXML_PILOT_${String(index + 1).padStart(4, "0")}`,
      source: { dataset: "Guqin_Dataset_MusicXML", work: title, section: null, witness: path.relative(base, file).replaceAll("\\", "/"), rights_tier: "local_only_no_explicit_licence" },
      sequence_index: index,
      event_kind: rest ? "rest" : "transcribed_note",
      observation: { source_token: block.trim(), source_type: "MusicXML_note", raw_payload: { step, alter, octave, duration: tag(block, "duration"), type: tag(block, "type"), overtone_by_corpus_convention: overtone } },
      views: {
        notation: { tree: null, atomic_labels: [], layout_operators: [] },
        gesture: { sound_types: overtone ? ["OVERTONE_CORPUS_CONVENTION"] : [], right_actions: [], right_fingers: [], left_actions: [], left_fingers: [], strings: [], positions: [], unresolved_numbers: [], mapping_status: "gesture_not_annotated" },
        pitch: { degree: null, range: null, absolute_pitch: pitch, derivation_status: pitch ? "direct_MusicXML_pitch" : "not_applicable" },
        time: { onset: null, duration: tag(block, "duration"), tier: "MusicXML_metric" },
      },
      relations: [],
      missingness: { notation_structure: "source_not_annotated", gesture: overtone ? "partially_annotated" : "source_not_annotated", pitch: rest ? "not_applicable" : null },
    });
  });
}

const records = [...kuiRecords(), ...gmmRecords(), ...gq39Records(), ...musicXmlRecords()];

for (const record of records) {
  if (!record.record_id || !record.source?.dataset || !Number.isInteger(record.sequence_index)) throw new Error(`invalid spine: ${record.record_id}`);
  for (const family of ["R0", "R1", "R2", "R3", "R4", "R5"]) if (!record.representations[family]) throw new Error(`missing ${family}: ${record.record_id}`);
}

const byDataset = Object.groupBy(records, record => record.source.dataset);
const summary = {
  generated_at: new Date().toISOString(),
  status: "PASS_WITH_CONDITIONS",
  total_records: records.length,
  datasets: Object.fromEntries(Object.entries(byDataset).map(([dataset, rows]) => [dataset, {
    records: rows.length,
    notation_structure_records: rows.filter(row => row.views.notation.atomic_labels.length || row.views.notation.tree).length,
    gesture_records: rows.filter(row => row.views.gesture.right_actions.length || row.views.gesture.left_actions.length || row.views.gesture.sound_types.length).length,
    pitch_records: rows.filter(row => row.views.pitch.degree !== null || row.views.pitch.absolute_pitch !== null).length,
    time_records: rows.filter(row => row.views.time.onset !== null || row.views.time.duration !== null).length,
    relation_records: rows.filter(row => row.relations.length).length,
    rights_tiers: [...new Set(rows.map(row => row.source.rights_tier))],
  }])) ,
  invariants: {
    common_spine_complete: true,
    R0_to_R5_materialized_for_every_record: true,
    source_payload_preserved: true,
    synthetic_rows_included: false,
    forced_cross_source_label_equivalence: false,
  },
  blockers: [
    "GQ39 categorical codebook mapping must be verified before semantic pooling",
    "numeric roles in guqinMM and the current KuiSCIMA adapter remain unresolved unless tree position licenses a role",
    "redistribution scope remains unresolved for three of four core sources",
    "pilot demonstrates representation construction but not confirmatory target coverage or statistical power",
  ],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "records.jsonl"), records.map(record => JSON.stringify(record)).join("\n") + "\n");
fs.writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
