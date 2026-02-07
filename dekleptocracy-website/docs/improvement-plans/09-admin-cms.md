# Phase 9: Admin & Content Management System

## Overview

This phase focuses on building an administrative interface for content management, allowing non-technical users to update homepage content, manage social posts, configure features, and monitor system health.

## Goals

1. Create admin dashboard for content management
2. Build CRUD interfaces for all data types
3. Implement role-based access control
4. Add content scheduling and versioning
5. Create moderation workflows
6. Build system monitoring dashboard

---

## Admin Dashboard Architecture

### Pages Structure

```
/admin
├── /dashboard          # Overview & key metrics
├── /content
│   ├── /wallet-shocks  # Manage price shock cards
│   ├── /cost-drivers   # Manage cost driver data
│   ├── /stats          # Manage statistics
│   ├── /social-posts   # Moderate social content
│   └── /quick-questions # Manage suggested questions
├── /configuration
│   ├── /featured-states # Configure featured states
│   ├── /timeline       # Timeline milestones
│   ├── /map            # Map region settings
│   └── /ab-tests       # A/B test configuration
├── /users
│   ├── /list           # User management
│   └── /roles          # Role management
├── /reports
│   ├── /analytics      # Analytics dashboard
│   ├── /feedback       # User feedback
│   └── /errors         # Error logs
└── /settings
    ├── /general        # Site settings
    ├── /integrations   # API keys, webhooks
    └── /cache          # Cache management
```

---

## Implementation

### 1. Admin Layout

```jsx
// src/admin/layouts/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    {
      label: 'Content',
      icon: '📝',
      children: [
        { path: '/admin/content/wallet-shocks', label: 'Wallet Shocks' },
        { path: '/admin/content/cost-drivers', label: 'Cost Drivers' },
        { path: '/admin/content/stats', label: 'Statistics' },
        { path: '/admin/content/social-posts', label: 'Social Posts' },
        { path: '/admin/content/quick-questions', label: 'Quick Questions' }
      ]
    },
    {
      label: 'Configuration',
      icon: '⚙️',
      children: [
        { path: '/admin/config/featured-states', label: 'Featured States' },
        { path: '/admin/config/timeline', label: 'Timeline' },
        { path: '/admin/config/map', label: 'Map Regions' },
        { path: '/admin/config/ab-tests', label: 'A/B Tests' }
      ]
    },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    {
      label: 'Reports',
      icon: '📈',
      children: [
        { path: '/admin/reports/analytics', label: 'Analytics' },
        { path: '/admin/reports/feedback', label: 'Feedback' },
        { path: '/admin/reports/errors', label: 'Error Logs' }
      ]
    },
    { path: '/admin/settings', label: 'Settings', icon: '🔧' }
  ];

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Dekleptocracy</h2>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            item.children ? (
              <NavGroup key={index} item={item} />
            ) : (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">{user.name[0]}</span>
            <span className="user-name">{user.name}</span>
          </div>
          <button className="logout-btn">Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div className="header-actions">
            <button className="action-btn">View Site</button>
            <button className="action-btn">Clear Cache</button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const NavGroup = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`nav-group ${isOpen ? 'open' : ''}`}>
      <button className="nav-group-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="nav-icon">{item.icon}</span>
        <span className="nav-label">{item.label}</span>
        <span className="nav-arrow">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="nav-group-items">
          {item.children.map((child, index) => (
            <NavLink
              key={index}
              to={child.path}
              className={({ isActive }) =>
                `nav-item nav-child ${isActive ? 'active' : ''}`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
```

### 2. Content Management - Wallet Shocks

