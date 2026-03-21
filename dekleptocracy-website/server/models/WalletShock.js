import mongoose from 'mongoose';

const walletShockSchema = new mongoose.Schema(
  {
    // Identification
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'groceries',
        'fuel',
        'utilities',
        'tech',
        'housing',
        'healthcare',
        'education',
        'transportation',
      ],
      index: true,
    },

    // Display fields
    icon: {
      type: String,
      required: true,
      default: '📊',
    },
    iconBg: {
      type: String,
      required: true,
      default: '#fef3c7',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Price data
    price: {
      type: String,
      required: [true, 'Price is required'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
    },
    change: {
      type: String,
      required: [true, 'Price change is required'],
    },
    changePercent: {
      type: Number,
      required: true,
    },

    // Chart data for mini-chart visualization
    chartColor: {
      type: String,
      default: '#ef4444',
    },
    chartPath: {
      type: String,
      required: true,
    },
    chartData: [
      {
        date: Date,
        value: Number,
      },
    ],

    // Geographic scope
    state: {
      type: String,
      default: 'nationwide',
      index: true,
    },

    // Metadata
    source: {
      type: String,
      required: true,
    },
    dataDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Engagement metrics
    reactions: {
      shock: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
    },

    // Visibility
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
walletShockSchema.index({ state: 1, category: 1, status: 1, dataDate: -1 });
walletShockSchema.index({ status: 1, featured: -1, dataDate: -1 });
walletShockSchema.index({ category: 1, dataDate: -1 });

// Instance method to increment reaction
walletShockSchema.methods.addReaction = function (reactionType) {
  if (this.reactions[reactionType] !== undefined) {
    this.reactions[reactionType] += 1;
    return this.save();
  }
  throw new Error('Invalid reaction type');
};

const WalletShock = mongoose.model('WalletShock', walletShockSchema);

export default WalletShock;
