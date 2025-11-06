import React from "react";
import { createBlankCondition } from "../lib/factories";
import type { Condition } from "../lib/types";

interface ConditionEditorProps {
  condition: Condition;
  onChange: (updater: (condition: Condition) => Condition) => void;
  onRemove: () => void;
}

const conditionLabels: Record<Condition["type"], string> = {
  after_height: "Block height reached",
  after_timestamp: "Timestamp reached",
  requires_signature: "Signature required",
  hash_preimage: "Hash preimage revealed",
  oracle_value: "Oracle value check"
};

export function ConditionEditor({
  condition,
  onChange,
  onRemove
}: ConditionEditorProps) {
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as Condition["type"];
    const nextCondition = { ...createBlankCondition(nextType), id: condition.id };
    onChange(() => nextCondition);
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-slate-900/30 p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <label className="flex flex-col gap-2 text-white/70">
            Condition type
            <select
              value={condition.type}
              onChange={handleTypeChange}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            >
              {Object.entries(conditionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-red-500/10 hover:text-red-200"
        >
          Remove
        </button>
      </div>
      {renderConditionFields(condition, onChange)}
    </div>
  );
}

function renderConditionFields(
  condition: Condition,
  onChange: (updater: (condition: Condition) => Condition) => void
) {
  switch (condition.type) {
    case "after_height":
      return (
        <label className="flex flex-col gap-2 text-white/70">
          {"Block height (>=)"}
          <input
            type="number"
            min={0}
            value={condition.height}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                height: Number(event.target.value)
              }))
            }
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
          />
        </label>
      );
    case "after_timestamp":
      return (
        <label className="flex flex-col gap-2 text-white/70">
          Unlock timestamp
          <input
            type="datetime-local"
            value={condition.isoTimestamp.slice(0, 16)}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                isoTimestamp: new Date(event.target.value).toISOString()
              }))
            }
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
          />
        </label>
      );
    case "requires_signature":
      return (
        <label className="flex flex-col gap-2 text-white/70">
          Required public key (hex)
          <input
            value={condition.key}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                key: event.target.value
              }))
            }
            placeholder="02ac... pubkey"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none transition hover:border-white/20 focus:border-primary-400"
          />
        </label>
      );
    case "hash_preimage":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-white/70">
            Hash value
            <input
              value={condition.hash}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  hash: event.target.value
                }))
              }
              placeholder="Expected hash"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-white/70">
            Algorithm
            <select
              value={condition.algorithm}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  algorithm: event.target.value as typeof condition.algorithm
                }))
              }
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            >
              <option value="sha256">SHA256</option>
              <option value="sha3">SHA3</option>
              <option value="blake2b">BLAKE2b</option>
            </select>
          </label>
        </div>
      );
    case "oracle_value":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-white/70">
            Oracle name
            <input
              value={condition.oracleName}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  oracleName: event.target.value
                }))
              }
              placeholder="covenant.watch"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-white/70">
            Comparator
            <select
              value={condition.comparator}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  comparator: event.target.value as typeof condition.comparator
                }))
              }
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            >
              <option value="eq">Equals</option>
              <option value="gt">Greater than</option>
              <option value="gte">Greater or equal</option>
              <option value="lt">Less than</option>
              <option value="lte">Less or equal</option>
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-2 text-white/70">
            Expected value
            <input
              value={condition.expectedValue}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  expectedValue: event.target.value
                }))
              }
              placeholder="BREACH"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
        </div>
      );
    default:
      return null;
  }
}
