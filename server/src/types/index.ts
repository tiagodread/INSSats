export interface ContractCreateRequest {
  // Empty - contract logic is defined server-side for security
  // Client cannot control programSource or internalKey
}

export interface ContractCreateResponse {
  cmr: string;
  contractAddress: string;
  bytecode: string;
  internalKey: string;      // Returned for reference only
  programSource: string;     // Returned for reference only
  compiledProgram: string;
}

export interface ContractFundRequest {
  contractAddress: string;
}

export interface ContractFundResponse {
  txid: string;
  vout: number;
  scriptPubkey: string;
  asset: string;
  value: string;
  valueSats: number;
}

export interface PsetCreateRequest {
  txid: string;
  recipientAddress?: string;
  amount?: string;
  fee?: string;
}

export interface PsetCreateResponse {
  pset: string;
  recipientAddress: string;
  amount: string;
  fee: string;
}

export interface PsetFinalizeRequest {
  pset: string;
  scriptPubkey: string;
  asset: string;
  value: string;
  cmr?: string;              // Optional - server will use default if not provided
  privateKey?: string;
  witnessFile?: string;
}

export interface PsetFinalizeResponse {
  pset: string;
  rawTx: string;
  signature: string;
}

export interface TransactionBroadcastRequest {
  rawTx: string;
}

export interface TransactionBroadcastResponse {
  txid: string;
  status: 'pending' | 'confirmed';
  explorerUrl: string;
  transaction?: any;
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
