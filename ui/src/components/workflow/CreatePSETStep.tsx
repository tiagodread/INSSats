import React from 'react';
import { StepWithNavigationProps } from './types';

const API_BASE = 'http://localhost:3001';

export function CreatePSETStep({ state, updateState, onNext, onBack, setError, loading, setLoading }: StepWithNavigationProps) {
  const [recipientAddress, setRecipientAddress] = React.useState('');
  const [amount, setAmount] = React.useState('0.00099');
  const [fee, setFee] = React.useState('0.00001');

  const handleCreatePSET = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/contract/pset/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: state.contractId,
          txid: state.txid,
          recipientAddress: recipientAddress || undefined,
          amount: amount || undefined,
          fee: fee || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PSET');
      }

      const data = await response.json();
      
      updateState({
        pset: data.pset,
        recipientAddress: data.recipientAddress,
        amount: data.amount,
        fee: data.fee,
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
        <h2 className="text-2xl font-bold text-white">Step 3: Create PSET</h2>
        <p className="mt-2 text-slate-400">
          Create a Partially Signed Elements Transaction to spend from the contract.
        </p>
      </div>

      {!state.pset ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Recipient Address <span className="text-slate-500">(optional, uses default if empty)</span>
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="tlq1qq..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Amount (L-BTC)</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00099"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Fee (L-BTC)</label>
                <input
                  type="text"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="0.00001"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
                />
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
              onClick={handleCreatePSET}
              disabled={loading}
              className="flex-1 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Creating PSET...' : 'Create PSET'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-xl">✓</span>
              <span className="font-semibold">PSET Created Successfully</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">PSET</label>
              <div className="mt-1 font-mono text-xs text-white break-all bg-slate-900/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {state.pset}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Recipient</label>
              <div className="mt-1 font-mono text-sm text-white break-all bg-slate-900/50 p-3 rounded-lg">
                {state.recipientAddress}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Amount</label>
                <div className="mt-1 font-mono text-sm text-white bg-slate-900/50 p-3 rounded-lg">
                  {state.amount} L-BTC
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Fee</label>
                <div className="mt-1 font-mono text-sm text-white bg-slate-900/50 p-3 rounded-lg">
                  {state.fee} L-BTC
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            Continue to Update PSET →
          </button>
        </div>
      )}
    </div>
  );
}
