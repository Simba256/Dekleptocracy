import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    enum: ['groceries', 'fuel', 'utilities', 'tech', 'housing', 'healthcare', 'education', 'transportation']
  },
  icon: {
    type: String,
    default: '📊'
  },
  iconBg: {
    type: String,
    default: '#fef3c7'
  },
  heroImage: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  mainText: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  priceUnit: {
    type: String,
    required: true
  },
  priceChange: {
    type: String,
    required: true
  },
  impactScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  impactLevel: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  location: {
    type: String,
    default: 'Nationwide'
  },
  whyItHappened: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  chartData: [{
    month: String,
    value: Number
  }],
  sources: [{
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publishedDate: {
      type: Date
    }
  }],
  tags: [{
    type: String
  }],
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  generatedBy: {
    type: String,
    enum: ['llm', 'manual'],
    default: 'llm'
  },
  llmModel: {
    type: String,
    default: null
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
articleSchema.index({ category: 1, publishedAt: -1 });
articleSchema.index({ slug: 1 });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ featured: 1, publishedAt: -1 });

// Virtual for article URL
articleSchema.virtual('url').get(function() {
  return `/insights?category=${this.category}&slug=${this.slug}`;
});

// Method to increment views
articleSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

const Article = mongoose.model('Article', articleSchema);

export default Article;
