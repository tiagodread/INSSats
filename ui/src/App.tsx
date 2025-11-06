import React from "react";
import { ContractMetadataForm } from "./components/ContractMetadataForm";
import { RuleCard } from "./components/RuleCard";
import { SimplicityPreview } from "./components/SimplicityPreview";
import { useContractBuilder } from "./hooks/useContractBuilder";
import { createSampleBlueprint } from "./data/sampleBlueprint";

const initialBlueprint = createSampleBlueprint();

function App() {
  const {
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
  } = useContractBuilder(initialBlueprint);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 md:px-8">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-400/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-100">
            Liquid Simplicity builder
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Assemble programmable Liquid contracts without writing Simplicity
          </h1>
          <p className="max-w-3xl text-base text-white/60 md:text-lg">
            Compose conditional spending policies, authorization logic, and
            oracle-driven execution paths. Each rule is translated into valid
            Simplicity building blocks ready to deploy on Liquid.
          </p>
        </header>

        <ContractMetadataForm metadata={blueprint.metadata} onChange={updateMetadata} />

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Contract rules</h2>
              <p className="text-sm text-white/60">
                Add predicates and actions to shape how your contract executes.
              </p>
            </div>
            <button
              type="button"
              onClick={addRule}
              className="rounded-xl border border-primary-400/60 bg-primary-500/10 px-5 py-2 text-sm font-semibold text-primary-100 transition hover:bg-primary-500/20"
            >
              Add new rule
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {blueprint.rules.map((rule, index) => (
              <RuleCard
                key={rule.id}
                index={index}
                rule={rule}
                onUpdateRule={(updater) => updateRule(rule.id, updater)}
                onRemoveRule={() => removeRule(rule.id)}
                onDuplicateRule={() => duplicateRule(rule.id)}
                onAddCondition={(type) => addCondition(rule.id, type)}
                onUpdateCondition={(conditionId, updater) =>
                  updateCondition(rule.id, conditionId, updater)
                }
                onRemoveCondition={(conditionId) => removeCondition(rule.id, conditionId)}
                onUpdateAction={(action) => updateAction(rule.id, action)}
                onConditionModeChange={(mode) => setConditionMode(rule.id, mode)}
              />
            ))}
          </div>
        </section>

        <SimplicityPreview code={simplicity} />
      </div>
    </div>
  );
}

export default App;
