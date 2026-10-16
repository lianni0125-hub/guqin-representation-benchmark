import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const root = process.cwd();

function walk(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, predicate, out);
    else if (predicate(file)) out.push(file);
  }
  return out;
}

function workbookAudit(dir) {
  const files = walk(dir, file => file.toLowerCase().endsWith(".xlsx"));
  const headers = new Set();
  let dataRows = 0;
  let sheets = 0;
  for (const file of files) {
    const workbook = XLSX.readFile(file);
    for (const sheetName of workbook.SheetNames) {
      sheets += 1;
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      for (const cell of rows[0] ?? []) if (cell !== null) headers.add(String(cell));
      dataRows += rows.slice(1).filter(row => row.slice(0, 14).some(cell => cell !== null && String(cell).trim() !== "")).length;
    }
  }
  return { files: files.length, sheets, populated_annotation_rows: dataRows, headers: [...headers] };
}

const kuiPath = path.join(root, "external", "KuiSCIMA-main", "KuiSCIMA", "symbolic_dataset", "01_symbolic_edition", "02_qinquyishou", "015_guyuan.json");
const kui = JSON.parse(fs.readFileSync(kuiPath, "utf8"));
const kuiMusic = kui.content.filter(item => item.box_type === "Music");

const gmmMetadata = path.join(root, "external", "guqinMM-main", "guqin_jzp", "JZPNet", "data", "jzp", "wushen_1", "metadata_3.txt");
const gmmRows = fs.readFileSync(gmmMetadata, "utf8").split(/\r?\n/).filter(row => row && !row.startsWith("id\t"));

const gqRoot = path.join(root, "external", "gq39", "Guqin-dataset-master");
const musicXmlRoot = path.join(root, "external", "guqin_musicxml", "Guqin-Dataset-master", "Guqin_Dataset_v1");
const wholeXml = walk(path.join(musicXmlRoot, "xml_no_split"), file => file.toLowerCase().endsWith(".xml"));
const phraseXml = walk(path.join(musicXmlRoot, "xml"), file => file.toLowerCase().endsWith(".xml"));

let notes = 0;
let measures = 0;
let rests = 0;
let overtoneMarks = 0;
for (const file of wholeXml) {
  const xml = fs.readFileSync(file, "utf8");
  notes += (xml.match(/<note>/g) ?? []).length;
  measures += (xml.match(/<measure\b/g) ?? []).length;
  rests += (xml.match(/<rest\s*\/?\s*>/g) ?? []).length;
  overtoneMarks += (xml.match(/<staccato\s*\/?\s*>/g) ?? []).length;
}

console.log(JSON.stringify({
  generated_at: new Date().toISOString(),
  kuiscima_guyuan: {
    records: kuiMusic.length,
    notation_types: Object.fromEntries(Object.entries(Object.groupBy(kuiMusic, item => item.notation_content?.type ?? "NULL")).map(([key, value]) => [key, value.length])),
    fields: [...new Set(kuiMusic.flatMap(item => Object.keys(item)))],
  },
  guqinmm_wushen_real: {
    records: gmmRows.length,
    metadata_columns: ["source_image_path", "tree_linearization", "image_width", "image_height"],
  },
  gq39: {
    score: workbookAudit(path.join(gqRoot, "score_annotation")),
    performance: workbookAudit(path.join(gqRoot, "performance_annotation")),
  },
  guqin_musicxml: {
    whole_piece_files: wholeXml.length,
    phrase_files: phraseXml.length,
    whole_piece_notes: notes,
    whole_piece_measures: measures,
    rests,
    corpus_convention_overtone_staccato_marks: overtoneMarks,
    inspected_elements: ["work-title", "measure", "time", "note", "pitch", "step", "alter", "octave", "duration", "type", "rest", "staccato"],
  },
}, null, 2));
