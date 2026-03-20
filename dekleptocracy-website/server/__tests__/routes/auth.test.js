import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import User from '../../models/User.js';
import { createTestUser, getAuthHeader } from '../helpers/auth.js';
import { JWT_SECRET, generateRefreshToken } from '../../utils/jwtConfig.js';

// Mock google-auth-library
vi.mock('google-auth-library', () => {
  const mockVerifyIdToken = vi.fn();
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
    __mockVerifyIdToken: mockVerifyIdToken,
  };
});

describe('Auth Routes', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user and return tokens (201)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          agreeToTerms: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.body.user.fullName).toBe('John Doe');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'john@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when agreeToTerms is false', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          agreeToTerms: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await createTestUser({ email: 'dupe@example.com' });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'Another User',
          email: 'dupe@example.com',
          password: 'password123',
          agreeToTerms: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials (200)', async () => {
      await createTestUser({ email: 'login@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should return 401 for wrong password', async () => {
      await createTestUser({ email: 'login2@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login2@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for nonexistent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/google', () => {
    let mockVerifyIdToken;

    beforeEach(async () => {
      const mod = await import('google-auth-library');
      mockVerifyIdToken = mod.__mockVerifyIdToken;
      mockVerifyIdToken.mockReset();
    });

    it('should create a new user via Google OAuth', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: 'google@example.com',
          name: 'Google User',
          picture: 'https://example.com/photo.jpg',
        }),
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'fake-google-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.isNewUser).toBe(true);
      expect(res.body.user.email).toBe('google@example.com');
    });

    it('should login existing Google user', async () => {
      // Create existing Google user
      const user = new User({
        fullName: 'Existing Google User',
        email: 'existing-google@example.com',
        googleId: 'google-456',
        isGoogleUser: true,
        agreeToTerms: true,
      });
      await user.save();

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-456',
          email: 'existing-google@example.com',
          name: 'Existing Google User',
          picture: null,
        }),
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'fake-google-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isNewUser).toBe(false);
    });

    it('should return 400 for missing credential', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for invalid Google token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should issue new token pair with valid refresh token', async () => {
      const { user, refreshToken } = await createTestUser();

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for access token used as refresh token', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: accessToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for revoked refresh token (version mismatch)', async () => {
      const { user } = await createTestUser();

      // Generate refresh token with version 0
      const oldRefreshToken = generateRefreshToken(user._id, 0);

      // Increment token version (simulating revocation)
      user.tokenVersion = 1;
      await user.save();

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/revoke', () => {
    it('should increment tokenVersion and revoke tokens', async () => {
      const { user, accessToken } = await createTestUser();

      const res = await request(app)
        .post('/api/auth/revoke')
        .set(getAuthHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify tokenVersion was incremented
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.tokenVersion).toBe(1);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/auth/revoke');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid access token (200)', async () => {
      const { accessToken, user } = await createTestUser();

      const res = await request(app)
        .get('/api/auth/verify')
        .set(getAuthHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(user.email);
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'someid', type: 'access' },
        JWT_SECRET,
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .get('/api/auth/verify')
        .set(getAuthHeader(expiredToken));

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject refresh token used as access token', async () => {
      const { refreshToken } = await createTestUser();

      const res = await request(app)
        .get('/api/auth/verify')
        .set(getAuthHeader(refreshToken));

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid token type');
    });

    it('should return 401 with no token', async () => {
      const res = await request(app)
        .get('/api/auth/verify');

      expect(res.status).toBe(401);
    });
  });
});
