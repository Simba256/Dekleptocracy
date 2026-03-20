import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import Article from '../../models/Article.js';

describe('SEO Routes', () => {
  describe('GET /sitemap.xml', () => {
    it('should return valid XML sitemap', async () => {
      // Seed an article so it appears in the sitemap
      await new Article({
        title: 'Test Article',
        slug: 'test-article',
        contentType: 'article',
        category: 'fuel',
        heroImage: 'https://example.com/img.jpg',
        description: 'Test',
        mainText: 'Main',
        price: '$1',
        priceUnit: 'unit',
        priceChange: '+1%',
        impactScore: 50,
        impactLevel: 'medium',
        status: 'published',
      }).save();

      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('xml');
      expect(res.text).toContain('<?xml version="1.0"');
      expect(res.text).toContain('<urlset');
      expect(res.text).toContain('test-article');
    });
  });

  describe('GET /robots.txt', () => {
    it('should return text/plain robots.txt', async () => {
      const res = await request(app).get('/robots.txt');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('User-agent: *');
      expect(res.text).toContain('Sitemap:');
    });
  });

  describe('GET /api/seo/health', () => {
    it('should return SEO health status with counts', async () => {
      await new Article({
        title: 'Published',
        slug: 'published-article',
        contentType: 'article',
        category: 'fuel',
        heroImage: 'https://example.com/img.jpg',
        description: 'Test',
        mainText: 'Main',
        price: '$1',
        priceUnit: 'unit',
        priceChange: '+1%',
        impactScore: 50,
        impactLevel: 'medium',
        status: 'published',
      }).save();

      const res = await request(app).get('/api/seo/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.seo.articlePages).toBe(1);
      expect(res.body.seo.staticPages).toBeGreaterThan(0);
      expect(res.body.seo.statePages).toBeGreaterThan(0);
      expect(res.body.seo.totalUrls).toBeGreaterThan(0);
    });
  });
});
