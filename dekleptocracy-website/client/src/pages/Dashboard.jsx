import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/apiUrl';
import { STORAGE_KEYS } from '../utils/constants';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view your dashboard.');
        setLoading(false);
        return;
      }

      // Load from cache first for instant display
      const cachedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          setProfile(profile);
          setLoading(false); // Show cached data immediately
        } catch {
          // Silent fail for corrupt cached profile
        }
      }

      try {
        // Fetch fresh data in background
        const res = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load profile');
        }

        // Cache profile data
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user));
        if (data.user.preferences) {
          localStorage.setItem(
            STORAGE_KEYS.USER_PREFERENCES,
            JSON.stringify(data.user.preferences),
          );
        }

        setProfile(data.user);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const prefs = profile?.preferences || {};
  const topics = prefs.topicsOfInterest || [];
  const styles = prefs.conversationStyles || [];

  const stats = [
    { label: 'Household focus', value: prefs.householdExpenseFocus || 'Not set', trend: '' },
    {
      label: 'Member since',
      value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—',
      trend: '',
    },
  ];

  const watchlist = topics.length
    ? topics.map((topic, idx) => ({
        title: topic,
        detail: 'Tracking latest policy moves and news for this topic',
        badge: idx === 0 ? 'Priority' : 'Watch',
      }))
    : [
        {
          title: 'No topics selected',
          detail: 'Update your preferences to see a personalized watchlist.',
          badge: 'Info',
        },
      ];

  const tasks = [
    { title: 'Sync preferences', detail: 'Make sure survey choices are saved', badge: 'Ready' },
    { title: 'Try a guided prompt', detail: 'Ask for a weekly budget summary', badge: '1 min' },
    { title: 'Review latest chat', detail: 'Pick up where you left off', badge: 'Resume' },
  ];

  const quickPrompts = [
    'How did tariffs change my grocery bill?',
    'Show me fuel price trends this week',
    'What taxes impact my take-home pay?',
  ];

  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate('/chatbot', { state: { initialQuery: prompt } });
    setPrompt('');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <div className="dash-hero">
            <div>
              <h1>Dashboard</h1>
              <p>{error}</p>
            </div>
            <div className="hero-actions">
              <button className="pill primary" onClick={() => navigate('/chatbot/login')}>
                Login
              </button>
              <button className="pill" onClick={() => navigate('/chatbot/create-account')}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dash-hero">
          <div>
            <h1>Welcome back{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}</h1>
            <p>Snapshot of your policy signals, topics, and next actions.</p>
          </div>
          <div className="hero-actions">
            <button className="pill primary" onClick={() => navigate('/chatbot')}>
              Open Chatbot
            </button>
            <button className="pill" onClick={() => navigate('/profile')}>
              View Profile
            </button>
            <button className="pill" onClick={() => navigate('/survey')}>
              Update Preferences
            </button>
          </div>
        </div>

        <div className="stat-grid">
          {stats.map((item) => (
            <div key={item.label} className="stat-card">
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{item.value}</div>
              {item.trend && <div className="stat-trend">{item.trend}</div>}
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          <div className="panel">
            <header>
              <h3>Policy watchlist</h3>
              <small>Based on your topics</small>
            </header>
            <div className="list">
              {watchlist.map((item) => (
                <div key={item.title} className="list-item">
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </div>
                  <span className="badge">{item.badge}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <header>
              <h3>Quick actions</h3>
              <small>Stay on track</small>
            </header>
            <div className="list">
              {tasks.map((task) => (
                <div key={task.title} className="list-item">
                  <div>
                    <h4>{task.title}</h4>
                    <p>{task.detail}</p>
                  </div>
                  <span className="badge">{task.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <header>
            <h3>Your preferences</h3>
            <small>From survey & profile</small>
          </header>
          <div className="two-col">
            <div>
              <h4 style={{ margin: '0 0 8px' }}>Topics</h4>
              {topics.length ? (
                <div className="pill-row">
                  {topics.map((topic) => (
                    <span key={topic} className="pill">
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', margin: 0 }}>No topics selected yet.</p>
              )}
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px' }}>Conversation styles</h4>
              {styles.length ? (
                <div className="pill-row">
                  {styles.map((style) => (
                    <span key={style} className="pill">
                      {style}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', margin: 0 }}>No styles selected yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="assistant-card">
          <header>
            <h3>Ask the assistant</h3>
            <small>Uses your saved preferences for context</small>
          </header>
          <div className="pill-row">
            {quickPrompts.map((text) => (
              <button key={text} className="pill" onClick={() => setPrompt(text)}>
                {text}
              </button>
            ))}
          </div>
          <div className="assistant-input">
            <input
              type="text"
              placeholder="Enter a prompt for the chatbot"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
            />
            <button onClick={handlePromptSubmit}>Send</button>
          </div>
          <small style={{ color: '#6b7280' }}>
            Data is pulled from your profile; more live data hooks coming soon.
          </small>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
