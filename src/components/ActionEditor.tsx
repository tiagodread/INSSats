import React from "react";
import { createBlankAction } from "../lib/factories";
import type { Action, FanOutMultisigAction } from "../lib/types";

interface ActionEditorProps {
  action: Action;
  onChange: (action: Action) => void;
}

const actionLabels: Record<Action["type"], string> = {
  release_to_address: "Release to address",
  fan_out_multisig: "Fan-out multisig",
  abort_contract: "Abort contract",
  delegate_control: "Delegate control"
};

export function ActionEditor({ action, onChange }: ActionEditorProps) {
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as Action["type"];
    onChange(createBlankAction(type));
  };

  return (
    <div className="space-y-4 rounded-lg border border-primary-500/40 bg-primary-500/10 p-4 text-sm">
      <label className="flex flex-col gap-2 text-white/80">
        Action type
        <select
          value={action.type}
          onChange={handleTypeChange}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
        >
          {Object.entries(actionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {renderActionFields(action, onChange)}
    </div>
  );
}

function renderActionFields(action: Action, onChange: (action: Action) => void) {
  switch (action.type) {
    case "release_to_address":
      return (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-white/70 md:col-span-2">
            Liquid address
            <input
              value={action.address}
              onChange={(event) =>
                onChange({
                  ...action,
                  address: event.target.value
                })
              }
              placeholder="ex1..."
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-white/70">
            Amount (sats)
            <input
              type="number"
              min={0}
              value={action.amount}
              onChange={(event) =>
                onChange({
                  ...action,
                  amount: Number(event.target.value)
                })
              }
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
          <label className="md:col-span-3 flex flex-col gap-2 text-white/70">
            Asset ID
            <input
              value={action.assetId}
              onChange={(event) =>
                onChange({
                  ...action,
                  assetId: event.target.value
                })
              }
              placeholder="Liquid asset ID"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
        </div>
      );
    case "fan_out_multisig":
      return renderFanOutEditor(action, onChange);
    case "abort_contract":
      return (
        <label className="flex flex-col gap-2 text-white/70">
          Abort reason
          <textarea
            value={action.reason ?? ""}
            onChange={(event) =>
              onChange({
                ...action,
                reason: event.target.value
              })
            }
            placeholder="Operator signalled covenant breach"
            className="min-h-[100px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
          />
        </label>
      );
    case "delegate_control":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-white/70">
            Delegate pubkey
            <input
              value={action.delegateKey}
              onChange={(event) =>
                onChange({
                  ...action,
                  delegateKey: event.target.value
                })
              }
              placeholder="0200..."
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-2 text-white/70">
            Memo
            <textarea
              value={action.memo ?? ""}
              onChange={(event) =>
                onChange({
                  ...action,
                  memo: event.target.value
                })
              }
              placeholder="Delegate spend authority for emergency operations."
              className="min-h-[90px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            />
          </label>
        </div>
      );
    default:
      return null;
  }
}

function renderFanOutEditor(
  action: FanOutMultisigAction,
  onChange: (action: Action) => void
) {
  const updateParticipant = (index: number, field: "label" | "key", value: string) => {
    const participants = action.participants.map((participant, idx) =>
      idx === index ? { ...participant, [field]: value } : participant
    );
    onChange({
      ...action,
      participants
    });
  };

  const addParticipant = () => {
    onChange({
      ...action,
      participants: [
        ...action.participants,
        {
          label: `Signer ${action.participants.length + 1}`,
          key: ""
        }
      ]
    });
  };

  const removeParticipant = (index: number) => {
    onChange({
      ...action,
      participants: action.participants.filter((_, idx) => idx !== index)
    });
  };

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-2 text-white/70">
        Threshold
        <input
          type="number"
          min={1}
          value={action.threshold}
          onChange={(event) =>
            onChange({
              ...action,
              threshold: Number(event.target.value)
            })
          }
          className="w-32 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
        />
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-white/60 tracking-wide">
            Participants
          </span>
          <button
            type="button"
            onClick={addParticipant}
            className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Add signer
          </button>
        </div>
        <div className="space-y-3">
          {action.participants.map((participant, index) => (
            <div
              key={`${participant.label}-${index}`}
              className="flex flex-col gap-2 rounded-md border border-white/5 bg-white/5 p-3 md:flex-row md:items-center"
            >
              <div className="flex flex-1 flex-col gap-2 text-white/70">
                <label className="text-xs font-semibold uppercase tracking-wide">
                  Label
                  <input
                    value={participant.label}
                    onChange={(event) =>
                      updateParticipant(index, "label", event.target.value)
                    }
                    className="mt-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
                  />
                </label>
              </div>
              <div className="flex flex-1 flex-col gap-2 text-white/70">
                <label className="text-xs font-semibold uppercase tracking-wide">
                  Public key
                  <input
                    value={participant.key}
                    onChange={(event) =>
                      updateParticipant(index, "key", event.target.value)
                    }
                    placeholder="02..."
                    className="mt-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none transition hover:border-white/20 focus:border-primary-400"
                  />
                </label>
              </div>
              {action.participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="self-start rounded-md px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-200"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
