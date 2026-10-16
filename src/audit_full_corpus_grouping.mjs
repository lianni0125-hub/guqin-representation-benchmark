import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const root = process.cwd();

function walk(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(target, predicate, out);
    else if (predicate(target)) out.push(target);
  }
  return out;
}

function norm(value) {
  return String(value ?? "").normalize("NFKC").trim();
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(file, rows) {
  fs.writeFileSync(file, `${rows.map(row => row.map(csvCell).join(",")).join("\n")}\n`);
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const gqRoot = path.join(root, "external", "gq39", "Guqin-dataset-master");
const gestureFields = ["string", "position", "R finger", "L finger", "R tech", "L tech(pitch)", "L tech (timbre)", "L tech(pitch)(perf)"];
const gqSheets = [];
const performanceMeasurements = [];

for (const corpus of ["score", "performance"]) {
  const dir = path.join(gqRoot, `${corpus}_annotation`);
  for (const file of walk(dir, candidate => candidate.toLowerCase().endsWith(".xlsx")).sort()) {
    const workbook = XLSX.readFile(file);
    for (const sheetName of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null, raw: true });
      const headers = (rows[0] ?? []).map(norm);
      const index = new Map(headers.map((header, i) => [header, i]));
      const filename = path.basename(file);
      const stem = filename.replace(/\.xlsx$/i, "").replace(/_p$/, "");
      const piece = (stem.match(/^[a-z]+/i)?.[0] ?? stem).toLowerCase();
      const isPerformanceMeasurement = corpus === "performance"
        && index.has("L tech(pitch)") && !index.has("R finger")
        && !sheetName.toLowerCase().includes("contour");
      if (isPerformanceMeasurement) {
        const data = rows.slice(1)
          .filter(row => row.slice(0, 13).some(value => norm(value) !== ""))
          .map(row => ({ "L tech(pitch)": norm(row[index.get("L tech(pitch)")]), pitch: index.has("pitch") ? norm(row[index.get("pitch")]) : "" }));
        performanceMeasurements.push({ corpus: "performance_measurement", file: filename, stem, piece, sheet: sheetName, rows: data });
      }
      const isGesture = ["R finger", "L finger", "R tech", "L tech(pitch)", "L tech (timbre)"].every(field => index.has(field));
      if (!isGesture) continue;
      const data = rows.slice(1)
        .filter(row => row.slice(0, 14).some(value => norm(value) !== ""))
        .map(row => Object.fromEntries(gestureFields.map(field => [field, index.has(field) ? norm(row[index.get(field)]) : ""])));
      gqSheets.push({ corpus, file: filename, stem, piece, sheet: sheetName, rows: data });
    }
  }
}

const pieceNames = {
  ciou: "秋風詞", feng: "鳳求凰", gu: "古琴吟", guan: "關山月", jiou: "酒狂",
  liang: "良宵引", siang: "湘江怨", yang: "陽關三疊", yi: "憶故人", yu: "玉樓春曉",
};
const performers = {
  ciou: "陳心園", feng: "李楓", gu: "許光毅", guan: "李楓", jiou: "張子謙",
  liang: "李楓", siang: "李楓", yang: "許光毅", yi: "張子謙", yu: "李楓",
};

const pieceSummary = Object.keys(pieceNames).map(piece => {
  const sheets = gqSheets.filter(row => row.piece === piece);
  const score = sheets.filter(row => row.corpus === "score");
  const performance = performanceMeasurements.filter(row => row.piece === piece);
  return {
    piece, piece_name: pieceNames[piece], performer: performers[piece],
    score_units: score.length,
    performance_clips: performance.length,
    score_rows: score.reduce((sum, row) => sum + row.rows.length, 0),
    performance_rows: performance.reduce((sum, row) => sum + row.rows.length, 0),
  };
});

