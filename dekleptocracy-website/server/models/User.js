import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required if user signs in with Google
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  agreeToTerms: {
    type: Boolean,
    required: function() {
      return !this.googleId; // Not required for Google OAuth users
    },
    default: false
  },
  preferences: {
    conversationStyles: {
      type: [String],
      default: []
    },
    topicsOfInterest: {
      type: [String],
      default: []
    },
    householdExpenseFocus: {
      type: String,
      default: ''
    }
  },
  profilePhoto: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Skip password hashing if user is signing in with Google and has no password
  if (this.isGoogleUser && !this.password) {
    return next();
  }

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    // Hash password with cost of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;

