import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUser, getAuthHeader } from '../helpers/auth.js';

describe('User Routes', () => {
  describe('GET /api/user/profile', () => {
    it('should return user profile without password', async () => {
      const { accessToken, user } = await createTestUser();

      const res = await request(app)
        .get('/api/user/profile')
        .set(getAuthHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.fullName).toBe(user.fullName);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/user/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user name', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .put('/api/user/profile')
        .set(getAuthHeader(accessToken))
        .send({ fullName: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.fullName).toBe('Updated Name');
    });

    it('should update preferences', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .put('/api/user/profile')
        .set(getAuthHeader(accessToken))
        .send({
          preferences: JSON.stringify({
            selectedState: 'Texas',
            defaultTimePeriod: '30 days',
            conversationStyles: ['casual'],
            topicsOfInterest: ['fuel'],
            householdExpenseFocus: 'groceries',
          }),
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .send({ fullName: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user/preferences', () => {
    it('should partially update preferences', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .put('/api/user/preferences')
        .set(getAuthHeader(accessToken))
        .send({ selectedState: 'New York' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preferences.selectedState).toBe('New York');
    });

    it('should update defaultTimePeriod', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .put('/api/user/preferences')
        .set(getAuthHeader(accessToken))
        .send({ defaultTimePeriod: '3 months' });

      expect(res.status).toBe(200);
      expect(res.body.preferences.defaultTimePeriod).toBe('3 months');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .put('/api/user/preferences')
        .send({ selectedState: 'Texas' });

      expect(res.status).toBe(401);
    });
  });
});
