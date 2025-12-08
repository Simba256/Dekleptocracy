import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: '7d'
  });
};

const normalizePreferences = (preferences = {}) => {
  const toArray = (value) => Array.isArray(value)
    ? value.map(item => (typeof item === 'string' ? item.trim() : String(item || '')))
        .filter(Boolean)
        .slice(0, 12)
    : [];

  const toString = (value) => (typeof value === 'string' ? value.trim() : '');

  return {
    conversationStyles: toArray(preferences.conversationStyles),
    topicsOfInterest: toArray(preferences.topicsOfInterest),
    householdExpenseFocus: toString(preferences.householdExpenseFocus)
  };
};

const mergePreferences = (existing = {}, incoming = {}) => ({
  conversationStyles: incoming.conversationStyles?.length
    ? incoming.conversationStyles
    : existing.conversationStyles || [],
  topicsOfInterest: incoming.topicsOfInterest?.length
    ? incoming.topicsOfInterest
    : existing.topicsOfInterest || [],
  householdExpenseFocus: incoming.householdExpenseFocus || existing.householdExpenseFocus || ''
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, agreeToTerms, preferences } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (!agreeToTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to terms and conditions'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      agreeToTerms,
      preferences: normalizePreferences(preferences)
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Validation error',
        errors
      });
    }

    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Login route (for future use)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isGoogleUser: user.isGoogleUser,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Google OAuth route
router.post('/google', async (req, res) => {
  console.log('🔐 Google OAuth request received');
  console.log(`📍 Origin: ${req.get('origin') || 'unknown'}`);
  console.log(`🌐 User-Agent: ${req.get('user-agent')?.substring(0, 50)}...`);

  try {
    const { credential, preferences } = req.body; // Google ID token
    const normalizedPreferences = normalizePreferences(preferences);

    if (!credential) {
      console.log('❌ No credential provided in request body');
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    console.log('✅ Credential received:', credential.substring(0, 30) + '...');

    // Verify Google token
    const { OAuth2Client } = await import('google-auth-library');

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('❌ GOOGLE_CLIENT_ID not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server'
      });
    }

    console.log('✅ GOOGLE_CLIENT_ID configured:', process.env.GOOGLE_CLIENT_ID.substring(0, 30) + '...');

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      console.log('🔍 Verifying Google token...');
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      console.log('✅ Google token verified successfully');
    } catch (error) {
      console.error('❌ Google token verification error:', error.message);
      console.error('Error details:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
        error: error.message
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name: fullName, picture } = payload;

    console.log('👤 Google user info:', { googleId: googleId.substring(0, 20) + '...', email, fullName });

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;
    let isLinkedAccount = false;

    if (!user) {
      console.log('🔍 User not found by Google ID, checking by email...');
      // Check if user exists with this email
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        console.log('🔗 Linking Google account to existing user');
        // Link Google account to existing user (login with Google for existing email account)
        user.googleId = googleId;
        user.isGoogleUser = true;
        if (!user.fullName && fullName) {
          user.fullName = fullName;
        }
        // Save Google profile picture if user doesn't have one
        if (!user.profilePhoto && picture) {
          user.profilePhoto = picture;
        }
        await user.save();
        isLinkedAccount = true;
        console.log('✅ Google account linked successfully');
      } else {
        console.log('➕ Creating new user with Google account');
        // Create new user with Google account (signup with Google)
        user = new User({
          fullName: fullName || email.split('@')[0],
          email: email.toLowerCase(),
          googleId,
          isGoogleUser: true,
          agreeToTerms: true, // Assume user agrees when using Google OAuth
          preferences: normalizedPreferences,
          password: undefined, // No password for Google users
          profilePhoto: picture || null // Save Google profile picture
        });
        await user.save();
        isNewUser = true;
        console.log('✅ New user created successfully');
      }
    } else {
      console.log('✅ Existing Google user found');
      // Update profile picture if it's a Google URL and user doesn't have a custom one
      if (!user.profilePhoto && picture) {
        user.profilePhoto = picture;
        await user.save();
      }
    }

    const hasIncomingPreferences = normalizedPreferences.conversationStyles.length ||
      normalizedPreferences.topicsOfInterest.length ||
      normalizedPreferences.householdExpenseFocus;

    if (hasIncomingPreferences) {
      user.preferences = mergePreferences(user.preferences, normalizedPreferences);
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('🎫 JWT token generated');

    // Determine appropriate message
    let message = 'Google authentication successful';
    if (isNewUser) {
      message = 'Account created successfully with Google';
    } else if (isLinkedAccount) {
      message = 'Google account linked successfully';
    } else {
      message = 'Google login successful';
    }

    console.log(`✅ ${message} for user:`, user.email);

    // Return success response
    res.status(200).json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto || picture || null,
        isGoogleUser: true,
        preferences: user.preferences
      },
      isNewUser
    });
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message
    });
  }
});

// Token verification middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Verify token endpoint
router.get('/verify', verifyToken, async (req, res) => {
  try {
    // Check if user exists in database
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

export default router;