```jsx
// src/admin/pages/content/WalletShocksAdmin.jsx
import { useState, useEffect } from 'react';
import { DataTable } from '../../components/DataTable';
import { ContentEditor } from '../../components/ContentEditor';
import { useToast } from '../../hooks/useToast';
import './ContentAdmin.css';

const WalletShocksAdmin = () => {
  const [shocks, setShocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShock, setSelectedShock] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchShocks();
  }, []);

  const fetchShocks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/wallet-shocks');
      const data = await response.json();
      setShocks(data.shocks);
    } catch (error) {
      showToast('Error loading wallet shocks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (shockData) => {
    try {
      const method = shockData._id ? 'PUT' : 'POST';
      const url = shockData._id
        ? `/api/admin/wallet-shocks/${shockData._id}`
        : '/api/admin/wallet-shocks';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shockData)
      });

      if (response.ok) {
        showToast('Wallet shock saved successfully', 'success');
        setIsEditorOpen(false);
        fetchShocks();
      }
    } catch (error) {
      showToast('Error saving wallet shock', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this wallet shock?')) return;

    try {
      await fetch(`/api/admin/wallet-shocks/${id}`, { method: 'DELETE' });
      showToast('Wallet shock deleted', 'success');
      fetchShocks();
    } catch (error) {
      showToast('Error deleting wallet shock', 'error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`/api/admin/wallet-shocks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      showToast(`Status changed to ${status}`, 'success');
      fetchShocks();
    } catch (error) {
      showToast('Error changing status', 'error');
    }
  };

  const columns = [
    { key: 'category', label: 'Category', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'price', label: 'Price' },
    { key: 'change', label: 'Change' },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <select
          value={value}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className={`status-select status-${value}`}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      )
    },
    {
      key: 'dataDate',
      label: 'Data Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="action-buttons">
          <button
            className="edit-btn"
            onClick={() => {
              setSelectedShock(row);
              setIsEditorOpen(true);
            }}
          >
            Edit
          </button>
          <button
            className="delete-btn"
            onClick={() => handleDelete(row._id)}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const shockFields = [
    { name: 'category', label: 'Category', type: 'select', options: [
      'FOOD', 'FUEL', 'UTILITIES', 'HOUSING', 'HEALTHCARE', 'TRANSPORTATION'
    ], required: true },
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'state', label: 'State', type: 'state-select', required: true },
    { name: 'icon', label: 'Icon', type: 'emoji-picker' },
    { name: 'iconBg', label: 'Icon Background', type: 'color' },
    { name: 'price', label: 'Price', type: 'text', required: true },
    { name: 'unit', label: 'Unit', type: 'text' },
    { name: 'change', label: 'Change', type: 'text', required: true },
    { name: 'changePercent', label: 'Change %', type: 'number' },
    { name: 'chartPath', label: 'Chart SVG Path', type: 'textarea' },
    { name: 'chartColor', label: 'Chart Color', type: 'color' },
    { name: 'dataDate', label: 'Data Date', type: 'date', required: true },
    { name: 'source', label: 'Data Source', type: 'text' },
    { name: 'sourceUrl', label: 'Source URL', type: 'url' },
    { name: 'status', label: 'Status', type: 'select', options: [
      'draft', 'published', 'archived'
    ] }
  ];

  return (
    <div className="content-admin-page">
      <div className="page-header">
        <h1>Wallet Shocks</h1>
        <button
          className="add-btn"
          onClick={() => {
            setSelectedShock(null);
            setIsEditorOpen(true);
          }}
        >
          + Add Wallet Shock
        </button>
      </div>

      <div className="filters-bar">
        <input type="search" placeholder="Search..." />
        <select>
          <option value="">All States</option>
          {/* State options */}
        </select>
        <select>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={shocks}
        loading={loading}
        pagination
        sortable
      />

      {isEditorOpen && (
        <ContentEditor
          title={selectedShock ? 'Edit Wallet Shock' : 'Add Wallet Shock'}
          fields={shockFields}
          data={selectedShock}
          onSave={handleSave}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default WalletShocksAdmin;
```

### 3. Social Posts Moderation

```jsx
// src/admin/pages/content/SocialPostsAdmin.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import './SocialPostsAdmin.css';

const SocialPostsAdmin = () => {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/social-posts?status=${filter}`);
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      showToast('Error loading posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/admin/social-posts/${id}/approve`, { method: 'POST' });
      showToast('Post approved', 'success');
      fetchPosts();
    } catch (error) {
      showToast('Error approving post', 'error');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await fetch(`/api/admin/social-posts/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      showToast('Post rejected', 'success');
      fetchPosts();
    } catch (error) {
      showToast('Error rejecting post', 'error');
    }
  };

  const handleFeature = async (id, featured) => {
    try {
      await fetch(`/api/admin/social-posts/${id}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured })
      });
      showToast(featured ? 'Post featured' : 'Post unfeatured', 'success');
      fetchPosts();
    } catch (error) {
      showToast('Error updating post', 'error');
    }
  };

  return (
    <div className="social-posts-admin">
      <div className="page-header">
        <h1>Social Posts Moderation</h1>
        <div className="header-stats">
          <span className="stat pending">Pending: {posts.filter(p => !p.approved).length}</span>
          <span className="stat approved">Approved: {posts.filter(p => p.approved).length}</span>
        </div>
      </div>

      <div className="filter-tabs">
        {['pending', 'approved', 'rejected', 'featured'].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="empty-state">No posts found</div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <span className="platform-badge">{post.platform}</span>
                <span className="username">{post.username}</span>
                {post.verified && <span className="verified">✓</span>}
              </div>

              <p className="post-text">{post.text}</p>

              {post.images?.[0] && (
                <img
                  src={post.images[0].url}
                  alt="Post image"
                  className="post-image"
                />
              )}

              <div className="post-meta">
                <span>Submitted: {new Date(post.createdAt).toLocaleDateString()}</span>
                <span>Engagement: {post.engagement?.likes || 0} likes</span>
              </div>

              <div className="post-actions">
                {!post.approved && (
                  <>
                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(post._id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleReject(post._id, reason);
                      }}
                    >
                      ✕ Reject
                    </button>
                  </>
                )}
                {post.approved && (
                  <button
                    className={`feature-btn ${post.featured ? 'featured' : ''}`}
                    onClick={() => handleFeature(post._id, !post.featured)}
                  >
                    {post.featured ? '★ Unfeature' : '☆ Feature'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialPostsAdmin;
```

### 4. Configuration Management

```jsx
// src/admin/pages/config/FeaturedStatesAdmin.jsx
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useToast } from '../../hooks/useToast';
import './ConfigAdmin.css';

const ALL_STATES = [
  'Alabama', 'Alaska', 'Arizona', /* ... all 50 states */
];

const FeaturedStatesAdmin = () => {
  const [featuredStates, setFeaturedStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config/featured-states');
      const data = await response.json();
      setFeaturedStates(data.states);
    } catch (error) {
      showToast('Error loading configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(featuredStates);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setFeaturedStates(items);
  };

  const handleAddState = (state) => {
    if (featuredStates.length >= 6) {
      showToast('Maximum 6 featured states allowed', 'warning');
      return;
    }
    if (!featuredStates.includes(state)) {
      setFeaturedStates([...featuredStates, state]);
    }
  };

  const handleRemoveState = (state) => {
    setFeaturedStates(featuredStates.filter(s => s !== state));
  };

  const handleSave = async () => {
    try {
      await fetch('/api/admin/config/featured-states', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ states: featuredStates })
      });
      showToast('Featured states saved', 'success');
    } catch (error) {
      showToast('Error saving configuration', 'error');
    }
  };

  return (
    <div className="config-admin-page">
      <div className="page-header">
        <h1>Featured States Configuration</h1>
        <button className="save-btn" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      <div className="config-section">
        <h2>Current Featured States (drag to reorder)</h2>
        <p className="section-description">
          These states appear as quick-select tabs on the homepage.
          Maximum 6 states allowed.
        </p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="featured-states" direction="horizontal">
            {(provided) => (
              <div
                className="featured-states-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {featuredStates.map((state, index) => (
                  <Draggable key={state} draggableId={state} index={index}>
                    {(provided) => (
                      <div
                        className="featured-state-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <span className="drag-handle">⋮⋮</span>
                        <span className="state-name">{state}</span>
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveState(state)}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="config-section">
        <h2>Add State</h2>
        <select
          onChange={(e) => {
            handleAddState(e.target.value);
            e.target.value = '';
          }}
          disabled={featuredStates.length >= 6}
        >
          <option value="">Select a state to add...</option>
          {ALL_STATES.filter(s => !featuredStates.includes(s)).map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <div className="config-section">
        <h2>Preview</h2>
        <div className="preview-tabs">
          {featuredStates.map((state) => (
            <button key={state} className="preview-tab">
              {state.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedStatesAdmin;
```

### 5. Admin API Routes

```javascript
// server/routes/adminRoutes.js
import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import WalletShock from '../models/WalletShock.js';
import SocialPost from '../models/SocialPost.js';
import SiteConfig from '../models/SiteConfig.js';

const router = express.Router();

// Require admin for all routes
router.use(requireAdmin);

// Wallet Shocks CRUD
router.get('/wallet-shocks', async (req, res) => {
  const shocks = await WalletShock.find().sort('-createdAt');
  res.json({ success: true, shocks });
});

router.post('/wallet-shocks', async (req, res) => {
  const shock = await WalletShock.create(req.body);
  res.status(201).json({ success: true, shock });
});

router.put('/wallet-shocks/:id', async (req, res) => {
  const shock = await WalletShock.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ success: true, shock });
});

router.delete('/wallet-shocks/:id', async (req, res) => {
  await WalletShock.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.patch('/wallet-shocks/:id/status', async (req, res) => {
  const shock = await WalletShock.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json({ success: true, shock });
});

// Social Posts Moderation
router.get('/social-posts', async (req, res) => {
  const { status } = req.query;
  let query = {};

  if (status === 'pending') query = { approved: false, rejected: { $ne: true } };
  if (status === 'approved') query = { approved: true };
  if (status === 'rejected') query = { rejected: true };
  if (status === 'featured') query = { featured: true, approved: true };

  const posts = await SocialPost.find(query).sort('-createdAt');
  res.json({ success: true, posts });
});

router.post('/social-posts/:id/approve', async (req, res) => {
  const post = await SocialPost.findByIdAndUpdate(
    req.params.id,
    {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date()
    },
    { new: true }
  );
  res.json({ success: true, post });
});

router.post('/social-posts/:id/reject', async (req, res) => {
  const post = await SocialPost.findByIdAndUpdate(
    req.params.id,
    {
      rejected: true,
      rejectionReason: req.body.reason,
      rejectedBy: req.user._id,
      rejectedAt: new Date()
    },
    { new: true }
  );
  res.json({ success: true, post });
});

router.post('/social-posts/:id/feature', async (req, res) => {
  const post = await SocialPost.findByIdAndUpdate(
    req.params.id,
    { featured: req.body.featured },
    { new: true }
  );
  res.json({ success: true, post });
});

// Configuration
router.get('/config/:key', async (req, res) => {
  const config = await SiteConfig.findOne({ key: req.params.key });
  res.json({ success: true, config: config?.value });
});

router.put('/config/:key', async (req, res) => {
  const config = await SiteConfig.findOneAndUpdate(
    { key: req.params.key },
    {
      key: req.params.key,
      value: req.body,
      updatedBy: req.user._id
    },
    { upsert: true, new: true }
  );

  // Invalidate cache
  await invalidateCache(req.params.key);

  res.json({ success: true, config });
});

// Cache management
router.post('/cache/clear', async (req, res) => {
  const { keys } = req.body;
  await clearCache(keys);
  res.json({ success: true, message: 'Cache cleared' });
});

router.get('/cache/stats', async (req, res) => {
  const stats = await getCacheStats();
  res.json({ success: true, stats });
});

export default router;
```

### 6. Role-Based Access Control

```javascript
// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  MODERATOR: 'moderator',
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'], // All permissions
  [ROLES.EDITOR]: [
    'content:read', 'content:write', 'content:publish',
    'config:read'
  ],
  [ROLES.MODERATOR]: [
    'content:read', 'social:moderate'
  ],
  [ROLES.VIEWER]: [
    'content:read', 'reports:read'
  ]
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    await requireAuth(req, res, () => {
      const userPermissions = PERMISSIONS[req.user.role] || [];

      if (userPermissions.includes('*') || userPermissions.includes(permission)) {
        next();
      } else {
        res.status(403).json({ error: `Permission '${permission}' required` });
      }
    });
  };
};
```

---

## Implementation Steps

### Step 1: Admin Layout (Day 1)

- [ ] Create admin layout component
- [ ] Build sidebar navigation
- [ ] Implement responsive design
- [ ] Add authentication check

### Step 2: Content CRUD (Day 2-3)

- [ ] Create DataTable component
- [ ] Build ContentEditor component
- [ ] Implement wallet shocks admin
- [ ] Implement cost drivers admin
- [ ] Implement stats admin

### Step 3: Social Moderation (Day 3-4)

- [ ] Build moderation interface
- [ ] Implement approve/reject flow
- [ ] Add feature/unfeature functionality
- [ ] Create moderation queue

### Step 4: Configuration (Day 4-5)

- [ ] Build featured states config
- [ ] Create timeline config
- [ ] Implement map region config
- [ ] Add A/B test config

### Step 5: RBAC (Day 5-6)

- [ ] Implement role system
- [ ] Create permissions middleware
- [ ] Build user management
- [ ] Add role assignment UI

### Step 6: Admin APIs (Day 6-7)

- [ ] Create CRUD endpoints
- [ ] Add moderation endpoints
- [ ] Implement config endpoints
- [ ] Add cache management

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Content update time | < 5 minutes |
| Moderation queue processing | < 1 hour |
| Admin page load time | < 2 seconds |
| Error rate | < 1% |
| User satisfaction | 90%+ |

---

## Final Notes

This completes the 9-phase improvement plan for the Dekleptocracy landing page. The phases should be implemented in order, with each phase building on the previous ones:

1. **Phase 1**: Data Integration (Foundation)
2. **Phase 2**: Component Architecture (Structure)
3. **Phase 3**: Performance (Speed)
4. **Phase 4**: User Experience (Polish)
5. **Phase 5**: Interactive Features (Engagement)
6. **Phase 6**: Data Quality (Credibility)
7. **Phase 7**: SEO (Discovery)
8. **Phase 8**: Analytics (Insights)
9. **Phase 9**: Admin CMS (Management)

Total estimated timeline: 10-12 weeks for complete implementation.
