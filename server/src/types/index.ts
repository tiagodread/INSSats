export interface ContractCreateRequest {
  // Empty - contract logic is defined server-side for security
  // Client cannot control programSource or internalKey
}

export interface ContractCreateResponse {
  contractId: string;         // Unique identifier for this contract workspace
  nonce: number;              // Random nonce used to generate unique CMR
  cmr: string;
  contractAddress: string;
  bytecode: string;
  internalKey: string;      // Returned for reference only
  programSource: string;     // Returned for reference only
  compiledProgram: string;
}

// Contract Funding
export interface ContractFundRequest {
    contractId: string;         // Required - identifies the contract workspace
    contractAddress: string;
    amount?: number;            // Optional - defaults to 100000 sats
}

export interface ContractFundResponse {
    contractId: string;
    txid: string;
    vout: number;
    scriptPubkey: string;
    asset: string;
    value: number;
    valueSats: number;
}// PSET Creation
export interface PsetCreateRequest {
    contractId: string;         // Required - identifies the contract workspace
    recipientAddress: string;
    amount?: number;            // Optional - defaults to value from funding minus fee
    feeAmount?: number;         // Optional - defaults to 100 sats
}

export interface PsetCreateResponse {
    contractId: string;
    pset: string;
    recipientAddress: string;
}

// PSET Update
export interface PsetUpdateRequest {
    contractId: string;         // Required - identifies the contract workspace
    scriptPubkey?: string;      // Optional - loads from funding-info.json
    asset?: string;             // Optional - loads from funding-info.json
    value?: number;             // Optional - loads from funding-info.json
    cmr?: string;               // Optional - loads from contract-info.json
    internalKey?: string;       // Optional - loads from contract-info.json
}

export interface PsetUpdateResponse {
    contractId: string;
    pset: string;               // Updated PSET with contract info
}

// Attach Signature to PSET (Confirm Participation)
export interface AttachSignatureRequest {
    contractId: string;         // Required - identifies the contract workspace
    userId: string;             // User identifier (confirms participation)
}

export interface AttachSignatureResponse {
    contractId: string;
    userId: string;
    signatureIndex: number;
    participantsCount: number;
    thresholdMet: boolean;      // true when >= 2 participants
    participants: string[];     // Array of user IDs that confirmed
}

// PSET Finalization
export interface PsetFinalizeRequest {
    contractId: string;         // Required - identifies the contract workspace
    pset?: string;              // Optional - loads from updated-pset-info.json
    cmr?: string;               // Optional - loads from contract-info.json
    internalKey?: string;       // Optional - loads from contract-info.json
    programSource?: string;     // Optional - defaults to p2ms.simf
    witnessFile?: string;       // Optional - defaults to p2ms.wit
}

export interface PsetFinalizeResponse {
    contractId: string;
    pset: string;               // Finalized PSET
    rawTx: string;              // Extracted raw transaction
    finalized: boolean;
}

// Broadcast Transaction
export interface TransactionBroadcastRequest {
    contractId: string;         // Required - identifies the contract workspace
    rawTx?: string;             // Optional - uses from finalized-pset-info.json
}

export interface TransactionBroadcastResponse {
    contractId: string;
    txid: string;
    status: 'pending' | 'confirmed';
    explorerUrl: string;
}

export interface TransactionQueryResponse {
  txid: string;
  transaction: any;
  status: any;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  explorerUrl: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
