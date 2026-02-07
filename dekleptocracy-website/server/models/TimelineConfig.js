import mongoose from 'mongoose';

const timelineConfigSchema = new mongoose.Schema({
  // Configuration name (for different timeline types)
  name: {
    type: String,
    required: [true, 'Configuration name is required'],
    trim: true,
    unique: true,
    index: true
  },

  // Description of this timeline
  description: {
    type: String,
    trim: true
  },

  // Timeline milestones
  milestones: [{
    // Position on slider (0-100)
    position: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    // Date for this milestone
    date: {
      type: Date,
      required: true
    },

    // Display date string
    dateDisplay: {
      type: String,
      required: true
    },

    // Label for the milestone
    label: {
      type: String,
      required: true,
      trim: true
    },

    // Optional description
    description: {
      type: String,
      trim: true
    },

    // Whether this is the default/active milestone
    isDefault: {
      type: Boolean,
      default: false
    },

    // Whether this milestone is highlighted
    highlighted: {
      type: Boolean,
      default: false
    },

    // Associated event or policy
    event: {
      name: { type: String },
      type: { type: String, enum: ['policy', 'election', 'economic', 'tariff', 'other'] },
      impact: { type: String }
    }
  }],

  // Slider configuration
  slider: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    defaultValue: { type: Number, default: 50 }
  },

  // Date range
  dateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },

  // Suggested products/searches for this timeline
  suggestedSearches: [{
    term: { type: String, required: true },
    category: { type: String }
  }],

  // Display settings
  display: {
    showLabels: { type: Boolean, default: true },
    showDates: { type: Boolean, default: true },
    labelPosition: { type: String, enum: ['above', 'below'], default: 'above' },
    colorScheme: {
      track: { type: String, default: '#e5e7eb' },
      progress: { type: String, default: '#FF6B5A' },
      thumb: { type: String, default: '#FF6B5A' }
    }
  },

  // Whether this is the active configuration
  active: {
    type: Boolean,
    default: false,
    index: true
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }

}, { timestamps: true });

// Ensure only one active configuration
timelineConfigSchema.pre('save', async function(next) {
  if (this.active) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { active: false }
    );
  }
  next();
});

// Static method to get active configuration
timelineConfigSchema.statics.getActive = function() {
  return this.findOne({ active: true, status: 'published' });
};

// Method to get milestone at position
timelineConfigSchema.methods.getMilestoneAtPosition = function(position) {
  // Find the closest milestone to the given position
  let closest = this.milestones[0];
  let minDistance = Math.abs(position - closest.position);

  for (const milestone of this.milestones) {
    const distance = Math.abs(position - milestone.position);
    if (distance < minDistance) {
      minDistance = distance;
      closest = milestone;
    }
  }

  return closest;
};

// Method to get date for position
timelineConfigSchema.methods.getDateForPosition = function(position) {
  const start = this.dateRange.start.getTime();
  const end = this.dateRange.end.getTime();
  const range = end - start;
  const positionRatio = position / 100;

  return new Date(start + (range * positionRatio));
};

const TimelineConfig = mongoose.model('TimelineConfig', timelineConfigSchema);

export default TimelineConfig;
