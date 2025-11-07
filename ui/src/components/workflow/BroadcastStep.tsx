import React from 'react';
import { LastStepProps } from './types';

const API_BASE = 'http://localhost:3001';

export function BroadcastStep({ state, updateState, onReset, setError, loading, setLoading }: LastStepProps) {
  
  const handleBroadcast = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/contract/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: state.contractId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to broadcast transaction');
      }

      const data = await response.json();
      
      updateState({
        broadcastTxid: data.txid,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Step 7: Broadcast Transaction</h2>
        <p className="mt-2 text-slate-400">
          Broadcast the finalized transaction to the Liquid testnet network.
        </p>
      </div>

      {!state.broadcastTxid ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="font-semibold text-white mb-3">Ready to Broadcast</h3>
            <p className="text-sm text-slate-400">
              Your transaction is ready to be broadcast to the Liquid testnet. 
              Once broadcast, it will be included in the next block.
            </p>
          </div>

          <button
            onClick={handleBroadcast}
            disabled={loading}
            className="w-full rounded-xl bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Broadcasting...' : '🚀 Broadcast Transaction'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-500 bg-green-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className="text-xl font-bold text-green-400">Transaction Broadcast Successfully!</h3>
                <p className="text-sm text-green-300/80 mt-1">
                  Your transaction has been broadcast to the Liquid testnet.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-green-400 uppercase tracking-wide">Transaction ID</label>
                <div className="mt-1 font-mono text-sm text-white break-all bg-slate-900/50 p-3 rounded-lg">
                  {state.broadcastTxid}
                </div>
              </div>

              <div className="pt-3 border-t border-green-500/30">
                <label className="text-xs text-green-400 uppercase tracking-wide mb-3 block">View on Block Explorer</label>
                <div className="space-y-2">
                  <a
                    href={`https://blockstream.info/liquidtestnet/tx/${state.broadcastTxid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-green-500/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <span className="text-green-400">🔗</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-green-400 transition">
                          Blockstream Explorer
                        </div>
                        <div className="text-xs text-slate-400">
                          View transaction details and confirmations
                        </div>
                      </div>
                    </div>
                    <span className="text-green-400 group-hover:translate-x-1 transition">→</span>
                  </a>
                  
                  <a
                    href={`https://liquidtestnet.com/tx/${state.broadcastTxid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-green-500/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <span className="text-blue-400">🔍</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition">
                          Liquid Testnet Explorer
                        </div>
                        <div className="text-xs text-slate-400">
                          Alternative explorer
                        </div>
                      </div>
                    </div>
                    <span className="text-blue-400 group-hover:translate-x-1 transition">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="font-semibold text-white mb-3">Workflow Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Contract ID:</span>
                <span className="font-mono text-white">{state.contractId?.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Contract Address:</span>
                <span className="font-mono text-white">{state.contractAddress?.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Funding TXID:</span>
                <span className="font-mono text-white">{state.txid?.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Broadcast TXID:</span>
                <span className="font-mono text-green-400">{state.broadcastTxid?.substring(0, 16)}...</span>
              </div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full rounded-xl border border-primary-500 bg-primary-500/10 px-6 py-3 font-semibold text-primary-400 transition hover:bg-primary-500/20"
          >
            ↻ Start New Contract
          </button>
        </div>
      )}
    </div>
  );
}
