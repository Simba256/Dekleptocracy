import mongoose from 'mongoose';

const stateComparisonSchema = new mongoose.Schema(
  {
    // Category of comparison
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'groceries',
        'fuel',
        'utilities',
        'housing',
        'healthcare',
        'education',
        'transportation',
        'books',
      ],
      index: true,
    },

    // Display label for the category
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
      maxlength: [100, 'Label cannot exceed 100 characters'],
    },

    // State this comparison is for
    state: {
      type: String,
      required: [true, 'State is required'],
      index: true,
    },

    // State value (e.g., "$412" or "4.8%")
    stateValue: {
      type: String,
      required: [true, 'State value is required'],
    },

    // National average value
    nationalValue: {
      type: String,
      required: [true, 'National value is required'],
    },

    // Numeric values for calculations
    stateNumericValue: {
      type: Number,
      required: true,
    },

    nationalNumericValue: {
      type: Number,
      required: true,
    },

    // Percentage difference (positive = higher than national)
    percentDifference: {
      type: Number,
      required: true,
    },

    // Display format for percentage
    percentDisplay: {
      type: String,
      required: true,
    },

    // Unit type (currency, percentage, etc.)
    unitType: {
      type: String,
      enum: ['currency', 'percentage', 'rate', 'index'],
      default: 'currency',
    },

    // Time period this comparison covers
    timePeriod: {
      type: String,
      enum: ['current', 'monthly', 'quarterly', 'yearly'],
      default: 'current',
    },

    // Data source
    source: {
      type: String,
      required: true,
    },

    // Date of the data
    dataDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Display order
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
stateComparisonSchema.index({ state: 1, category: 1, status: 1 });
stateComparisonSchema.index({ state: 1, status: 1, displayOrder: 1 });

const StateComparison = mongoose.model('StateComparison', stateComparisonSchema);

export default StateComparison;
