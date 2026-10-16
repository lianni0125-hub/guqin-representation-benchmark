import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function countTreeLabels(value, counts = new Map()) {
  if (Array.isArray(value)) {
    for (const item of value) countTreeLabels(item, counts);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) countTreeLabels(item, counts);
  } else if (typeof value === "string") {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function groupPrefix(counts, prefix) {
  return [...counts.entries()]
    .filter(([label]) => label.startsWith(prefix))
    .reduce((sum, [, count]) => sum + count, 0);
}

const kuiRoot = path.join(root, "external", "KuiSCIMA-main");
const kuiSymbolicRoot = path.join(kuiRoot, "KuiSCIMA", "symbolic_dataset");
const kuiOpticalRoot = path.join(kuiRoot, "KuiSCIMA", "optical_symbolic_dataset");
const guyuanPath = path.join(kuiSymbolicRoot, "01_symbolic_edition", "02_qinquyishou", "015_guyuan.json");
const guyuan = JSON.parse(fs.readFileSync(guyuanPath, "utf8"));
const guyuanMusic = guyuan.content.filter(item => item.box_type === "Music");
const guyuanTypes = Object.fromEntries(
  [...new Set(guyuanMusic.map(item => item.notation_content?.type ?? "NULL"))]
    .map(type => [type, guyuanMusic.filter(item => (item.notation_content?.type ?? "NULL") === type).length])
);
const guyuanLabels = countTreeLabels(guyuanMusic.map(item => item.notation_content));
const guyuanOpticalFiles = walk(kuiOpticalRoot)
  .filter(file => file.endsWith(path.join("02_qinquyishou", "015_guyuan.json")));

const guqinRoot = path.join(root, "external", "guqinMM-main");
const metadataFiles = walk(guqinRoot).filter(file => path.basename(file) === "metadata_3.txt");
const metadataRows = metadataFiles.flatMap(file => fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean));
const wushengRows = metadataRows.filter(row => /wushen/i.test(row));
const guqinImages = walk(guqinRoot).filter(file => /\.(png|jpe?g|tiff?)$/i.test(file));
const nodeDictionary = path.join(guqinRoot, "guqin_jzp", "JZPNet", "data", "jzp", "node_dict.txt");
const nodeLabels = fs.readFileSync(nodeDictionary, "utf8").split(/\r?\n/).filter(Boolean);

const jzpRoot = path.join(root, "external", "jianzipu-master");
const glyphCsv = fs.readFileSync(path.join(jzpRoot, "data", "glyphs.csv"), "utf8").split(/\r?\n/).filter(Boolean);
const pyproject = fs.readFileSync(path.join(jzpRoot, "pyproject.toml"), "utf8");

const result = {
  generated_at: new Date().toISOString(),
  kuiscima: {
    repository_license: "GPL-3.0",
    symbolic_json_files: walk(kuiSymbolicRoot).filter(file => file.endsWith(".json")).length,
    optical_json_files: walk(kuiOpticalRoot).filter(file => file.endsWith(".json")).length,
    guyuan: {
      notation_type: guyuan.notation_type,
      music_items: guyuanMusic.length,
      notation_types: guyuanTypes,
      left_hand_labels: groupPrefix(guyuanLabels, "LEFT_"),
      right_hand_labels: groupPrefix(guyuanLabels, "RIGHT_"),
      technique_labels: groupPrefix(guyuanLabels, "TECHNIQUE_"),
      optical_editions_with_matching_json: guyuanOpticalFiles.length
    }
  },
  guqinmm: {
    repository_license: "MIT (repository); source-image provenance still separate",
    image_files: guqinImages.length,
    metadata_files: metadataFiles.length,
    metadata_rows: metadataRows.length,
    wusheng_metadata_rows: wushengRows.length,
    node_dictionary_size: nodeLabels.length
  },
  jianzipu: {
    package_classifier: pyproject.includes("AGPLv3+") ? "AGPLv3+" : "not detected",
    readme_notice: "All rights reserved",
    glyph_inventory_rows: Math.max(0, glyphCsv.length - 1),
    adoption_status: "interface/baseline only until licence inconsistency is clarified"
  }
};

console.log(JSON.stringify(result, null, 2));
