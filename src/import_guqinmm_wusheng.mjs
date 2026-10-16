import fs from "node:fs";
import path from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: node import_guqinmm_wusheng.mjs METADATA OUTPUT_JSONL");

const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(row => row && !row.startsWith("id\t"));
const records = rows.map((row, index) => {
  const fields = row.split("\t");
  if (fields.length < 2) throw new Error(`row ${index + 1} has fewer than two tab-separated fields`);
  const labels = JSON.parse(fields[1].replaceAll("'", '"'));
  return {
    record_id: `GMM_WS_REAL_${String(index + 1).padStart(4, "0")}`,
    source_dataset: "guqinMM_JZPNet",
    source_partition: "wushen_1",
    sequence_index: index,
    source_image_path: fields[0],
    tree_linearization: labels,
    image_width: Number(fields[2]),
    image_height: Number(fields[3]),
    synthetic_or_augmented: false,
    import_status: "external_annotation_unverified"
  };
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, records.map(record => JSON.stringify(record)).join("\n") + "\n");
console.log(JSON.stringify({ records: records.length, output, unique_labels: new Set(records.flatMap(record => record.tree_linearization)).size }, null, 2));
