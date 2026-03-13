import { memo } from 'react';
import PropTypes from 'prop-types';
import './SocialPostCard.css';

/**
 * Social Post Card Component - Memoized to prevent unnecessary re-renders
 */
export const SocialPostCard = memo(function SocialPostCard({ post, avatarIndex = 10 }) {
  return (
    <div className="social-post-card">
      <div className="social-post-card__header">
        <div className="social-post-card__user-info">
          <div className="social-post-card__avatar">
            <img
              src={post.avatarUrl || `https://i.pravatar.cc/150?img=${avatarIndex}`}
              alt={post.username}
              loading="lazy"
              decoding="async"
              width="40"
              height="40"
            />
          </div>
          <div className="social-post-card__meta">
            <div className="social-post-card__username">
              {post.username}
              {post.verified && (
                <svg className="social-post-card__verified" width="16" height="16" viewBox="0 0 24 24" fill="#1d9bf0">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              )}
            </div>
            <div className="social-post-card__platform">
              <span className="social-post-card__platform-icon">X</span>
              {post.platform} . {post.timeAgo}
            </div>
          </div>
        </div>
      </div>

      <p className="social-post-card__text">{post.text}</p>

      {post.image && (
        <div className="social-post-card__image-container">
          <img
            src={post.image}
            alt={post.imageAlt || `Image shared by ${post.username}`}
            className="social-post-card__image"
            loading="lazy"
            decoding="async"
            width="600"
            height="400"
          />
        </div>
      )}

      <div className="social-post-card__footer">
        <div className="social-post-card__stats">
          <div className="social-post-card__stat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>{post.engagement?.comments || 0}</span>
          </div>
          <div className="social-post-card__stat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>{post.engagement?.retweets || 0}</span>
          </div>
          <div className="social-post-card__stat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{post.engagement?.likes || 0}</span>
          </div>
        </div>
        <button className="social-post-card__share-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
});

SocialPostCard.propTypes = {
  post: PropTypes.shape({
    username: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    verified: PropTypes.bool,
    platform: PropTypes.string,
    timeAgo: PropTypes.string,
    text: PropTypes.string.isRequired,
    image: PropTypes.string,
    imageAlt: PropTypes.string,
    engagement: PropTypes.shape({
      comments: PropTypes.number,
      retweets: PropTypes.number,
      likes: PropTypes.number,
    }),
  }).isRequired,
  avatarIndex: PropTypes.number,
};

SocialPostCard.defaultProps = {
  avatarIndex: 10,
};

export default SocialPostCard;
