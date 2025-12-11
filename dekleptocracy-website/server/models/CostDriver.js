import mongoose from 'mongoose';

const costDriverSchema = new mongoose.Schema({
  // Identification
  label: {
    type: String,
    required: [true, 'Label is required'],
    trim: true
  },

  // Data
  percentage: {
    type: Number,
    required: [true, 'Percentage is required'],
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },

  // Display
  color: {
    type: String,
    required: true,
    match: [/^#[0-9A-F]{6}$/i, 'Color must be valid hex code']
  },
  type: {
    type: String,
    required: true,
    enum: ['direct', 'indirect']
  },

  // Geographic and temporal scope
  state: {
    type: String,
    default: 'nationwide',
    index: true
  },
  timePeriod: {
    type: String,
    required: true,
    enum: ['YoY', '3 months', '30 days'],
    default: 'YoY'
  },

  // Category context
  category: {
    type: String,
    enum: ['groceries', 'fuel', 'utilities', 'tech', 'housing', 'healthcare', 'education', 'transportation', 'all'],
    default: 'all'
  },

  // Metadata
  dataDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  source: String,

  // Display order
  displayOrder: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }

}, { timestamps: true });

// Compound indexes for efficient queries
costDriverSchema.index({ state: 1, timePeriod: 1, category: 1, status: 1 });
costDriverSchema.index({ status: 1, displayOrder: 1 });

const CostDriver = mongoose.model('CostDriver', costDriverSchema);

export default CostDriver;
