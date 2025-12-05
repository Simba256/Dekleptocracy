import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Resolve current file/dir so we can build absolute paths reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');

// Token verification middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
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

export default router;

