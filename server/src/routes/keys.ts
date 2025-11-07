import express from 'express';
import { keyManager } from '../utils/keyManager';

const router = express.Router();

/**
 * GET /keys/users
 * List all available users with their public key info
 */
router.get('/users', (req, res) => {
    try {
        const users = keyManager.listUsers();
        const usersInfo = users.map(userId => keyManager.getUserKeyInfo(userId));
        
        res.json({
            count: users.length,
            users: usersInfo
        });
    } catch (error: any) {
        console.error('Error listing users:', error);
        res.status(500).json({
            error: 'Failed to list users',
            details: error.message
        });
    }
});

/**
 * GET /keys/users/:userId
 * Get public key info for a specific user
 */
router.get('/users/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!keyManager.validateUser(userId)) {
            return res.status(404).json({
                error: `User not found: ${userId}`,
                availableUsers: keyManager.listUsers()
            });
        }
        
        const userInfo = keyManager.getUserKeyInfo(userId);
        res.json(userInfo);
    } catch (error: any) {
        console.error('Error getting user info:', error);
        res.status(500).json({
            error: 'Failed to get user info',
            details: error.message
        });
    }
});

export default router;
