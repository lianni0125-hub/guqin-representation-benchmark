import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const root = process.cwd();
const sourceRoot = path.join(root, "external", "gq39", "Guqin-dataset-master");

const fields = ["R finger", "L finger", "R tech", "L tech(pitch)", "L tech (timbre)", "L tech(pitch)(perf)"];

const documentedPitchCodes = new Set(["1", "2", "3", "3a", "3b", "3c", "3d", "3e", "4", "4a", "4b", "4c", "5", "5a", "5b", "5c", "5d", "6", "6a"]);
const documentedTimbreCodes = new Set(["1", "2", "3", "4"]);

function atomicCodes(code) {
  // Commas mark bundled/sequential labels in the source. A full stop between
  // lettered labels occurs once and is treated as a probable delimiter typo;
  // numeric decimals remain intact and are flagged rather than rewritten.
  return code.split(",").flatMap(part => /^[0-9]+[a-z]\.[0-9]+[a-z]$/i.test(part) ? part.split(".") : [part]);
}

function classify(field, code) {
  const atoms = atomicCodes(code);
  if (field === "L finger") return { status: "unresolved", reason: "No finger-number mapping occurs in the embedded instructions." };
  if (field === "R finger") {
    if (atoms.every(atom => /^[1-5][ab]$/.test(atom))) return { status: "documented", reason: "Compositional digit-plus-direction rule." };
    if (atoms.every(atom => /^[1-5](?:[ab])?$/.test(atom))) return { status: "partial", reason: "Finger digit is documented; direction is absent for at least one token." };
    return { status: "unresolved", reason: "Contains 0 or another value outside the documented rule." };
  }
  if (field === "R tech") {
    return ["1", "2"].includes(code)
      ? { status: "documented", reason: "Explicit workbook definition." }
      : { status: "unresolved", reason: "No embedded definition for this value." };
  }
  if (field === "L tech (timbre)") {
    if (atoms.every(atom => documentedTimbreCodes.has(atom))) return { status: "documented", reason: "All atomic values occur in an embedded definition." };
    return { status: "unresolved", reason: "Contains 0, a decimal-like value, or another undefined atom." };
  }
  if (field === "L tech(pitch)" || field === "L tech(pitch)(perf)") {
    if (atoms.every(atom => documentedPitchCodes.has(atom))) return { status: "documented", reason: "All atomic values occur in an embedded definition." };
    return { status: "unresolved", reason: "Contains an atom absent from the embedded pitch-technique definitions." };
  }
  return { status: "unresolved", reason: "Field is outside the audit rules." };
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function workbookFiles(directory) {
  return fs.readdirSync(directory)
    .filter(name => name.toLowerCase().endsWith(".xlsx"))
    .sort((a, b) => a.localeCompare(b))
    .map(name => path.join(directory, name));
}

const records = [];
const noteCells = [];
const workbookSummary = [];
let fullGestureRows = 0;

for (const corpus of ["score", "performance"]) {
  const directory = path.join(sourceRoot, `${corpus}_annotation`);
  for (const file of workbookFiles(directory)) {
    const workbook = XLSX.readFile(file, { cellDates: false });
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
      const headers = (rows[0] ?? []).map(normalize);
      const headerIndex = new Map(headers.map((header, index) => [header, index]));
      let populatedRows = 0;

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex];
        if (row.slice(0, 14).some(value => normalize(value) !== "")) populatedRows += 1;
        for (const field of fields) {
          const index = headerIndex.get(field);
          if (index === undefined) continue;
          const code = normalize(row[index]);
          if (code !== "") records.push({ corpus, file: path.basename(file), sheet: sheetName, row: rowIndex + 1, field, code });
        }
        const instructionStart = headers.findIndex(header => header === "說明:" || header === "说明:");
        for (let columnIndex = instructionStart < 0 ? row.length : instructionStart; columnIndex < row.length; columnIndex += 1) {
          const value = normalize(row[columnIndex]);
          if (value === "") continue;
          noteCells.push({
            corpus,
            file: path.basename(file),
            sheet: sheetName,
            cell: XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex }),
            value,
          });
        }
      }
      if (["R finger", "L finger", "R tech", "L tech(pitch)", "L tech (timbre)"].every(field => headerIndex.has(field))) {
        fullGestureRows += populatedRows;
      }
      workbookSummary.push({ corpus, file: path.basename(file), sheet: sheetName, range: sheet["!ref"] ?? null, populated_rows: populatedRows });
    }
  }
}

