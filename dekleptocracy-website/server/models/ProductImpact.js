import mongoose from 'mongoose';

const productImpactSchema = new mongoose.Schema(
  {
    // Product name
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      index: true,
    },

    // Product category
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'housing',
        'groceries',
        'fuel',
        'utilities',
        'tech',
        'healthcare',
        'education',
        'transportation',
        'apparel',
      ],
      index: true,
    },

    // Current price
    currentPrice: {
      type: Number,
      required: true,
    },

    currentPriceDisplay: {
      type: String,
      required: true,
    },

    // Starting price (at baseline date)
    startingPrice: {
      type: Number,
      required: true,
    },

    startingPriceDisplay: {
      type: String,
      required: true,
    },

    // Price change
    priceChange: {
      amount: { type: Number, required: true },
      amountDisplay: { type: String, required: true },
      percent: { type: Number, required: true },
      percentDisplay: { type: String, required: true },
    },

    // Dates
    startingDate: {
      type: Date,
      required: true,
    },

    currentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Price history for charts
    priceHistory: [
      {
        date: { type: Date, required: true },
        price: { type: Number, required: true },
        priceDisplay: { type: String, required: true },
      },
    ],

    // Cost drivers/factors
    drivers: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: [
            'tariff',
            'supply-chain',
            'labor',
            'fuel',
            'currency',
            'weather',
            'policy',
            'lobbying',
          ],
        },
        impact: { type: String }, // e.g., "25%", "+$45"
        description: { type: String },
        sources: [{ type: String }],
      },
    ],

    // Lobbying data related to this product
    lobbyingData: {
      totalSpent: { type: Number },
      totalSpentDisplay: { type: String },
      description: { type: String },
    },

    // Geographic scope
    state: {
      type: String,
      default: 'nationwide',
      index: true,
    },

    // Data source
    source: {
      type: String,
      required: true,
    },

    // Search keywords for finding this product
    keywords: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    // Trending status
    trending: {
      type: Boolean,
      default: false,
      index: true,
    },

    trendingScore: {
      type: Number,
      default: 0,
    },

    // Search count (for popularity)
    searchCount: {
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

// Compound indexes
productImpactSchema.index({ name: 'text', keywords: 'text' });
productImpactSchema.index({ state: 1, category: 1, status: 1 });
productImpactSchema.index({ trending: 1, trendingScore: -1 });
productImpactSchema.index({ searchCount: -1 });

// Method to increment search count
productImpactSchema.methods.incrementSearchCount = function () {
  this.searchCount += 1;
  return this.save();
};

const ProductImpact = mongoose.model('ProductImpact', productImpactSchema);

export default ProductImpact;
