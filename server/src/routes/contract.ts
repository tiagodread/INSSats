import { Router } from 'express';
import { ScriptExecutor } from '../utils/scriptExecutor';
import type {
    ContractCreateRequest,
    ContractCreateResponse,
    ContractFundRequest,
    ContractFundResponse,
    PsetCreateRequest,
    PsetCreateResponse,
    PsetFinalizeRequest,
    PsetFinalizeResponse,
    TransactionBroadcastRequest,
    TransactionBroadcastResponse,
    TransactionQueryResponse,
} from '../types';

const router = Router();
const executor = new ScriptExecutor();

// POST /contract/create
router.post('/create', async (req, res) => {
    try {
        const env: Record<string, string> = {
            OUTPUT_FILE: '/dev/null',
        };

        const { stdout } = await executor.executeScript('1-create-contract.sh', env);
        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: ContractCreateResponse = {
            cmr: keyValues.CMR || '',
            contractAddress: keyValues.CONTRACT_ADDRESS || '',
            bytecode: keyValues.BYTECODE || '',
            internalKey: keyValues.INTERNAL_KEY || '',
            programSource: keyValues.PROGRAM_SOURCE || '',
            compiledProgram: keyValues.COMPILED_PROGRAM || '',
        };

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

        if (!params.contractAddress) {
            return res.status(400).json({ error: 'contractAddress is required' });
        }

        // Create temporary contract-info file
        const tmpContractInfo = {
            contractAddress: params.contractAddress,
        };

        const env: Record<string, string> = {
            CONTRACT_ADDRESS_OVERRIDE: params.contractAddress,
            OUTPUT_FILE: '/dev/null',
        };

        const { stdout } = await executor.executeScript('2-fund-contract.sh', env);

        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: ContractFundResponse = {
            txid: keyValues.FAUCET_TRANSACTION || '',
            vout: 0,
            scriptPubkey: keyValues.SCRIPT_PUBKEY || '',
            asset: keyValues.ASSET || '',
            value: keyValues.VALUE || '',
            valueSats: parseInt(keyValues.VALUE_SATS || '0'),
        };

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

        if (!params.txid) {
            return res.status(400).json({ error: 'txid is required' });
        }

        const env: Record<string, string> = {
            FUNDING_TXID_OVERRIDE: params.txid,
            OUTPUT_FILE: '/dev/null',
        };

        if (params.recipientAddress) env.RECIPIENT_ADDRESS = params.recipientAddress;
        if (params.amount) env.CONTRACT_AMOUNT = params.amount;
        if (params.fee) env.CONTRACT_FEE = params.fee;

        const { stdout } = await executor.executeScript('3-create-pset.sh', env);

        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: PsetCreateResponse = {
            pset: keyValues.PSET || '',
            recipientAddress: keyValues.RECIPIENT_ADDRESS || params.recipientAddress || '',
            amount: params.amount || '0.00099900',
            fee: params.fee || '0.00000100',
        };

        res.json(response);
    } catch (error: any) {
        console.error('PSET creation error:', error);
        res.status(500).json({
            error: 'Failed to create PSET',
            details: error.message
        });
    }
});

// POST /contract/pset/finalize
router.post('/pset/finalize', async (req, res) => {
    try {
        const params: PsetFinalizeRequest = req.body;

        const required = ['pset', 'scriptPubkey', 'asset', 'value'];
        for (const field of required) {
            if (!(params as any)[field]) {
                return res.status(400).json({ error: `${field} is required` });
            }
        }

        const env: Record<string, string> = {
            PSET_OVERRIDE: params.pset,
            SCRIPT_PUBKEY_OVERRIDE: params.scriptPubkey,
            ASSET_OVERRIDE: params.asset,
            VALUE_OVERRIDE: params.value,
            OUTPUT_FILE: '/dev/null',
        };

        // CMR and other contract-specific params are optional - script will use defaults if not provided
        if (params.cmr) env.CMR_OVERRIDE = params.cmr;
        if (params.privateKey) env.PRIVKEY_1 = params.privateKey;
        if (params.witnessFile) env.WITNESS_FILE = params.witnessFile;

        const { stdout } = await executor.executeScript('4-finalize-pset.sh', env);

        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: PsetFinalizeResponse = {
            pset: keyValues.PSET || '',
            rawTx: keyValues.RAW_TX || '',
            signature: keyValues.SIGNATURE_1 || '',
        };

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

        if (!params.rawTx) {
            return res.status(400).json({ error: 'rawTx is required' });
        }

        const env: Record<string, string> = {
            RAW_TX_OVERRIDE: params.rawTx,
            OUTPUT_FILE: '/dev/null',
        };

        const { stdout } = await executor.executeScript('5-broadcast-transaction.sh', env);

        const keyValues = executor.extractKeyValuePairs(stdout);

        const response: TransactionBroadcastResponse = {
            txid: keyValues.TXID || '',
            status: keyValues.STATUS === 'confirmed' ? 'confirmed' : 'pending',
            explorerUrl: `https://blockstream.info/liquidtestnet/tx/${keyValues.TXID}?expand`,
        };

        res.json(response);
    } catch (error: any) {
        console.error('Transaction broadcast error:', error);
        res.status(500).json({
            error: 'Failed to broadcast transaction',
            details: error.message
        });
    }
});

// GET /contract/transaction/:txid
router.get('/transaction/:txid', async (req, res) => {
    try {
        const { txid } = req.params;

        if (!txid) {
            return res.status(400).json({ error: 'txid is required' });
        }

        const env: Record<string, string> = {
            TXID: txid,
        };

        const { stdout } = await executor.executeScript('6-query-transaction.sh', env);

        // Try to extract JSON from output
        const lines = stdout.split('\n');
        let transactionData = null;
        let statusData = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.includes('txid')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.vin || parsed.vout) {
                        transactionData = parsed;
                    } else if (parsed.confirmed !== undefined) {
                        statusData = parsed;
                    }
                } catch {
                    continue;
                }
            }
        }

        const response: TransactionQueryResponse = {
            txid,
            transaction: transactionData,
            status: statusData,
            confirmed: statusData?.confirmed || false,
            blockHeight: statusData?.block_height,
            blockTime: statusData?.block_time,
            explorerUrl: `https://blockstream.info/liquidtestnet/tx/${txid}?expand`,
        };

        res.json(response);
    } catch (error: any) {
        console.error('Transaction query error:', error);
        res.status(500).json({
            error: 'Failed to query transaction',
            details: error.message
        });
    }
});

export default router;
