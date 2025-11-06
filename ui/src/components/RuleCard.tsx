import React from "react";
import { ConditionEditor } from "./ConditionEditor";
import { ActionEditor } from "./ActionEditor";
import type { Condition, Rule } from "../lib/types";

interface RuleCardProps {
  index: number;
  rule: Rule;
  onUpdateRule: (updater: (rule: Rule) => Rule) => void;
  onRemoveRule: () => void;
  onDuplicateRule: () => void;
  onAddCondition: (type: Condition["type"]) => void;
  onUpdateCondition: (
    conditionId: string,
    updater: (condition: Condition) => Condition
  ) => void;
  onRemoveCondition: (conditionId: string) => void;
  onUpdateAction: (action: Rule["action"]) => void;
  onConditionModeChange: (mode: Rule["conditionMode"]) => void;
}

const conditionOptions: Array<{ value: Condition["type"]; label: string }> = [
  { value: "after_height", label: "Block height reached" },
  { value: "after_timestamp", label: "Timestamp reached" },
  { value: "requires_signature", label: "Signature required" },
  { value: "hash_preimage", label: "Hash preimage revealed" },
  { value: "oracle_value", label: "Oracle value check" }
];

export function RuleCard({
  index,
  rule,
  onUpdateRule,
  onRemoveRule,
  onDuplicateRule,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onUpdateAction,
  onConditionModeChange
}: RuleCardProps) {
  const badge = index + 1;

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-primary-900/20 backdrop-blur">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3 text-sm uppercase tracking-wide text-white/60">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/30 font-semibold text-primary-200">
              {badge}
            </span>
            Contract rule
          </div>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Title
            <input
              value={rule.title}
              onChange={(event) =>
                onUpdateRule((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Describe rule objective"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Purpose
            <textarea
              value={rule.purpose ?? ""}
              onChange={(event) =>
                onUpdateRule((current) => ({ ...current, purpose: event.target.value }))
              }
              placeholder="Explain why this rule exists."
              className="min-h-[80px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
        </div>
        <div className="flex gap-2 md:flex-col md:items-end">
          <button
            type="button"
            onClick={onDuplicateRule}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={onRemoveRule}
            className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Conditions
            </h3>
            <p className="text-xs text-white/50">
              Define the predicates that must pass before the action executes.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span>Require</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`condition-mode-${rule.id}`}
                  checked={rule.conditionMode === "all"}
                  onChange={() => onConditionModeChange("all")}
                  className="accent-primary-400"
                />
                All
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`condition-mode-${rule.id}`}
                  checked={rule.conditionMode === "any"}
                  onChange={() => onConditionModeChange("any")}
                  className="accent-primary-400"
                />
                Any
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {rule.conditions.map((condition) => (
            <ConditionEditor
              key={condition.id}
              condition={condition}
              onChange={(updater) => onUpdateCondition(condition.id, updater)}
              onRemove={() => onRemoveCondition(condition.id)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-white/60">
            Add condition
          </span>
          <div className="flex flex-wrap gap-2">
            {conditionOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => onAddCondition(option.value)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/30 hover:text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Action
          </h3>
          <p className="text-xs text-white/50">
            Describe what happens once the conditions evaluate to true.
          </p>
        </div>
        <ActionEditor action={rule.action} onChange={onUpdateAction} />
      </section>
    </article>
  );
}
