import { WorkflowState } from '../ContractWorkflow';

export interface StepProps {
  state: WorkflowState;
  updateState: (updates: Partial<WorkflowState>) => void;
  setError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export interface StepWithNavigationProps extends StepProps {
  onNext: () => void;
  onBack: () => void;
}

export interface FirstStepProps extends StepProps {
  onNext: () => void;
}

export interface LastStepProps extends StepProps {
  onReset: () => void;
}
