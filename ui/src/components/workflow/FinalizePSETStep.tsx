import React from 'react';
import { StepWithNavigationProps } from './types';

const API_BASE = 'http://localhost:3001';

export function FinalizePSETStep({ state, updateState, onNext, onBack, setError, loading, setLoading }: StepWithNavigationProps) {
  
  const handleFinalizePSET = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/contract/pset/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: state.contractId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to finalize PSET');
      }

      const data = await response.json();
      
      updateState({
        finalizedPset: data.pset,
        rawTx: data.rawTx,
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
        <h2 className="text-2xl font-bold text-white">Step 6: Finalize PSET</h2>
        <p className="mt-2 text-slate-400">
          Finalize the PSET with signatures and extract the raw transaction ready for broadcast.
        </p>
      </div>

      {!state.finalizedPset ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-400">ℹ️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-400">Finalization Process</h3>
                <p className="text-sm text-blue-300/80 mt-1">
                  The system will compile the Simplicity program with witness data, 
                  finalize the PSET using hal-simplicity, and extract the raw transaction hex.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              ← Back
            </button>
            <button
              onClick={handleFinalizePSET}
              disabled={loading}
              className="flex-1 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Finalizing PSET...' : 'Finalize PSET'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-xl">✓</span>
              <span className="font-semibold">PSET Finalized Successfully</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Finalized PSET</label>
              <div className="mt-1 font-mono text-xs text-white break-all bg-slate-900/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {state.finalizedPset}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Raw Transaction (Ready to Broadcast)</label>
              <div className="mt-1 font-mono text-xs text-green-400 break-all bg-slate-900/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {state.rawTx}
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            Continue to Broadcast →
          </button>
        </div>
      )}
    </div>
  );
}
