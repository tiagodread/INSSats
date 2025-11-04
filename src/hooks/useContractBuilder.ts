import { useMemo, useState } from "react";
import { makeId } from "../lib/ids";
import { blueprintToSimplicity } from "../lib/simplicity";
import { createBlankCondition, createEmptyRule } from "../lib/factories";
import type {
  Action,
  Condition,
  ContractBlueprint,
  ContractMetadata,
  Rule
} from "../lib/types";

export function useContractBuilder(initialBlueprint: ContractBlueprint) {
  const [blueprint, setBlueprint] = useState<ContractBlueprint>(initialBlueprint);

  const updateMetadata = (metadata: Partial<ContractMetadata>) => {
    setBlueprint((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...metadata }
    }));
  };

  const addRule = () => {
    setBlueprint((prev) => ({
      ...prev,
      rules: [...prev.rules, createEmptyRule()]
    }));
  };

  const duplicateRule = (ruleId: string) => {
    setBlueprint((prev) => {
      const rule = prev.rules.find((item) => item.id === ruleId);
      if (!rule) {
        return prev;
      }
      const clone: Rule = {
        ...rule,
        id: makeId("rule"),
        title: `${rule.title} copy`,
        conditions: rule.conditions.map((condition) => ({
          ...condition,
          id: makeId("cond")
        }))
      };
      return {
        ...prev,
        rules: [...prev.rules, clone]
      };
    });
  };

  const updateRule = (ruleId: string, updater: (rule: Rule) => Rule) => {
    setBlueprint((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) => (rule.id === ruleId ? updater(rule) : rule))
    }));
  };

  const removeRule = (ruleId: string) => {
    setBlueprint((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== ruleId)
    }));
  };

  const addCondition = (ruleId: string, type: Condition["type"]) => {
    updateRule(ruleId, (rule) => ({
      ...rule,
      conditions: [
        ...rule.conditions,
        createBlankCondition(type)
      ]
    }));
  };

  const updateCondition = (
    ruleId: string,
    conditionId: string,
    updater: (condition: Condition) => Condition
  ) => {
    updateRule(ruleId, (rule) => ({
      ...rule,
      conditions: rule.conditions.map((condition) =>
        condition.id === conditionId ? updater(condition) : condition
      )
    }));
  };

  const removeCondition = (ruleId: string, conditionId: string) => {
    updateRule(ruleId, (rule) => ({
      ...rule,
      conditions: rule.conditions.filter((condition) => condition.id !== conditionId)
    }));
  };

  const updateAction = (ruleId: string, action: Action) => {
    updateRule(ruleId, (rule) => ({
      ...rule,
      action
    }));
  };

  const setConditionMode = (ruleId: string, mode: Rule["conditionMode"]) => {
    updateRule(ruleId, (rule) => ({
      ...rule,
      conditionMode: mode
    }));
  };

  const simplicity = useMemo(() => blueprintToSimplicity(blueprint), [blueprint]);

  return {
    blueprint,
    simplicity,
    updateMetadata,
    addRule,
    duplicateRule,
    updateRule,
    removeRule,
    addCondition,
    updateCondition,
    removeCondition,
    updateAction,
    setConditionMode
  };
}
