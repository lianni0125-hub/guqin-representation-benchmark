import test from "node:test";
import assert from "node:assert/strict";
import {
  applyVocabulary,
  assertNoLeakage,
  fitVocabulary,
  leaveOnePieceOut,
  loadEncoderSpec,
  primitiveAccess,
  rawTokensForEvent,
  selectIndependentRows,
} from "../src/representation_encoders.mjs";

const spec = loadEncoderSpec();

function event(piece, degree, gesture, extra = {}) {
  return {
    piece_group: piece,
    mode: "m1",
    tuning: "t1",
    degree,
    range: 1,
    string: 3,
    position: 7,
    lh_timbre: "stopped",
    position_norm: 0.5,
    lh_pitch_motion: gesture,
    rh_direction: "inward",
    raw_event_tuple: `${degree}/${gesture}`,
    ...extra,
  };
}

test("leave-one-piece-out keeps all layers and variants of a piece together", () => {
  const rows = [
    event("yi", 1, "up", { data_layer: "score" }),
    event("yi", 2, "down", { data_layer: "performance_measurement" }),
    event("yi", 3, "up", { data_layer: "duplicated_score_template" }),
    event("guan", 1, "stationary", { data_layer: "score" }),
  ];
  const split = leaveOnePieceOut(rows, "yi");
  assert.deepEqual(new Set(split.test.map(row => row.piece_group)), new Set(["yi"]));
  assert.equal(split.test.length, 3);
  assert.equal(split.train.some(row => row.piece_group === "yi"), false);
});

test("duplicated score templates are not independent samples", () => {
  const rows = [
    event("yi", 1, "up", { data_layer: "score" }),
    event("yi", 1, "up", { data_layer: "duplicated_score_template" }),
    event("yi", 1, "up", { data_layer: "performance_measurement" }),
  ];
  assert.deepEqual(selectIndependentRows(rows).map(row => row.data_layer), ["score", "performance_measurement"]);
});

test("held-out values become UNK and never enter the training vocabulary", () => {
  const trainEvents = [event("guan", 1, "stationary"), event("guan", 2, "up")];
  const testEvents = [event("yi", 9, "rare_unseen"), event("yi", 10, "rare_unseen")];
  const trainTokens = trainEvents.map((_, index) => rawTokensForEvent(trainEvents, index, spec, "T1_performed_lh_pitch_motion_6way", "R3"));
  const vocabulary = fitVocabulary(trainTokens);
  const rawTest = rawTokensForEvent(testEvents, 1, spec, "T1_performed_lh_pitch_motion_6way", "R3");
  const encoded = applyVocabulary(rawTest, vocabulary);
  assert.equal([...vocabulary].some(token => token.includes("rare_unseen") || token.includes("degree:9")), false);
  assert.equal(encoded.some(token => token.endsWith("=UNK")), true);
});

test("forbidden current target and acoustic fields are rejected", () => {
  assert.throws(
    () => assertNoLeakage(spec, "T1_performed_lh_pitch_motion_6way", ["mode", "pitch", "L tech(pitch)"]),
    /Target leakage/,
  );
  assert.throws(
    () => assertNoLeakage(spec, "T2_score_rh_attack_binary", ["string", "r_finger_multiplicity"]),
    /Target leakage/,
  );
});

test("R3 and R4 access identical primitive fields", () => {
  for (const targetId of Object.keys(spec.targets)) {
    assert.deepEqual(primitiveAccess(spec, targetId, "R3"), primitiveAccess(spec, targetId, "R4"));
  }
});

test("future-event mutation cannot change the current encoding", () => {
  const original = [event("guan", 1, "stationary"), event("guan", 2, "up"), event("guan", 3, "down")];
  const changedFuture = structuredClone(original);
  changedFuture[2] = event("guan", 99, "future_secret");
  for (const representation of ["R0", "R1", "R2", "R3", "R4", "R5"]) {
    assert.deepEqual(
      rawTokensForEvent(original, 1, spec, "T1_performed_lh_pitch_motion_6way", representation),
      rawTokensForEvent(changedFuture, 1, spec, "T1_performed_lh_pitch_motion_6way", representation),
    );
  }
});

test("BOS is explicit rather than filled from a future event", () => {
  const tokens = rawTokensForEvent([event("guan", 1, "stationary")], 0, spec, "T1_performed_lh_pitch_motion_6way", "R4");
  assert.equal(tokens.some(token => token.includes("BOS")), true);
});
