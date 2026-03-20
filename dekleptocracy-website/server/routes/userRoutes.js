import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updatePreferencesSchema } from '../validators/user.js';

const router = express.Router();

// Resolve current file/dir so we can build absolute paths reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.userId}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

const normalizePreferences = (preferences = {}) => {
  const toArray = (value) => Array.isArray(value)
    ? value.map(item => (typeof item === 'string' ? item.trim() : String(item || '')))
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const toString = (value) => (typeof value === 'string' ? value.trim() : '');

  const normalized = {
    conversationStyles: toArray(preferences.conversationStyles),
    topicsOfInterest: toArray(preferences.topicsOfInterest),
    householdExpenseFocus: toString(preferences.householdExpenseFocus)
  };

  // Add selectedState if provided
  if (preferences.selectedState !== undefined) {
    normalized.selectedState = toString(preferences.selectedState) || 'California';
  }

  // Add defaultTimePeriod if provided
  if (preferences.defaultTimePeriod !== undefined) {
    normalized.defaultTimePeriod = toString(preferences.defaultTimePeriod) || 'YoY';
  }

  return normalized;
};

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isGoogleUser: user.isGoogleUser,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { fullName } = req.body;
    let incomingPreferences = null;
    if (req.body.preferences) {
      try {
        incomingPreferences = typeof req.body.preferences === 'string'
          ? JSON.parse(req.body.preferences)
          : req.body.preferences;
      } catch (err) {
        console.error('Failed to parse preferences', err);
      }
    }
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update full name if provided
    if (fullName) {
      user.fullName = fullName;
    }

    if (incomingPreferences) {
      user.preferences = normalizePreferences(incomingPreferences);
    }

    // Handle profile photo upload
    if (req.file) {
      // Delete old profile photo if exists
      if (user.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Store relative path for the new photo
      const relativePath = path.join('uploads', 'profiles', req.file.filename).replace(/\\/g, '/');
      user.profilePhoto = relativePath;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isGoogleUser: user.isGoogleUser,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Update user preferences (homepage state, time period, etc.)
router.put('/preferences', verifyToken, validate(updatePreferencesSchema), async (req, res) => {
  try {
    const { selectedState, defaultTimePeriod, conversationStyles, topicsOfInterest, householdExpenseFocus } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    const updates = {};
    if (selectedState !== undefined) {
      updates['preferences.selectedState'] = selectedState;
    }
    if (defaultTimePeriod !== undefined) {
      updates['preferences.defaultTimePeriod'] = defaultTimePeriod;
    }
    if (conversationStyles !== undefined) {
      updates['preferences.conversationStyles'] = conversationStyles;
    }
    if (topicsOfInterest !== undefined) {
      updates['preferences.topicsOfInterest'] = topicsOfInterest;
    }
    if (householdExpenseFocus !== undefined) {
      updates['preferences.householdExpenseFocus'] = householdExpenseFocus;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error. Please try again later.'
    });
  }
});

export default router;

