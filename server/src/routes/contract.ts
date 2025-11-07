import express from 'express';
import { ScriptExecutor } from '../utils/scriptExecutor';
import { ContractWorkspace } from '../utils/contractWorkspace';
import { readFileSync, writeFileSync } from 'fs';
import { 
    ContractCreateRequest, 
    ContractCreateResponse, 
    ContractFundRequest, 
    ContractFundResponse, 
    PsetCreateRequest, 
    PsetCreateResponse, 
    PsetUpdateRequest, 
    PsetUpdateResponse, 
    AttachSignatureRequest, 
    AttachSignatureResponse,
    PsetFinalizeRequest,
    PsetFinalizeResponse,
    TransactionBroadcastRequest,
    TransactionBroadcastResponse,
} from '../types';

const router = express.Router();
const executor = new ScriptExecutor();

// POST /contract/create
router.post('/create', async (req, res) => {
    try {
        // Generate unique contract ID and workspace
        const contractId = ContractWorkspace.generateContractId();
        const workspaceDir = ContractWorkspace.getWorkspaceDir(contractId);

        console.log(`[${contractId}] Creating new contract workspace at ${workspaceDir}`);

        const env: Record<string, string> = {
            OUTPUT_FILE: ContractWorkspace.getFilePath(contractId, 'contract-info.json'),
        };

        const { stdout } = await executor.executeScript('1-create-contract.sh', env);
        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: ContractCreateResponse = {
            contractId,
            nonce: parseInt(keyValues.NONCE || '0', 10),
            cmr: keyValues.CMR || '',
            contractAddress: keyValues.CONTRACT_ADDRESS || '',
            bytecode: keyValues.BYTECODE || '',
            internalKey: keyValues.INTERNAL_KEY || '',
            programSource: keyValues.PROGRAM_SOURCE || '',
            compiledProgram: keyValues.COMPILED_PROGRAM || '',
        };

        console.log(`[${contractId}] Contract created: ${response.contractAddress}`);
        res.json(response);
    } catch (error: any) {
        console.error('Contract creation error:', error);
        res.status(500).json({
            error: 'Failed to create contract',
            details: error.message
        });
    }
});

// POST /contract/fund
router.post('/fund', async (req, res) => {
    try {
        const params: ContractFundRequest = req.body;

        if (!params.contractId) {
            return res.status(400).json({ error: 'contractId is required' });
        }

        if (!ContractWorkspace.exists(params.contractId)) {
            return res.status(404).json({ error: 'Contract workspace not found' });
        }

        if (!params.contractAddress) {
            return res.status(400).json({ error: 'contractAddress is required' });
        }

        console.log(`[${params.contractId}] Funding contract at ${params.contractAddress}`);

        const env: Record<string, string> = {
            CONTRACT_ADDRESS: params.contractAddress,
            OUTPUT_FILE: ContractWorkspace.getFilePath(params.contractId, 'funding-info.json'),
        };

        if (params.amount) {
            env.AMOUNT = params.amount.toString();
        }

        const { stdout } = await executor.executeScript('2-fund-contract.sh', env);
        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: ContractFundResponse = {
            contractId: params.contractId,
            txid: keyValues.FAUCET_TRANSACTION || '',
            vout: parseInt(keyValues.VOUT || '0', 10),
            scriptPubkey: keyValues.SCRIPT_PUBKEY || '',
            asset: keyValues.ASSET || '',
            value: parseFloat(keyValues.VALUE || '0'),
            valueSats: parseInt(keyValues.VALUE_SATS || '0', 10),
        };

        console.log(`[${params.contractId}] Funded with txid: ${response.txid}`);
        res.json(response);
    } catch (error: any) {
        console.error('Contract funding error:', error);
        res.status(500).json({
            error: 'Failed to fund contract',
            details: error.message
        });
    }
});

