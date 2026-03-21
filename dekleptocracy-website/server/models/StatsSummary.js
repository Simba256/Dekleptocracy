import mongoose from 'mongoose';

const statsSummarySchema = new mongoose.Schema(
  {
    // Identification
    statType: {
      type: String,
      required: true,
      enum: ['lobbying', 'consumer-cost', 'contributions', 'tariff-revenue'],
      index: true,
    },

    // Geographic scope
    state: {
      type: String,
      default: 'nationwide',
      index: true,
    },

    // Main value
    value: {
      type: Number,
      required: true,
    },
    displayValue: {
      type: String,
      required: true, // e.g., "$4,679", "276K", "$9.2M"
    },

    // Change metrics
    change: {
      type: Number,
      required: true,
    },
    changeDisplay: {
      type: String,
      required: true, // e.g., "+28.42%", "+18.6%"
    },
    changeDirection: {
      type: String,
      enum: ['up', 'down', 'neutral'],
      required: true,
    },

    // Context
    subtitle: String, // e.g., "due to tariffs", "since last year"
    description: String,

    // Time series data for charts
    chartData: [
      {
        label: String, // e.g., "M", "T", "W"
        value: Number,
        date: Date,
      },
    ],

    // Period
    timePeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'weekly',
    },

    // Metadata
    dataDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: String,

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
statsSummarySchema.index({ statType: 1, state: 1, status: 1, dataDate: -1 });
statsSummarySchema.index({ state: 1, dataDate: -1 });

const StatsSummary = mongoose.model('StatsSummary', statsSummarySchema);

export default StatsSummary;
