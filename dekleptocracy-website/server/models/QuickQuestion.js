import mongoose from 'mongoose';

const quickQuestionSchema = new mongoose.Schema({
  // Question text
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [200, 'Question text cannot exceed 200 characters']
  },

  // Question with placeholder for personalization
  textTemplate: {
    type: String,
    trim: true,
    // e.g., "How does the new tax hit my grocery bill in {city}?"
  },

  // Category of the question
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['taxes', 'prices', 'comparison', 'policy', 'bills', 'inflation', 'general'],
    index: true
  },

  // Icon for display (SVG path or emoji)
  icon: {
    type: String,
    required: true
  },

  // Icon type
  iconType: {
    type: String,
    enum: ['svg', 'emoji'],
    default: 'svg'
  },

  // SVG path data for the icon
  iconPath: {
    type: String
  },

  // Related topics
  topics: [{
    type: String,
    enum: ['groceries', 'gas', 'utilities', 'housing', 'healthcare', 'tariffs', 'taxes', 'inflation']
  }],

  // Personalization options
  personalization: {
    useLocation: { type: Boolean, default: true },
    useState: { type: Boolean, default: true },
    useCity: { type: Boolean, default: false }
  },

  // Target audience
  targetAudience: {
    type: String,
    enum: ['all', 'homeowners', 'renters', 'parents', 'seniors', 'students'],
    default: 'all'
  },

  // Geographic relevance
  states: [{
    type: String
  }], // Empty array means nationwide

  // Display order
  displayOrder: {
    type: Number,
    default: 0
  },

  // Featured on homepage
  featured: {
    type: Boolean,
    default: false,
    index: true
  },

  // Click count for popularity tracking
  clickCount: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }

}, { timestamps: true });

// Compound indexes
quickQuestionSchema.index({ featured: 1, status: 1, displayOrder: 1 });
quickQuestionSchema.index({ category: 1, status: 1 });
quickQuestionSchema.index({ clickCount: -1 });

// Method to personalize question
quickQuestionSchema.methods.personalize = function(options = {}) {
  let text = this.textTemplate || this.text;

  if (options.city && this.personalization.useCity) {
    text = text.replace(/{city}/g, options.city);
  }
  if (options.state && this.personalization.useState) {
    text = text.replace(/{state}/g, options.state);
  }
  if (options.location && this.personalization.useLocation) {
    text = text.replace(/{location}/g, options.location);
  }

  // Clean up any remaining placeholders
  text = text.replace(/{city}/g, 'my city');
  text = text.replace(/{state}/g, 'my state');
  text = text.replace(/{location}/g, 'my area');

  return text;
};

// Method to increment click count
quickQuestionSchema.methods.incrementClickCount = function() {
  this.clickCount += 1;
  return this.save();
};

const QuickQuestion = mongoose.model('QuickQuestion', quickQuestionSchema);

export default QuickQuestion;
