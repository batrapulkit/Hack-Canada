import { jest } from '@jest/globals';

// Define mocks BEFORE importing usage
jest.unstable_mockModule('../src/config/supabase.js', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn(),
            admin: {
                createUser: jest.fn(),
                deleteUser: jest.fn(),
                updateUserById: jest.fn(),
            },
            signInWithPassword: jest.fn(),
            resetPasswordForEmail: jest.fn(),
            updateUser: jest.fn(),
        }
    }
}));

jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        hash: jest.fn().mockResolvedValue('hashed_password'),
        compare: jest.fn().mockResolvedValue(true)
    }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jest.fn().mockReturnValue('mock_jwt_token'),
        verify: jest.fn().mockReturnValue({ id: 'user_123' })
    }
}));

// Dynamic imports required for ESM mocking
const { supabase } = await import('../src/config/supabase.js');
const authController = await import('../src/controllers/authController.js');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should return 400 if fields are missing', async () => {
            req.body = { email: 'test@test.com' };
            await authController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('required') }));
        });
    });

    describe('login', () => {
        it('should return 400 if email or password missing', async () => {
            req.body = { email: 'test@test.com' };
            await authController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should login successfully with local user', async () => {
            req.body = { email: 'test@test.com', password: 'password123' };

            const mockUser = {
                id: 'user_123',
                email: 'test@test.com',
                password_hash: 'hashed_password',
                agency_id: 'agency_123',
                role: 'admin'
            };

            const mockChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis()
            };

            supabase.from.mockReturnValue(mockChain);

            // 1. User fetch (Found)
            mockChain.single.mockResolvedValueOnce({ data: mockUser, error: null });

            // 2. Agency fetch 
            mockChain.single.mockResolvedValueOnce({ data: { id: 'agency_123', agency_name: 'Test Agency' }, error: null });

            await authController.login(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                token: 'mock_jwt_token'
            }));
        });

        it('should sync user when email mismatches (Self-Healing)', async () => {
            req.body = { email: 'newemail@test.com', password: 'password123' };

            // 1. User fetch by email (NOT FOUND)
            const mockChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis()
            };

            supabase.from.mockReturnValue(mockChain);

            mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

            // 2. Supabase Auth Sign In (SUCCESS)
            const sbUser = {
                id: 'user_123',
                email: 'newemail@test.com',
                user_metadata: { full_name: 'John Doe' }
            };
            supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: sbUser }, error: null });

            // 3. Check existing user by ID (FOUND - but old email)
            // Sequence:
            // 1. User fetch by email (Line 187) -> Mock 1 (already set above)
            // 2. User fetch by ID (Line 214) -> Mock 2
            // 3. Update User (Line 224) -> Mock 3
            // 4. Agency fetch (Line 230) -> Mock 4

            // Clear previous mocks on single to be safe (though this is a new chain object if defined inside IT, actually it's same object if referenced)
            // NOTE: We defined 'mockChain' inside IT, so it's fresh.
            // BUT we already called mockResolvedValueOnce on it in Step 1 (Line 124).
            // We should just continue chaining.

            mockChain.single
                // Mock 2: User found by ID
                .mockResolvedValueOnce({ data: { id: 'user_123', email: 'old@test.com', name: 'John Doe' }, error: null })
                // Mock 3: Update response
                .mockResolvedValueOnce({ data: { id: 'user_123', email: 'newemail@test.com' }, error: null })
                // Mock 4: Agency fetch
                .mockResolvedValueOnce({ data: { id: 'agency_123' }, error: null });

            await authController.login(req, res);

            expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
                email: 'newemail@test.com'
            }));

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                token: 'mock_jwt_token'
            }));
        });
    });
});
