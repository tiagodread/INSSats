import React, { useState } from 'react';
import { CreateContractStep } from './workflow/CreateContractStep';
import { FundContractStep } from './workflow/FundContractStep';
import { CreatePSETStep } from './workflow/CreatePSETStep';
import { UpdatePSETStep } from './workflow/UpdatePSETStep';
import { AttachSignaturesStep } from './workflow/AttachSignaturesStep';
import { FinalizePSETStep } from './workflow/FinalizePSETStep';
import { BroadcastStep } from './workflow/BroadcastStep';

export interface WorkflowState {
  contractId?: string;
  nonce?: number;
  cmr?: string;
  contractAddress?: string;
  bytecode?: string;
  internalKey?: string;
  programSource?: string;
  compiledProgram?: string;
  
  txid?: string;
  vout?: number;
  scriptPubkey?: string;
  asset?: string;
  value?: string;
  
  pset?: string;
  recipientAddress?: string;
  amount?: string;
  fee?: string;
  
  updatedPset?: string;
  
  signature1?: string;
  signature2?: string;
  signature3?: string;
  
  finalizedPset?: string;
  rawTx?: string;
  
  broadcastTxid?: string;
}

const steps = [
  { id: 1, name: 'Create Contract', description: 'Compile and generate contract address' },
  { id: 2, name: 'Fund Contract', description: 'Send funds to contract address' },
  { id: 3, name: 'Create PSET', description: 'Create partially signed transaction' },
  { id: 4, name: 'Update PSET', description: 'Update PSET with contract info' },
  { id: 5, name: 'Attach Signatures', description: 'Add participant signatures' },
  { id: 6, name: 'Finalize PSET', description: 'Finalize transaction' },
  { id: 7, name: 'Broadcast', description: 'Broadcast to network' },
];

export function ContractWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WorkflowState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = (updates: Partial<WorkflowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const goToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
    setError(null);
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setState({});
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 md:px-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-400/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-100">
            INSSats Contract API
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            P2MS Contract Workflow
          </h1>
          <p className="max-w-3xl text-base text-white/60 md:text-lg">
            Step-by-step process to create, fund, and execute a 2-of-3 multisig Simplicity contract on Liquid testnet.
          </p>
        </header>

        {/* Progress Steps */}
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between min-w-[800px] px-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold transition-colors ${
                      step.id < currentStep
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : step.id === currentStep
                        ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                        : 'border-slate-700 bg-slate-800/50 text-slate-500'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${
                      step.id === currentStep ? 'text-white' : 'text-slate-400'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-slate-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 ${
                    step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-400">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-400">Error</h3>
                <p className="text-sm text-red-300/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Step Content */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          {currentStep === 1 && (
            <CreateContractStep
              state={state}
              updateState={updateState}
              onNext={goToNextStep}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {currentStep === 2 && (
            <FundContractStep
              state={state}
              updateState={updateState}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {currentStep === 3 && (
            <CreatePSETStep
              state={state}
              updateState={updateState}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {currentStep === 4 && (
            <UpdatePSETStep
              state={state}
              updateState={updateState}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {currentStep === 5 && (
            <AttachSignaturesStep
              state={state}
              updateState={updateState}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {currentStep === 6 && (
            <FinalizePSETStep
              state={state}
              updateState={updateState}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {currentStep === 7 && (
            <BroadcastStep
              state={state}
              updateState={updateState}
              onReset={resetWorkflow}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
