import React from 'react';
import { FirstStepProps } from './types';

const API_BASE = 'http://localhost:3001';

export function CreateContractStep({ state, updateState, onNext, setError, loading, setLoading }: FirstStepProps) {
  const handleCreateContract = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/contract/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contract');
      }

      const data = await response.json();
      
      updateState({
        contractId: data.contractId,
        nonce: data.nonce,
        cmr: data.cmr,
        contractAddress: data.contractAddress,
        bytecode: data.bytecode,
        internalKey: data.internalKey,
        programSource: data.programSource,
        compiledProgram: data.compiledProgram,
      });

      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Step 1: Create Contract</h2>
        <p className="mt-2 text-slate-400">
          Compile the P2MS Simplicity contract and generate a unique contract address with random nonce.
        </p>
      </div>

      {!state.contractAddress ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="font-semibold text-white mb-3">Contract Configuration</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Contract Type:</span>
                <span className="text-white font-mono">2-of-3 Multisig (P2MS)</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="text-white">Liquid Testnet</span>
              </div>
              <div className="flex justify-between">
                <span>Participants:</span>
                <span className="text-white">Alice, Bob, Carol</span>
              </div>
              <div className="flex justify-between">
                <span>Required Signatures:</span>
                <span className="text-white">2 of 3</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateContract}
            disabled={loading}
            className="w-full rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Contract...' : 'Create Contract'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <span className="text-xl">✓</span>
              <span className="font-semibold">Contract Created Successfully</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
            <h3 className="font-semibold text-white">Contract Details</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Contract ID</label>
                <div className="mt-1 font-mono text-sm text-white break-all bg-slate-900/50 p-3 rounded-lg">
                  {state.contractId}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Nonce</label>
                <div className="mt-1 font-mono text-sm text-white bg-slate-900/50 p-3 rounded-lg">
                  {state.nonce}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">CMR (Commitment Merkle Root)</label>
                <div className="mt-1 font-mono text-sm text-white break-all bg-slate-900/50 p-3 rounded-lg">
                  {state.cmr}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Contract Address</label>
                <div className="mt-1 font-mono text-sm text-green-400 break-all bg-slate-900/50 p-3 rounded-lg">
                  {state.contractAddress}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Internal Key</label>
                <div className="mt-1 font-mono text-sm text-white break-all bg-slate-900/50 p-3 rounded-lg">
                  {state.internalKey}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            Continue to Fund Contract →
          </button>
        </div>
      )}
    </div>
  );
}
