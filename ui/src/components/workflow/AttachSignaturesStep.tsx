import React from 'react';
import { StepWithNavigationProps } from './types';

const API_BASE = 'http://localhost:3001';

export function AttachSignaturesStep({ state, updateState, onNext, onBack, setError, loading, setLoading }: StepWithNavigationProps) {
  const [selectedSigners, setSelectedSigners] = React.useState<string[]>(['alice', 'bob']);
  const [participantsRegistered, setParticipantsRegistered] = React.useState(false);

  const handleAttachSignatures = async () => {
    setLoading(true);
    setError(null);

    try {
      for (const signer of selectedSigners) {
        const response = await fetch(`${API_BASE}/contract/pset/attach-signature`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractId: state.contractId,
            userId: signer,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to attach signature for ${signer}`);
        }
      }

      const finalResponse = await fetch(`${API_BASE}/contract/pset/attach-signature`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: state.contractId,
          userId: selectedSigners[0],
        }),
      });

      await finalResponse.json();
      
      setParticipantsRegistered(true);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSigner = (signer: string) => {
    setSelectedSigners(prev => {
      if (prev.includes(signer)) {
        return prev.filter(s => s !== signer);
      } else {
        return [...prev, signer];
      }
    });
  };

  const signers = [
    { id: 'alice', name: 'Alice', key: '0000...0001', color: 'blue' },
    { id: 'bob', name: 'Bob', key: '0000...0003', color: 'green' },
    { id: 'carol', name: 'Carol', key: '0000...0005', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Step 5: Attach Signatures</h2>
        <p className="mt-2 text-slate-400">
          Select at least 2 participants to sign the transaction (2-of-3 multisig).
        </p>
      </div>

      {!participantsRegistered ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
            <h3 className="font-semibold text-white">Select Signers (minimum 2)</h3>
            <div className="space-y-3">
              {signers.map(signer => (
                <label
                  key={signer.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition cursor-pointer ${
                    selectedSigners.includes(signer.id)
                      ? `border-${signer.color}-500 bg-${signer.color}-500/10`
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSigners.includes(signer.id)}
                    onChange={() => toggleSigner(signer.id)}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{signer.name}</div>
                    <div className="text-sm text-slate-400 font-mono">{signer.key}</div>
                  </div>
                  {selectedSigners.includes(signer.id) && (
                    <span className="text-green-400">✓</span>
                  )}
                </label>
              ))}
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
              onClick={handleAttachSignatures}
              disabled={loading || selectedSigners.length < 2}
              className="flex-1 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Attaching Signatures...' : `Attach ${selectedSigners.length} Signatures`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-xl">✓</span>
              <span className="font-semibold">Participants Registered Successfully</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="font-semibold text-white mb-3">Registered Participants</h3>
            <div className="space-y-2">
              {selectedSigners.map(signer => (
                <div key={signer} className="flex items-center gap-2 text-slate-300">
                  <span className="text-green-400">✓</span>
                  <span className="capitalize">{signer}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Signatures will be generated automatically during finalization.
            </p>
          </div>

          <button
            onClick={onNext}
            className="w-full rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            Continue to Finalize PSET →
          </button>
        </div>
      )}
    </div>
  );
}
