/**
 * Key Manager
 * Manages private keys for multisig participants
 * In production, this would integrate with HSM, KMS, or secure vault
 */

interface KeyPair {
    userId: string;
    publicKey: string;
    privateKey: string;
    index: number;  // 0, 1, or 2 for multisig position
    createdAt: string;
}

export class KeyManager {
    private keys: Map<string, KeyPair> = new Map();

    constructor() {
        // Initialize with default keys for development
        // TODO: In production, load from secure vault/HSM
        this.initializeDefaultKeys();
    }

    /**
     * Initialize default keys for testing
     * In production, this would be removed and keys would be loaded from secure storage
     */
    private initializeDefaultKeys() {
        // These are example keys - replace with actual keys from elements-cli
        const defaultKeys: KeyPair[] = [
            {
                userId: 'user_0',
                publicKey: '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc',
                privateKey: 'cVt4o7BGAig1cspVkLtBDwjcfCLVjRg3pYFDHAcHQmxGpMR45tLj',
                index: 0,
                createdAt: new Date().toISOString(),
            },
            {
                userId: 'user_1',
                publicKey: '024466cf1ee6ca8e1bcbf0a2f89aa7f5b4e09a0b5e1d6f4e7c3b2a1d0e9f8c7b6a',
                privateKey: 'cU4zhap7nPJAWeMFu4j6jLrfPmqakD2bL4rFuerdEwTmTeMLfYKN',
                index: 1,
                createdAt: new Date().toISOString(),
            },
            {
                userId: 'user_2',
                publicKey: '03c96d495bfdd5ba4145e3e046fee45e84a8a48ad05bd8dbb395c011a32cf9f880',
                privateKey: 'cSv4o7BGAig1cspVkLtBDwjcfCLVjRg3pYFDHAcHQmxGpMR45tLk',
                index: 2,
                createdAt: new Date().toISOString(),
            },
        ];

        for (const key of defaultKeys) {
            this.keys.set(key.userId, key);
        }

        console.log(`[KeyManager] Initialized with ${this.keys.size} keys`);
    }

    /**
     * Get private key for a user
     * @param userId - User identifier
     * @returns Private key in WIF format
     */
    getPrivateKey(userId: string): string {
        const keyPair = this.keys.get(userId);
        if (!keyPair) {
            throw new Error(`Private key not found for user: ${userId}`);
        }
        return keyPair.privateKey;
    }

    /**
     * Get public key for a user
     * @param userId - User identifier
     * @returns Public key in hex format
     */
    getPublicKey(userId: string): string {
        const keyPair = this.keys.get(userId);
        if (!keyPair) {
            throw new Error(`Public key not found for user: ${userId}`);
        }
        return keyPair.publicKey;
    }

    /**
     * Get signature index for a user
     * @param userId - User identifier
     * @returns Index (0, 1, or 2) for multisig
     */
    getSignatureIndex(userId: string): number {
        const keyPair = this.keys.get(userId);
        if (!keyPair) {
            throw new Error(`Key not found for user: ${userId}`);
        }
        return keyPair.index;
    }

    /**
     * Get all key information for a user (excluding private key)
     * @param userId - User identifier
     * @returns Public key info
     */
    getUserKeyInfo(userId: string): Omit<KeyPair, 'privateKey'> {
        const keyPair = this.keys.get(userId);
        if (!keyPair) {
            throw new Error(`Key not found for user: ${userId}`);
        }

        const { privateKey, ...publicInfo } = keyPair;
        return publicInfo;
    }

    /**
     * List all users
     * @returns Array of user IDs
     */
    listUsers(): string[] {
        return Array.from(this.keys.keys());
    }

    /**
     * Add a new key pair
     * In production, this would be heavily restricted and audited
     * @param userId - User identifier
     * @param publicKey - Public key
     * @param privateKey - Private key (encrypted in production)
     * @param index - Signature index (0, 1, or 2)
     */
    addKey(userId: string, publicKey: string, privateKey: string, index: number) {
        if (this.keys.has(userId)) {
            throw new Error(`Key already exists for user: ${userId}`);
        }

        if (![0, 1, 2].includes(index)) {
            throw new Error('Index must be 0, 1, or 2');
        }

        // Check if index is already taken
        for (const [, keyPair] of this.keys) {
            if (keyPair.index === index) {
                throw new Error(`Index ${index} is already assigned to user: ${keyPair.userId}`);
            }
        }

        this.keys.set(userId, {
            userId,
            publicKey,
            privateKey,
            index,
            createdAt: new Date().toISOString(),
        });

        console.log(`[KeyManager] Added key for user: ${userId}, index: ${index}`);
    }

    /**
     * Validate that a user exists and has valid keys
     * @param userId - User identifier
     * @returns true if valid
     */
    validateUser(userId: string): boolean {
        return this.keys.has(userId);
    }
}

// Singleton instance
export const keyManager = new KeyManager();
