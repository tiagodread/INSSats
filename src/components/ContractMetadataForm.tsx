import React from "react";
import type { ContractMetadata } from "../lib/types";

interface ContractMetadataFormProps {
  metadata: ContractMetadata;
  onChange: (updates: Partial<ContractMetadata>) => void;
}

export function ContractMetadataForm({
  metadata,
  onChange
}: ContractMetadataFormProps) {
  const handleChange =
    (field: keyof ContractMetadata) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      const nextValue =
        field === "createdAt"
          ? value
            ? new Date(value).toISOString()
            : new Date().toISOString()
          : value;
      onChange({ [field]: nextValue } as Partial<ContractMetadata>);
    };

  return (
    <section className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur md:p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Contract metadata
          </h2>
          <p className="text-sm text-white/60">
            Describe the scope and ownership of your Liquid Simplicity contract.
          </p>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Name
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            value={metadata.name}
            onChange={handleChange("name")}
            placeholder="Liquid Treasury Vault"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Version
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            value={metadata.version}
            onChange={handleChange("version")}
            placeholder="0.1.0"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Network
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            value={metadata.network}
            onChange={handleChange("network")}
          >
            <option value="liquid-testnet">Liquid Testnet</option>
            <option value="liquid-mainnet">Liquid Mainnet</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Author
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            value={metadata.author ?? ""}
            onChange={handleChange("author")}
            placeholder="Alice Nakamoto"
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/80">
          Description
          <textarea
            className="min-h-[120px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            value={metadata.description ?? ""}
            onChange={handleChange("description")}
            placeholder="A Simplicity program securing multi-party treasury funds."
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/80">
          Created at
          <input
            type="datetime-local"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition hover:border-white/20 focus:border-primary-400"
            value={metadata.createdAt.slice(0, 16)}
            onChange={handleChange("createdAt")}
          />
        </label>
      </div>
    </section>
  );
}
