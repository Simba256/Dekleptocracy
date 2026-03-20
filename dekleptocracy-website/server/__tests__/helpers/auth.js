import User from '../../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwtConfig.js';

export async function createTestUser(overrides = {}) {
  const defaults = {
    fullName: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    agreeToTerms: true,
    preferences: {
      conversationStyles: [],
      topicsOfInterest: [],
      householdExpenseFocus: '',
      selectedState: 'California',
      defaultTimePeriod: 'YoY',
    },
  };

  const userData = { ...defaults, ...overrides };
  const user = new User(userData);
  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id, user.tokenVersion);

  return { user, accessToken, refreshToken };
}

export function getAuthHeader(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}
