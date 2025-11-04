import { makeId } from "./ids";
import type { Action, Condition, Rule } from "./types";

export function createBlankAction(
  type: Action["type"] = "release_to_address"
): Action {
  switch (type) {
    case "release_to_address":
      return {
        type,
        address: "",
        assetId: "",
        amount: 0
      };
    case "fan_out_multisig":
      return {
        type,
        threshold: 2,
        participants: [
          { label: "Signer 1", key: "" },
          { label: "Signer 2", key: "" },
          { label: "Signer 3", key: "" }
        ]
      };
    case "abort_contract":
      return {
        type,
        reason: ""
      };
    case "delegate_control":
      return {
        type,
        delegateKey: "",
        memo: ""
      };
    default:
      return {
        type: "release_to_address",
        address: "",
        assetId: "",
        amount: 0
      };
  }
}

export const defaultAction: Action = createBlankAction();

export function createBlankCondition(type: Condition["type"]): Condition {
  const id = makeId("cond");
  switch (type) {
    case "after_height":
      return { id, type, height: 0 };
    case "after_timestamp":
      return {
        id,
        type,
        isoTimestamp: new Date().toISOString()
      };
    case "requires_signature":
      return {
        id,
        type,
        key: ""
      };
    case "hash_preimage":
      return {
        id,
        type,
        hash: "",
        algorithm: "sha256"
      };
    case "oracle_value":
      return {
        id,
        type,
        oracleName: "",
        comparator: "eq",
        expectedValue: ""
      };
    default:
      return { id, type: "after_height", height: 0 };
  }
}

export function createEmptyRule(): Rule {
  return {
    id: makeId("rule"),
    title: "New rule",
    purpose: "",
    conditionMode: "all",
    conditions: [createBlankCondition("after_height")],
    action: createBlankAction()
  };
}
