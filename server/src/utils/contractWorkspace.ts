import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * ContractWorkspace manages isolated workspace directories for each contract
 * to avoid file conflicts when multiple contracts are being processed
 */
export class ContractWorkspace {
    private static readonly BASE_DIR = join(process.cwd(), '../tmp/contracts');

    /**
     * Generate a unique contract ID
     * Format: contract_<timestamp>_<random>
     */
    static generateContractId(): string {
        const timestamp = Date.now();
        const random = randomBytes(4).toString('hex');
        return `contract_${timestamp}_${random}`;
    }

    /**
     * Get the workspace directory for a contract
     * Creates the directory if it doesn't exist
     */
    static getWorkspaceDir(contractId: string): string {
        const workspaceDir = join(this.BASE_DIR, contractId);
        
        if (!existsSync(workspaceDir)) {
            mkdirSync(workspaceDir, { recursive: true });
        }

        return workspaceDir;
    }

    /**
     * Get file path within a contract's workspace
     */
    static getFilePath(contractId: string, filename: string): string {
        const workspaceDir = this.getWorkspaceDir(contractId);
        return join(workspaceDir, filename);
    }

    /**
     * Validate contract ID format
     */
    static isValidContractId(contractId: string): boolean {
        return /^contract_\d+_[0-9a-f]{8}$/.test(contractId);
    }

    /**
     * Check if a contract workspace exists
     */
    static exists(contractId: string): boolean {
        const workspaceDir = join(this.BASE_DIR, contractId);
        return existsSync(workspaceDir);
    }
}
