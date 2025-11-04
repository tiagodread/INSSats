import { makeId } from "../lib/ids";
import type { ContractBlueprint } from "../lib/types";

export function createSampleBlueprint(): ContractBlueprint {
  return {
    metadata: {
      name: "Liquid Vault Contract",
      network: "liquid-testnet",
      version: "0.1.0",
      description: "Example contract that timelocks funds and supports oracle-driven releases.",
      author: "Builder",
      createdAt: new Date().toISOString()
    },
    rules: [
      {
        id: makeId("rule"),
        title: "Timelock release",
        purpose: "Release funds to treasury after a specific block height.",
        conditionMode: "all",
        conditions: [
          {
            id: makeId("cond"),
            type: "after_height",
            height: 250000
          }
        ],
        action: {
          type: "release_to_address",
          address: "ex1lqdstexampleaddress0000000000000000",
          assetId: "6f0279e9edb21131c5d38dc1d8b593116dfb7a18b8f49f49031a4b0bd5d19b8f",
          amount: 100000
        }
      },
      {
        id: makeId("rule"),
        title: "Emergency abort",
        purpose: "Abort contract if oracle reports covenant breach.",
        conditionMode: "any",
        conditions: [
          {
            id: makeId("cond"),
            type: "oracle_value",
            oracleName: "covenant.watch",
            comparator: "eq",
            expectedValue: "BREACH"
          },
          {
            id: makeId("cond"),
            type: "requires_signature",
            key: "030000000000000000000000000000000000000000000000000000000000000001"
          }
        ],
        action: {
          type: "abort_contract",
          reason: "Operator signalled covenant breach."
        }
      }
    ]
  };
}
