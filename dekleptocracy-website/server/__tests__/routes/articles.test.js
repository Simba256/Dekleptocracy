import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import Article from '../../models/Article.js';

const sampleArticle = {
  title: 'Gas Prices Surge',
  slug: 'gas-prices-surge',
  contentType: 'article',
  category: 'fuel',
  heroImage: 'https://example.com/image.jpg',
  description: 'Gas prices are rising.',
  mainText: 'A detailed look at why gas prices are increasing nationwide.',
  price: '$4.50',
  priceUnit: 'per gallon',
  priceChange: '+12%',
  impactScore: 75,
  impactLevel: 'high',
  status: 'published',
  featured: false,
  views: 0,
};

async function seedArticle(overrides = {}) {
  const article = new Article({ ...sampleArticle, ...overrides });
  await article.save();
  return article;
}

describe('Article Routes', () => {
  describe('GET /api/articles', () => {
    it('should return paginated published articles', async () => {
      await seedArticle();
      await seedArticle({ title: 'Second', slug: 'second-article' });

      const res = await request(app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(2);
      expect(res.body.totalArticles).toBe(2);
      expect(res.body.currentPage).toBe(1);
    });

    it('should filter by category', async () => {
      await seedArticle({ category: 'fuel' });
      await seedArticle({ title: 'Tech News', slug: 'tech-news', category: 'tech' });

      const res = await request(app).get('/api/articles?category=fuel');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articles[0].category).toBe('fuel');
    });

    it('should filter by status', async () => {
      await seedArticle({ status: 'published' });
      await seedArticle({ title: 'Draft', slug: 'draft', status: 'draft' });

      const res = await request(app).get('/api/articles?status=draft');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
    });
  });

  describe('GET /api/articles/latest', () => {
    it('should return latest published articles', async () => {
      await seedArticle();
      await seedArticle({ title: 'Newer', slug: 'newer', publishedAt: new Date('2030-01-01') });

      const res = await request(app).get('/api/articles/latest?limit=1');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articles[0].slug).toBe('newer');
    });
  });

  describe('GET /api/articles/featured', () => {
    it('should return only featured published articles', async () => {
      await seedArticle({ featured: true, slug: 'featured-one' });
      await seedArticle({ featured: false, slug: 'not-featured' });

      const res = await request(app).get('/api/articles/featured');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articles[0].slug).toBe('featured-one');
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should return article by slug and increment views', async () => {
      await seedArticle({ slug: 'my-article', views: 5 });

      const res = await request(app).get('/api/articles/my-article');

      expect(res.status).toBe(200);
      expect(res.body.article.slug).toBe('my-article');
      expect(res.body.article.views).toBe(6);
    });

    it('should return 404 for nonexistent slug', async () => {
      const res = await request(app).get('/api/articles/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/articles/category/:category', () => {
    it('should return articles for a specific category', async () => {
      await seedArticle({ category: 'groceries', slug: 'grocery-article' });
      await seedArticle({ category: 'fuel', slug: 'fuel-article' });

      const res = await request(app).get('/api/articles/category/groceries');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articles[0].category).toBe('groceries');
    });
  });

  describe('POST /api/articles', () => {
    it('should create a new article with auto-generated slug', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({
          title: 'New Article Title',
          contentType: 'article',
          category: 'tech',
          heroImage: 'https://example.com/img.jpg',
          description: 'Desc',
          mainText: 'Main content here.',
          price: '$100',
          priceUnit: 'per unit',
          priceChange: '+5%',
          impactScore: 50,
          impactLevel: 'medium',
        });

      expect(res.status).toBe(201);
      expect(res.body.article.slug).toBe('new-article-title');
    });
  });

  describe('PUT /api/articles/:id', () => {
    it('should update an article', async () => {
      const article = await seedArticle();

      const res = await request(app)
        .put(`/api/articles/${article._id}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.article.title).toBe('Updated Title');
    });

    it('should return 404 for nonexistent article', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .put(`/api/articles/${fakeId}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:id', () => {
    it('should delete an article', async () => {
      const article = await seedArticle();

      const res = await request(app).delete(`/api/articles/${article._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should return 404 for nonexistent article', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app).delete(`/api/articles/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/articles/stats/overview', () => {
    it('should return correct aggregated stats', async () => {
      await seedArticle({ category: 'fuel', views: 10 });
      await seedArticle({ title: 'Second', slug: 'second', category: 'tech', views: 20 });

      const res = await request(app).get('/api/articles/stats/overview');

      expect(res.status).toBe(200);
      expect(res.body.totalArticles).toBe(2);
      expect(res.body.totalViews).toBe(30);
      expect(res.body.categoryCounts).toHaveLength(2);
    });
  });

  describe('POST /api/articles/cleanup-duplicates', () => {
    it('should remove duplicate articles by title', async () => {
      await seedArticle({ title: 'Duplicate', slug: 'dup-1' });
      await seedArticle({ title: 'Duplicate', slug: 'dup-2' });
      await seedArticle({ title: 'Unique', slug: 'unique' });

      const res = await request(app).post('/api/articles/cleanup-duplicates');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.duplicatesRemoved).toBe(1);
    });
  });
});
