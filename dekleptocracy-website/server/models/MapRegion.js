import mongoose from 'mongoose';

const mapRegionSchema = new mongoose.Schema({
  // State or region name
  name: {
    type: String,
    required: [true, 'Region name is required'],
    trim: true,
    unique: true,
    index: true
  },

  // State abbreviation
  abbreviation: {
    type: String,
    required: [true, 'State abbreviation is required'],
    uppercase: true,
    trim: true,
    maxlength: 2
  },

  // SVG coordinates for heat map overlay
  coordinates: {
    cx: { type: Number, required: true }, // Center X
    cy: { type: Number, required: true }, // Center Y
    rx: { type: Number, required: true }, // Radius X (for ellipse)
    ry: { type: Number, required: true }, // Radius Y (for ellipse)
    rotation: { type: Number, default: 0 } // Optional rotation
  },

  // Intensity level for heat map (0-100)
  intensity: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  },

  // Intensity category
  intensityCategory: {
    type: String,
    enum: ['low', 'medium-low', 'medium', 'medium-high', 'high'],
    default: 'medium'
  },

  // Color based on intensity (hex color)
  color: {
    type: String,
    required: true,
    default: '#f97316'
  },

  // Opacity for heat blob
  opacity: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.6
  },

  // Active tooltip data
  tooltip: {
    enabled: { type: Boolean, default: false },
    icon: { type: String },
    text: { type: String },
    position: {
      x: { type: Number },
      y: { type: Number }
    }
  },

  // Top shocks in this region
  topShocks: [{
    item: { type: String, required: true },
    location: { type: String },
    icon: { type: String },
    bgColor: { type: String },
    changePercent: { type: Number }
  }],

  // Overall price change for the region
  overallChange: {
    percent: { type: Number },
    percentDisplay: { type: String },
    direction: { type: String, enum: ['up', 'down', 'neutral'] }
  },

  // Data date
  dataDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }

}, { timestamps: true });

// Indexes
mapRegionSchema.index({ status: 1, intensity: -1 });
mapRegionSchema.index({ abbreviation: 1 });

// Static method to get intensity color
mapRegionSchema.statics.getIntensityColor = function(intensity) {
  if (intensity >= 80) return '#b91c1c'; // High - Dark Red
  if (intensity >= 60) return '#dc2626'; // Medium-High - Red
  if (intensity >= 40) return '#ea580c'; // Medium - Orange
  if (intensity >= 20) return '#f97316'; // Medium-Low - Light Orange
  return '#fbbf24'; // Low - Yellow
};

// Static method to get intensity category
mapRegionSchema.statics.getIntensityCategory = function(intensity) {
  if (intensity >= 80) return 'high';
  if (intensity >= 60) return 'medium-high';
  if (intensity >= 40) return 'medium';
  if (intensity >= 20) return 'medium-low';
  return 'low';
};

const MapRegion = mongoose.model('MapRegion', mapRegionSchema);

export default MapRegion;