const targetMap = new Map();
for (const sheet of [...gqSheets.filter(row => row.corpus === "score"), ...performanceMeasurements]) {
  for (const row of sheet.rows) {
    const availableFields = sheet.corpus === "performance_measurement" ? ["L tech(pitch)"] : gestureFields;
    for (const field of availableFields) {
      const code = row[field];
      if (!code) continue;
      const key = JSON.stringify([sheet.corpus, field, code]);
      if (!targetMap.has(key)) targetMap.set(key, { corpus: sheet.corpus, field, code, count: 0, pieces: new Set(), units: new Set() });
      const item = targetMap.get(key);
      item.count += 1;
      item.pieces.add(sheet.piece);
      item.units.add(`${sheet.file}:${sheet.sheet}`);
    }
  }
}
const targetSupport = [...targetMap.values()].map(item => ({
  corpus: item.corpus, field: item.field, raw_code: item.code, count: item.count,
  piece_count: item.pieces.size, unit_count: item.units.size,
  recurrence_scope: item.pieces.size >= 3 ? "three_or_more_pieces" : item.pieces.size === 2 ? "two_pieces" : "one_piece",
})).sort((a, b) => a.corpus.localeCompare(b.corpus) || a.field.localeCompare(b.field) || b.count - a.count);

const duplicateGroups = [];
const fingerprints = Object.groupBy(gqSheets, sheet => hash(sheet.rows));
for (const [fingerprint, sheets] of Object.entries(fingerprints)) {
  if (sheets.length < 2) continue;
  duplicateGroups.push({
    fingerprint,
    rows: sheets[0].rows.length,
    members: sheets.map(sheet => `${sheet.corpus}/${sheet.file}:${sheet.sheet}`),
    pieces: [...new Set(sheets.map(sheet => sheet.piece))],
  });
}

const scoreCandidates = gqSheets.filter(sheet => sheet.corpus === "score");
const clipCorrespondence = performanceMeasurements.map(clip => {
  const samePiece = scoreCandidates.filter(score => score.piece === clip.piece);
  const rowCountMatches = samePiece.filter(score => score.rows.length === clip.rows.length);
  return {
    clip: clip.file,
    piece: clip.piece,
    rows: clip.rows.length,
    row_count_candidate_scores: rowCountMatches.map(score => score.file),
    candidate_count: rowCountMatches.length,
  };
});

const piecelistWorkbook = XLSX.readFile(path.join(gqRoot, "0_piecelist.xlsx"));
const piecelistRows = XLSX.utils.sheet_to_json(piecelistWorkbook.Sheets[piecelistWorkbook.SheetNames[0]], { defval: null });
const declaredNotes = piecelistRows.reduce((sum, row) => sum + Number(row.n_note ?? 0), 0);

const kuiRoot = path.join(root, "external", "KuiSCIMA-main", "KuiSCIMA", "symbolic_dataset");
const kuiEditions = {};
for (const edition of ["01_symbolic_edition", "02_normalized_edition"]) {
  const files = walk(path.join(kuiRoot, edition), file => file.toLowerCase().endsWith(".json"));
  let musicRecords = 0;
  const typeCounts = {};
  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const item of json.content ?? []) {
      if (item.box_type !== "Music") continue;
      musicRecords += 1;
      const type = item.notation_content?.type ?? "NULL";
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    }
  }
  kuiEditions[edition] = { json_files: files.length, music_records: musicRecords, notation_types: typeCounts };
}

const gmmRoot = path.join(root, "external", "guqinMM-main", "guqin_jzp", "JZPNet", "data", "jzp");
const gmmMetadataFiles = walk(gmmRoot, file => /^metadata.*\.txt$/i.test(path.basename(file)));
const gmmSets = gmmMetadataFiles.map(file => {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("id\t"));
  return { path: path.relative(gmmRoot, file).replaceAll("\\", "/"), records: lines.length };
});

const xmlRoot = path.join(root, "external", "guqin_musicxml", "Guqin-Dataset-master", "Guqin_Dataset_v1", "xml_no_split");
const xmlFiles = walk(xmlRoot, file => file.toLowerCase().endsWith(".xml"));
const xmlPieces = xmlFiles.map(file => {
  const xml = fs.readFileSync(file, "utf8");
  const pitchSequence = [...xml.matchAll(/<pitch>\s*<step>([^<]+)<\/step>(?:\s*<alter>([^<]+)<\/alter>)?\s*<octave>([^<]+)<\/octave>\s*<\/pitch>/g)]
    .map(match => `${match[1]}:${match[2] ?? "0"}:${match[3]}`);
  const title = xml.match(/<work-title>([^<]*)<\/work-title>/)?.[1] ?? path.basename(file, ".xml");
  return { file: path.basename(file), title, notes: (xml.match(/<note>/g) ?? []).length, pitch_hash: hash(pitchSequence) };
});
const xmlDuplicatePitchGroups = Object.values(Object.groupBy(xmlPieces, piece => piece.pitch_hash))
  .filter(group => group.length > 1)
  .map(group => group.map(piece => piece.file));

