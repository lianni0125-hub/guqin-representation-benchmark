import fs from "node:fs";

const gate = fs.readFileSync("docs/research_gate_decision_packet.md", "utf8");
const boundary = fs.readFileSync("docs/phonology_concept_boundary_and_theory_feedback.md", "utf8");
const claims = fs.readFileSync("metadata/research_claim_matrix.csv", "utf8").trim().split(/\r?\n/);

if (claims.length !== 11) throw new Error(`Expected header plus 10 claims, found ${claims.length}`);
for (const status of ["SUPPORTED", "SUPPORTED_WITH_LIMITS", "SUPPORTED_FOR_T1", "PARTIAL", "NOT_SUPPORTED", "THEORY_FACING", "EXPLORATORY"]) {
  if (!claims.some(line => line.includes(`,${status},`))) throw new Error(`Missing claim status ${status}`);
}
for (let index = 1; index <= 10; index += 1) {
  if (!gate.includes(`RG${index} `)) throw new Error(`Missing gate decision RG${index}`);
}
if (!gate.includes("Transition to Post-research:** AUTHORIZED")) throw new Error("Approved Post-research transition missing");
if (!boundary.includes("does not presuppose that guqin music possesses a phonology equivalent")) throw new Error("Mandatory positioning sentence missing");
if (!boundary.includes("Avoid an unqualified title such as *The Phonology of Guqin*")) throw new Error("Title boundary missing");
if (!gate.includes("Full H3") || !gate.includes("NOT SUPPORTED")) throw new Error("Unsupported full-H3 result missing");

console.log("PASS: Research-stage gate claim and terminology boundaries");