// POST /contract/pset/create
router.post('/pset/create', async (req, res) => {
    try {
        const params: PsetCreateRequest = req.body;

        if (!params.contractId) {
            return res.status(400).json({ error: 'contractId is required' });
        }

        if (!ContractWorkspace.exists(params.contractId)) {
            return res.status(404).json({ error: 'Contract workspace not found' });
        }

        if (!params.recipientAddress) {
            return res.status(400).json({ error: 'recipientAddress is required' });
        }

        console.log(`[${params.contractId}] Creating PSET for recipient: ${params.recipientAddress}`);

        const env: Record<string, string> = {
            RECIPIENT_ADDRESS: params.recipientAddress,
            FUNDING_INFO_FILE: ContractWorkspace.getFilePath(params.contractId, 'funding-info.json'),
            OUTPUT_FILE: ContractWorkspace.getFilePath(params.contractId, 'pset-info.json'),
        };

        if (params.amount) {
            env.AMOUNT_OVERRIDE = params.amount.toString();
        }

        if (params.feeAmount) {
            env.FEE_AMOUNT = params.feeAmount.toString();
        }

        const { stdout } = await executor.executeScript('3-create-pset.sh', env);
        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: PsetCreateResponse = {
            contractId: params.contractId,
            pset: keyValues.PSET || '',
            recipientAddress: keyValues.RECIPIENT_ADDRESS || params.recipientAddress,
        };

        console.log(`[${params.contractId}] PSET created`);
        res.json(response);
    } catch (error: any) {
        console.error('PSET creation error:', error);
        res.status(500).json({
            error: 'Failed to create PSET',
            details: error.message
        });
    }
});

// PATCH /contract/pset/update
router.patch('/pset/update', async (req, res) => {
    try {
        const params: PsetUpdateRequest = req.body;

        if (!params.contractId) {
            return res.status(400).json({ error: 'contractId is required' });
        }

        if (!ContractWorkspace.exists(params.contractId)) {
            return res.status(404).json({ error: 'Contract workspace not found' });
        }

        console.log(`[${params.contractId}] Updating PSET with contract info`);

        const env: Record<string, string> = {
            PSET_INFO_FILE: ContractWorkspace.getFilePath(params.contractId, 'pset-info.json'),
            CONTRACT_INFO_FILE: ContractWorkspace.getFilePath(params.contractId, 'contract-info.json'),
            FUNDING_INFO_FILE: ContractWorkspace.getFilePath(params.contractId, 'funding-info.json'),
            OUTPUT_FILE: ContractWorkspace.getFilePath(params.contractId, 'updated-pset-info.json'),
        };

        // Optional overrides
        if (params.scriptPubkey) env.SCRIPT_PUBKEY_OVERRIDE = params.scriptPubkey;
        if (params.asset) env.ASSET_OVERRIDE = params.asset;
        if (params.value) env.VALUE_OVERRIDE = params.value.toString();
        if (params.cmr) env.CMR_OVERRIDE = params.cmr;
        if (params.internalKey) env.INTERNAL_KEY_OVERRIDE = params.internalKey;

        const { stdout } = await executor.executeScript('4-update-pset.sh', env);
        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: PsetUpdateResponse = {
            contractId: params.contractId,
            pset: keyValues.PSET || '',
        };

        console.log(`[${params.contractId}] PSET updated with contract info`);
        res.json(response);
    } catch (error: any) {
        console.error('PSET update error:', error);
        res.status(500).json({
            error: 'Failed to update PSET',
            details: error.message
        });
    }
});

