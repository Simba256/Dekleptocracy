import express from 'express';
import Article from '../models/Article.js';

const router = express.Router();

// Get all articles with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      status = 'published', 
      featured,
      page = 1, 
      limit = 10,
      sort = '-publishedAt'
    } = req.query;

    const query = { status };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    const articles = await Article.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Article.countDocuments(query);

    res.json({
      articles,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalArticles: count
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// Get latest articles
router.get('/latest', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const articles = await Article.find({ status: 'published' })
      .sort('-publishedAt')
      .limit(parseInt(limit))
      .exec();

    res.json({ articles });
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    res.status(500).json({ message: 'Error fetching latest articles', error: error.message });
  }
});

// Get featured articles
router.get('/featured', async (req, res) => {
  try {
    const articles = await Article.find({ 
      status: 'published',
      featured: true 
    })
      .sort('-publishedAt')
      .limit(5)
      .exec();

    res.json({ articles });
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    res.status(500).json({ message: 'Error fetching featured articles', error: error.message });
  }
});

// Get single article by slug
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ 
      slug: req.params.slug,
      status: 'published'
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment views
    await article.incrementViews();

    res.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
});

// Get articles by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const articles = await Article.find({ 
      category,
      status: 'published'
    })
      .sort('-publishedAt')
      .limit(parseInt(limit))
      .exec();

    res.json({ articles });
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// Create new article (for LLM generation or manual)
router.post('/', async (req, res) => {
  try {
    const articleData = req.body;

    // Generate slug from title if not provided
    if (!articleData.slug) {
      articleData.slug = articleData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const article = new Article(articleData);
    await article.save();

    res.status(201).json({ 
      message: 'Article created successfully',
      article 
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ message: 'Error creating article', error: error.message });
  }
});

// Update article
router.put('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ 
      message: 'Article updated successfully',
      article 
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
});

// Delete article
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
});

// Get article statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments({ status: 'published' });
    const categoryCounts = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const totalViews = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      totalArticles,
      categoryCounts,
      totalViews: totalViews[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

export default router;