const codeCounts = new Map();
for (const record of records) {
  const key = JSON.stringify([record.corpus, record.field, record.code]);
  codeCounts.set(key, (codeCounts.get(key) ?? 0) + 1);
}
const codeInventory = [...codeCounts.entries()]
  .map(([key, count]) => {
    const [corpus, field, code] = JSON.parse(key);
    return { corpus, field, code, count, ...classify(field, code) };
  })
  .sort((a, b) => a.corpus.localeCompare(b.corpus) || a.field.localeCompare(b.field) || a.code.localeCompare(b.code, undefined, { numeric: true }));

const noteGroups = new Map();
for (const note of noteCells) {
  const key = note.value;
  if (!noteGroups.has(key)) noteGroups.set(key, []);
  noteGroups.get(key).push(`${note.corpus}/${note.file}:${note.sheet}!${note.cell}`);
}
const instructionVariants = [...noteGroups.entries()]
  .map(([text, locations]) => ({ text, occurrences: locations.length, locations }))
  .sort((a, b) => b.occurrences - a.occurrences || a.text.localeCompare(b.text));

const audit = {
  generated_at: new Date().toISOString(),
  source: "GQ39 workbook-embedded instruction cells and observed field values",
  policy: {
    raw_code_is_authoritative: true,
    workbook_instruction_is_source_evidence: true,
    normalized_labels_are_project_derivatives: true,
    unsupported_specific_technique_inference_forbidden: true,
  },
  totals: {
    workbooks: new Set(workbookSummary.map(row => `${row.corpus}/${row.file}`)).size,
    sheets: workbookSummary.length,
    populated_rows_across_all_sheets: workbookSummary.reduce((sum, row) => sum + row.populated_rows, 0),
    full_gesture_rows_including_performance_workbook_score_copies: fullGestureRows,
    rows_with_at_least_one_audited_gesture_field: new Set(records.map(row => `${row.corpus}/${row.file}:${row.sheet}!${row.row}`)).size,
    coded_field_cells: records.length,
    instruction_cells: noteCells.length,
    distinct_instruction_strings: instructionVariants.length,
  },
  coverage_by_field: Object.values(Object.groupBy(codeInventory, row => `${row.corpus}/${row.field}`)).map(rows => {
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const documented = rows.filter(row => row.status === "documented").reduce((sum, row) => sum + row.count, 0);
    const partial = rows.filter(row => row.status === "partial").reduce((sum, row) => sum + row.count, 0);
    return {
      corpus: rows[0].corpus,
      field: rows[0].field,
      total,
      documented,
      partial,
      unresolved: total - documented - partial,
      documented_rate: Number((documented / total).toFixed(4)),
    };
  }),
  workbooks: workbookSummary,
  code_inventory: codeInventory,
  instruction_variants: instructionVariants,
};

fs.mkdirSync(path.join(root, "metadata"), { recursive: true });
fs.writeFileSync(path.join(root, "metadata", "gq39_codebook_audit.json"), `${JSON.stringify(audit, null, 2)}\n`);

const csvRows = [
  ["corpus", "field", "raw_code", "count", "status", "reason"],
  ...codeInventory.map(row => [row.corpus, row.field, row.code, row.count, row.status, row.reason]),
];
fs.writeFileSync(
  path.join(root, "metadata", "gq39_observed_codes.csv"),
  `${csvRows.map(row => row.map(csvCell).join(",")).join("\n")}\n`,
);

console.log(JSON.stringify(audit.totals, null, 2));
