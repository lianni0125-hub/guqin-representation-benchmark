import fs from "node:fs";
import path from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: node import_kuiscima_guyuan.mjs INPUT_JSON OUTPUT_JSONL");

const source = JSON.parse(fs.readFileSync(input, "utf8"));
const music = source.content.filter(item => item.box_type === "Music");

function flatten(value, atoms = []) {
  if (Array.isArray(value)) value.forEach(item => flatten(item, atoms));
  else if (value && typeof value === "object") Object.values(value).forEach(item => flatten(item, atoms));
  else if (typeof value === "string") {
    const codePoint = [...value].length === 1 ? value.codePointAt(0) : null;
    if (!(codePoint >= 0x2ff0 && codePoint <= 0x2fff)) atoms.push(value);
  }
  else if (typeof value === "number") atoms.push(value);
  return atoms;
}

const records = music.map((item, index) => {
  const notation = item.notation_content ?? { type: "NULL", content: null };
  return {
    record_id: `KUI_GUYUAN_${String(index + 1).padStart(4, "0")}`,
    source_dataset: "KuiSCIMA_v2.0",
    source_piece: "015_guyuan",
    sequence_index: index,
    lyric_text: item.text_content || null,
    notation_type: notation.type,
    source_structure: notation.content,
    atomic_labels: flatten(notation.content),
    context_dependency: notation.type === "LEFT_HAND" ? "previous_sounding_event" : "not_asserted",
    import_status: "source_preserving_baseline"
  };
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, records.map(record => JSON.stringify(record)).join("\n") + "\n");
console.log(JSON.stringify({ records: records.length, output, types: Object.groupBy(records, record => record.notation_type) }, (key, value) => key === "types" ? Object.fromEntries(Object.entries(value).map(([type, items]) => [type, items.length])) : value, 2));
