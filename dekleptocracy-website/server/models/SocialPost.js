import mongoose from 'mongoose';

const socialPostSchema = new mongoose.Schema(
  {
    // Author information
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },

    // Platform the post is from
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: ['X Twitter', 'Thread', 'Facebook', 'Instagram', 'TikTok', 'Reddit', 'Bluesky'],
      index: true,
    },

    // Time since posted (for display)
    timeAgo: {
      type: String,
      required: true,
    },

    // Actual post timestamp
    postedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Verified account
    verified: {
      type: Boolean,
      default: false,
    },

    // Post content
    text: {
      type: String,
      required: [true, 'Post text is required'],
      trim: true,
      maxlength: [500, 'Post text cannot exceed 500 characters'],
    },

    // Optional image URL
    image: {
      type: String,
      trim: true,
    },

    // Avatar URL
    avatarUrl: {
      type: String,
      trim: true,
    },

    // Engagement metrics
    engagement: {
      comments: { type: Number, default: 0 },
      retweets: { type: String, default: '0' }, // String to support "8.7k" format
      likes: { type: String, default: '0' },
    },

    // Related topics/categories
    topics: [
      {
        type: String,
        enum: [
          'gas',
          'groceries',
          'utilities',
          'housing',
          'healthcare',
          'tariffs',
          'inflation',
          'economy',
        ],
      },
    ],

    // Geographic relevance
    state: {
      type: String,
      default: 'nationwide',
    },

    // Moderation status
    moderation: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'approved',
      },
      reviewedAt: Date,
      reviewedBy: String,
      reason: String,
    },

    // Featured post
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Display order for featured posts
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
socialPostSchema.index({ status: 1, 'moderation.status': 1, postedAt: -1 });
socialPostSchema.index({ featured: 1, status: 1, displayOrder: 1 });
socialPostSchema.index({ state: 1, status: 1, postedAt: -1 });
socialPostSchema.index({ topics: 1, status: 1 });

const SocialPost = mongoose.model('SocialPost', socialPostSchema);

export default SocialPost;