// PATCH /contract/pset/attach-signature
router.patch('/pset/attach-signature', async (req, res) => {
    try {
        const params: AttachSignatureRequest = req.body;

        if (!params.contractId) {
            return res.status(400).json({ error: 'contractId is required' });
        }

        if (!ContractWorkspace.exists(params.contractId)) {
            return res.status(404).json({ error: 'Contract workspace not found' });
        }

        if (!params.userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        console.log(`[${params.contractId}] User ${params.userId} confirming participation`);

        const participantsFile = ContractWorkspace.getFilePath(params.contractId, 'participants-info.json');

        // Load or initialize participants
        let participantsData: any = { participants: [] };
        try {
            const fileContent = readFileSync(participantsFile, 'utf-8');
            participantsData = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist yet, use defaults
        }

        // Add userId if not already present
        if (!participantsData.participants.includes(params.userId)) {
            participantsData.participants.push(params.userId);
        }

        // Save updated participants
        writeFileSync(participantsFile, JSON.stringify(participantsData, null, 2));

        const response: AttachSignatureResponse = {
            contractId: params.contractId,
            userId: params.userId,
            signatureIndex: 0, // Not used in current implementation
            participantsCount: participantsData.participants.length,
            thresholdMet: participantsData.participants.length >= 2,
            participants: participantsData.participants,
        };

        console.log(`[${params.contractId}] Participants: ${participantsData.participants.join(', ')}`);
        res.json(response);
    } catch (error: any) {
        console.error('Attach signature error:', error);
        res.status(500).json({
            error: 'Failed to attach signature',
            details: error.message
        });
    }
});

// POST /contract/pset/finalize
router.post('/pset/finalize', async (req, res) => {
    try {
        const params: PsetFinalizeRequest = req.body;

        if (!params.contractId) {
            return res.status(400).json({ error: 'contractId is required' });
        }

        if (!ContractWorkspace.exists(params.contractId)) {
            return res.status(404).json({ error: 'Contract workspace not found' });
        }

        console.log(`[${params.contractId}] Finalizing PSET`);

        const env: Record<string, string> = {
            UPDATED_PSET_FILE: ContractWorkspace.getFilePath(params.contractId, 'updated-pset-info.json'),
            CONTRACT_FILE: ContractWorkspace.getFilePath(params.contractId, 'contract-info.json'),
            PARTICIPANTS_FILE: ContractWorkspace.getFilePath(params.contractId, 'participants-info.json'),
            OUTPUT_FILE: ContractWorkspace.getFilePath(params.contractId, 'finalized-pset-info.json'),
        };

        // Optional overrides
        if (params.pset) env.PSET_OVERRIDE = params.pset;
        if (params.cmr) env.CMR_OVERRIDE = params.cmr;
        if (params.internalKey) env.INTERNAL_KEY_OVERRIDE = params.internalKey;
        if (params.programSource) env.PROGRAM_SOURCE_OVERRIDE = params.programSource;
        if (params.witnessFile) env.WITNESS_FILE_OVERRIDE = params.witnessFile;

        const { stdout } = await executor.executeScript('6-finalize-pset.sh', env);
        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: PsetFinalizeResponse = {
            contractId: params.contractId,
            pset: keyValues.PSET || '',
            rawTx: keyValues.RAW_TX || '',
            finalized: keyValues.FINALIZED === 'true',
        };

        console.log(`[${params.contractId}] PSET finalized, ready to broadcast`);
        res.json(response);
    } catch (error: any) {
        console.error('PSET finalization error:', error);
        res.status(500).json({
            error: 'Failed to finalize PSET',
            details: error.message
        });
    }
});

// POST /contract/broadcast
router.post('/broadcast', async (req, res) => {
    try {
        const params: TransactionBroadcastRequest = req.body;

        if (!params.contractId) {
            return res.status(400).json({ error: 'contractId is required' });
        }

        if (!ContractWorkspace.exists(params.contractId)) {
            return res.status(404).json({ error: 'Contract workspace not found' });
        }

        console.log(`[${params.contractId}] Broadcasting transaction`);

        const env: Record<string, string> = {
            FINALIZED_PSET_FILE: ContractWorkspace.getFilePath(params.contractId, 'finalized-pset-info.json'),
            OUTPUT_FILE: ContractWorkspace.getFilePath(params.contractId, 'broadcast-info.json'),
        };

        // Optional override
        if (params.rawTx) {
            env.RAW_TX_OVERRIDE = params.rawTx;
        }

        const { stdout } = await executor.executeScript('7-broadcast-transaction.sh', env);
        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: TransactionBroadcastResponse = {
            contractId: params.contractId,
            txid: keyValues.TXID || '',
            status: (keyValues.STATUS as 'pending' | 'confirmed') || 'pending',
            explorerUrl: keyValues.EXPLORER_URL || '',
        };

        console.log(`[${params.contractId}] Transaction broadcast: ${response.txid}`);
        res.json(response);
    } catch (error: any) {
        console.error('Transaction broadcast error:', error);
        res.status(500).json({
            error: 'Failed to broadcast transaction',
            details: error.message
        });
    }
});

export default router;
