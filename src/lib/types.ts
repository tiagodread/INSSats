export type ConditionType =
  | "after_height"
  | "after_timestamp"
  | "requires_signature"
  | "hash_preimage"
  | "oracle_value";

export interface BaseCondition {
  id: string;
  type: ConditionType;
  label?: string;
}

export interface AfterHeightCondition extends BaseCondition {
  type: "after_height";
  height: number;
}

export interface AfterTimestampCondition extends BaseCondition {
  type: "after_timestamp";
  isoTimestamp: string;
}

export interface RequiresSignatureCondition extends BaseCondition {
  type: "requires_signature";
  key: string;
}

export interface HashPreimageCondition extends BaseCondition {
  type: "hash_preimage";
  hash: string;
  algorithm: "sha256" | "sha3" | "blake2b";
}

export interface OracleValueCondition extends BaseCondition {
  type: "oracle_value";
  oracleName: string;
  comparator: "eq" | "gt" | "gte" | "lt" | "lte";
  expectedValue: string;
}

export type Condition =
  | AfterHeightCondition
  | AfterTimestampCondition
  | RequiresSignatureCondition
  | HashPreimageCondition
  | OracleValueCondition;

export type ActionType =
  | "release_to_address"
  | "fan_out_multisig"
  | "abort_contract"
  | "delegate_control";

export interface BaseAction {
  type: ActionType;
  label?: string;
}

export interface ReleaseToAddressAction extends BaseAction {
  type: "release_to_address";
  address: string;
  assetId: string;
  amount: number;
}

export interface FanOutMultisigAction extends BaseAction {
  type: "fan_out_multisig";
  threshold: number;
  participants: Array<{
    label: string;
    key: string;
  }>;
}

export interface AbortContractAction extends BaseAction {
  type: "abort_contract";
  reason?: string;
}

export interface DelegateControlAction extends BaseAction {
  type: "delegate_control";
  delegateKey: string;
  memo?: string;
}

export type Action =
  | ReleaseToAddressAction
  | FanOutMultisigAction
  | AbortContractAction
  | DelegateControlAction;

export interface Rule {
  id: string;
  title: string;
  purpose?: string;
  conditionMode: "all" | "any";
  conditions: Condition[];
  action: Action;
}

export interface ContractMetadata {
  name: string;
  network: "liquid-mainnet" | "liquid-testnet";
  version: string;
  description?: string;
  author?: string;
  createdAt: string;
}

export interface ContractBlueprint {
  metadata: ContractMetadata;
  rules: Rule[];
}