const report = {
  generated_at: new Date().toISOString(),
  gq39: {
    grouping_unit: "piece prefix; all score variants and performance clips of a piece must remain together",
    independent_piece_groups: pieceSummary.length,
    performers: [...new Set(pieceSummary.map(row => row.performer))],
    gesture_annotation_sheets: gqSheets.length,
    gesture_annotation_rows: gqSheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
    score_rows: gqSheets.filter(sheet => sheet.corpus === "score").reduce((sum, sheet) => sum + sheet.rows.length, 0),
    duplicated_score_template_rows_in_performance_workbooks: gqSheets.filter(sheet => sheet.corpus === "performance").reduce((sum, sheet) => sum + sheet.rows.length, 0),
    performance_measurement_sheets: performanceMeasurements.length,
    performance_rows: performanceMeasurements.reduce((sum, sheet) => sum + sheet.rows.length, 0),
    declared_performance_notes: declaredNotes,
    piece_summary: pieceSummary,
    exact_duplicate_sequence_groups: duplicateGroups,
    clip_score_row_count_correspondence: clipCorrespondence,
    split_decision: "Use leave-one-piece-out grouped cross-validation for GQ39. Do not randomly split notes, worksheets, sections, or clips. Report held-out piece and performer sensitivity; performer is partially confounded with piece.",
    independence_warning: "The full-gesture worksheets inside performance workbooks are score-template copies, not additional independent gesture sequences. Exclude them as duplicate samples; use the separate performance measurement worksheets for performed pitch-technique/audio variables.",
  },
  kuiscima: kuiEditions,
  guqinmm: { metadata_files: gmmMetadataFiles.length, sets: gmmSets, total_records: gmmSets.reduce((sum, set) => sum + set.records, 0) },
  musicxml: {
    whole_piece_files: xmlPieces.length,
    total_notes: xmlPieces.reduce((sum, piece) => sum + piece.notes, 0),
    min_notes: Math.min(...xmlPieces.map(piece => piece.notes)),
    median_notes: xmlPieces.map(piece => piece.notes).sort((a, b) => a - b)[Math.floor(xmlPieces.length / 2)],
    max_notes: Math.max(...xmlPieces.map(piece => piece.notes)),
    exact_pitch_sequence_duplicate_groups: xmlDuplicatePitchGroups,
  },
};

fs.writeFileSync(path.join(root, "metadata", "full_corpus_grouping_audit.json"), `${JSON.stringify(report, null, 2)}\n`);
writeCsv(path.join(root, "metadata", "gq39_piece_groups.csv"), [
  ["piece_group", "piece_name", "performer", "score_units", "performance_clips", "score_rows", "performance_rows"],
  ...pieceSummary.map(row => [row.piece, row.piece_name, row.performer, row.score_units, row.performance_clips, row.score_rows, row.performance_rows]),
]);
writeCsv(path.join(root, "metadata", "gq39_target_support.csv"), [
  ["corpus", "field", "raw_code", "count", "piece_count", "unit_count", "recurrence_scope"],
  ...targetSupport.map(row => [row.corpus, row.field, row.raw_code, row.count, row.piece_count, row.unit_count, row.recurrence_scope]),
]);

console.log(JSON.stringify({
  gq39: {
    piece_groups: report.gq39.independent_piece_groups,
    gesture_sheets: report.gq39.gesture_annotation_sheets,
    gesture_rows: report.gq39.gesture_annotation_rows,
    score_rows: report.gq39.score_rows,
    performance_rows: report.gq39.performance_rows,
    duplicated_score_template_rows_in_performance_workbooks: report.gq39.duplicated_score_template_rows_in_performance_workbooks,
    declared_performance_notes: declaredNotes,
    exact_duplicate_groups: duplicateGroups.length,
  },
  kuiscima: report.kuiscima,
  guqinmm: report.guqinmm,
  musicxml: report.musicxml,
}, null, 2));
