import React from 'react';
import { StepWithNavigationProps } from './types';

const API_BASE = 'http://localhost:3001';

export function FundContractStep({ state, updateState, onNext, onBack, setError, loading, setLoading }: StepWithNavigationProps) {
  const [manualMode, setManualMode] = React.useState(false);
  const [manualTxid, setManualTxid] = React.useState('');

  const handleFundContract = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/contract/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: state.contractId,
          contractAddress: state.contractAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fund contract');
      }

      const data = await response.json();
      
      updateState({
        txid: data.txid,
        vout: data.vout,
        scriptPubkey: data.scriptPubkey,
        asset: data.asset,
        value: data.value,
      });

      onNext();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`${errorMsg}\n\nYou can try manual funding instead.`);
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualFunding = () => {
    if (!manualTxid.trim()) {
      setError('Please enter a valid transaction ID');
      return;
    }

    updateState({
      txid: manualTxid.trim(),
      vout: 0, // Assuming vout 0
    });

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Step 2: Fund Contract</h2>
        <p className="mt-2 text-slate-400">
          Send funds to the contract address to enable spending transactions.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 className="font-semibold text-white mb-3">Contract Address</h3>
        <div className="font-mono text-sm text-green-400 break-all bg-slate-900/50 p-3 rounded-lg">
          {state.contractAddress}
        </div>
      </div>

      {!manualMode ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-400">ℹ️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-400">Automatic Funding</h3>
                <p className="text-sm text-blue-300/80 mt-1">
                  We'll use the Liquid Testnet faucet to automatically fund your contract address.
                  This may take a few moments.
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
              onClick={handleFundContract}
              disabled={loading}
              className="flex-1 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Funding Contract...' : 'Fund with Faucet'}
            </button>
            <button
              onClick={() => setManualMode(true)}
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Manual Funding
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-amber-400">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-400">Manual Funding</h3>
                <p className="text-sm text-amber-300/80 mt-1">
                  Send funds to the contract address using a Liquid Testnet wallet or faucet, then enter the transaction ID below.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Transaction ID (TXID)</label>
            <input
              type="text"
              value={manualTxid}
              onChange={(e) => setManualTxid(e.target.value)}
              placeholder="abc123def456..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              ← Back
            </button>
            <button
              onClick={() => setManualMode(false)}
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Try Faucet Again
            </button>
            <button
              onClick={handleManualFunding}
              disabled={!manualTxid.trim()}
              className="flex-1 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with Manual TXID →
            </button>
          </div>
        </div>
      )}

      {state.txid && (
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <span className="text-xl">✓</span>
            <span className="font-semibold">Contract Funded Successfully</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Transaction ID</label>
              <div className="mt-1 font-mono text-sm text-white break-all bg-slate-900/50 p-3 rounded-lg">
                {state.txid}
              </div>
            </div>

            {state.value && (
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Amount</label>
                <div className="mt-1 font-mono text-sm text-white bg-slate-900/50 p-3 rounded-lg">
                  {state.value} L-BTC
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onNext}
            className="w-full rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            Continue to Create PSET →
          </button>
        </div>
      )}
    </div>
  );
}
