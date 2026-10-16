import fs from "node:fs";

export function loadEncoderSpec(file = "experiments/encoder_spec_v0_1.json") {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function valueToken(namespace, field, value) {
  const normalized = value === null || value === undefined || value === "" ? "MISSING" : String(value);
  return `${namespace}:${field}=${normalized}`;
}

export function primitiveAccess(spec, targetId, representation) {
  const target = spec.targets[targetId];
  if (!target) throw new Error(`Unknown target: ${targetId}`);
  const groups = spec.representations[representation];
  if (!groups) throw new Error(`Unknown representation: ${representation}`);
  return groups.flatMap(group => group === "current_controls"
    ? target.current_controls.map(field => `current.${field}`)
    : target[group].flatMap(field => target.lags.map(lag => `lag${lag}.${field}`))
  ).sort();
}

export function assertNoLeakage(spec, targetId, currentInputFields) {
  const target = spec.targets[targetId];
  if (!target) throw new Error(`Unknown target: ${targetId}`);
  const forbidden = new Set(target.forbidden_current.map(field => field.toLowerCase()));
  const violations = currentInputFields.filter(field => forbidden.has(field.toLowerCase()));
  if (violations.length) throw new Error(`Target leakage: forbidden current field(s): ${violations.join(", ")}`);
}

function historyTokens(events, index, fields, lags, namespace) {
  const tokens = [];
  for (const lag of lags) {
    const previous = events[index - lag];
    for (const field of fields) {
      tokens.push(previous
        ? valueToken(`${namespace}.lag${lag}`, field, previous[field])
        : valueToken(`${namespace}.lag${lag}`, field, "BOS"));
    }
  }
  return tokens;
}

export function rawTokensForEvent(events, index, spec, targetId, representation) {
  const target = spec.targets[targetId];
  const groups = spec.representations[representation];
  if (!target || !groups) throw new Error("Unknown target or representation");
  const current = events[index];
  if (!current) throw new Error(`No event at index ${index}`);
  assertNoLeakage(spec, targetId, target.current_controls);

  const tokens = [];
  if (groups.includes("current_controls")) {
    for (const field of target.current_controls) {
      const value = field === "has_previous" ? index > 0 : current[field];
      tokens.push(valueToken("control.current", field, value));
    }
  }
  if (groups.includes("raw_history")) tokens.push(...historyTokens(events, index, target.raw_history, target.lags, "atomic"));
  if (groups.includes("pitch_history")) tokens.push(...historyTokens(events, index, target.pitch_history, target.lags, representation === "R4" ? "pitch_tier" : "pitch"));
  if (groups.includes("gesture_history")) tokens.push(...historyTokens(events, index, target.gesture_history, target.lags, representation === "R4" ? "gesture_tier" : "gesture"));

  if (representation === "R3") {
    for (const lag of target.lags) {
      const previous = events[index - lag];
      const pitch = target.pitch_history.map(field => `${field}:${previous?.[field] ?? "BOS"}`).join("|");
      const gesture = target.gesture_history.map(field => `${field}:${previous?.[field] ?? "BOS"}`).join("|");
      tokens.push(`flat_joint.lag${lag}=${pitch}||${gesture}`);
    }
  }
  if (representation === "R4") {
    for (const lag of target.lags) {
      const previous = events[index - lag];
      const pitch = target.pitch_history.map(field => `${field}:${previous?.[field] ?? "BOS"}`).join("|");
      const gesture = target.gesture_history.map(field => `${field}:${previous?.[field] ?? "BOS"}`).join("|");
      tokens.push(`association.lag${lag}=${pitch}<->${gesture}`);
    }
  }
  return tokens.sort();
}

export function fitVocabulary(tokenLists) {
  return new Set(tokenLists.flat());
}

export function applyVocabulary(tokens, vocabulary) {
  return tokens.map(token => vocabulary.has(token) ? token : `${token.slice(0, token.indexOf("=") + 1)}UNK`);
}

export function leaveOnePieceOut(rows, heldOutPiece) {
  return {
    train: rows.filter(row => row.piece_group !== heldOutPiece),
    test: rows.filter(row => row.piece_group === heldOutPiece),
  };
}

export function selectIndependentRows(rows) {
  return rows.filter(row => row.data_layer !== "duplicated_score_template");
}
