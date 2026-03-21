import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET, generateAccessToken, generateRefreshToken } from '../utils/jwtConfig.js';
import verifyToken from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema, refreshSchema } from '../validators/auth.js';

const router = express.Router();

const normalizePreferences = (preferences = {}) => {
  const toArray = (value) =>
    Array.isArray(value)
      ? value
          .map((item) => (typeof item === 'string' ? item.trim() : String(item || '')))
          .filter(Boolean)
          .slice(0, 12)
      : [];

  const toString = (value) => (typeof value === 'string' ? value.trim() : '');

  return {
    conversationStyles: toArray(preferences.conversationStyles),
    topicsOfInterest: toArray(preferences.topicsOfInterest),
    householdExpenseFocus: toString(preferences.householdExpenseFocus),
  };
};

const mergePreferences = (existing = {}, incoming = {}) => ({
  conversationStyles: incoming.conversationStyles?.length
    ? incoming.conversationStyles
    : existing.conversationStyles || [],
  topicsOfInterest: incoming.topicsOfInterest?.length
    ? incoming.topicsOfInterest
    : existing.topicsOfInterest || [],
  householdExpenseFocus: incoming.householdExpenseFocus || existing.householdExpenseFocus || '',
});

// Signup route
router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const { fullName, email, password, agreeToTerms, preferences } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (!agreeToTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to terms and conditions',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create new user
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      agreeToTerms,
      preferences: normalizePreferences(preferences),
    });

    await user.save();

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Validation error',
        errors,
      });
    }

    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

// Login route
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isGoogleUser: user.isGoogleUser,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

// Google OAuth route
router.post('/google', async (req, res) => {
  try {
    const { credential, preferences } = req.body;
    const normalizedPreferences = normalizePreferences(preferences);

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    // Verify Google token
    const { OAuth2Client } = await import('google-auth-library');

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server',
      });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
        error: error.message,
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name: fullName, picture } = payload;

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;
    let isLinkedAccount = false;

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.isGoogleUser = true;
        if (!user.fullName && fullName) {
          user.fullName = fullName;
        }
        if (!user.profilePhoto && picture) {
          user.profilePhoto = picture;
        }
        await user.save();
        isLinkedAccount = true;
      } else {
        // Create new user with Google account
        user = new User({
          fullName: fullName || email.split('@')[0],
          email: email.toLowerCase(),
          googleId,
          isGoogleUser: true,
          agreeToTerms: true,
          preferences: normalizedPreferences,
          password: undefined,
          profilePhoto: picture || null,
        });
        await user.save();
        isNewUser = true;
      }
    } else {
      // Update profile picture if needed
      if (!user.profilePhoto && picture) {
        user.profilePhoto = picture;
        await user.save();
      }
    }

    const hasIncomingPreferences =
      normalizedPreferences.conversationStyles.length ||
      normalizedPreferences.topicsOfInterest.length ||
      normalizedPreferences.householdExpenseFocus;

    if (hasIncomingPreferences) {
      user.preferences = mergePreferences(user.preferences, normalizedPreferences);
      await user.save();
    }

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);

    // Determine appropriate message
    let message = 'Google authentication successful';
    if (isNewUser) {
      message = 'Account created successfully with Google';
    } else if (isLinkedAccount) {
      message = 'Google account linked successfully';
    } else {
      message = 'Google login successful';
    }

    // Return success response
    res.status(200).json({
      success: true,
      message,
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto || picture || null,
        isGoogleUser: true,
        preferences: user.preferences,
      },
      isNewUser,
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message,
    });
  }
});

// Refresh token endpoint
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check token version for revocation
    if (decoded.version !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
      });
    }

    // Issue new token pair
    const newToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id, user.tokenVersion);

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
    });
  }
});

// Revoke all refresh tokens for a user
router.post('/revoke', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'All refresh tokens revoked',
    });
  } catch (error) {
    console.error('Token revocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token revocation',
    });
  }
});

// Verify token endpoint
router.get('/verify', verifyToken, async (req, res) => {
  try {
    // Check if user exists in database
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification',
    });
  }
});

export default router;
