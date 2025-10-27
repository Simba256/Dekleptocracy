import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [prompt, setPrompt] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const policyCards = [
    {
      id: 1,
      icon: '🌸',
      question: 'How tariffs changed my grocery bill this week.'
    },
    {
      id: 2,
      icon: '🌀',
      question: 'Track how fuel prices are rising in my city.'
    },
    {
      id: 3,
      icon: '🟢',
      question: 'Which industries are lobbying most?'
    },
    {
      id: 4,
      icon: '🌼',
      question: 'See how taxes are affecting my income'
    }
  ];

  const handlePromptSubmit = () => {
    if (prompt.trim()) {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "⚠️ I don't have that data yet, but I've flagged it for our team to review. You'll see updated insights here once that data is connected.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, userMessage, botMessage]);
      setPrompt('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePromptSubmit();
    }
  };

  return (
    <div className="dashboard-page">
      {/* Main Container */}
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <button
            className="sidebar-toggle"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? '▶' : '◀'}
          </button>
          <div className="sidebar-logo">
            <span className="logo-bold">
              d<span className="e-with-dash">e</span>
            </span>
          </div>
          <div className="sidebar-nav">
            <div className="nav-item active">
              <span className="nav-icon">💬</span>
              <span className="nav-text">Chat</span>
            </div>
            <div className="nav-item">
              <span className="nav-icon">📄</span>
              <span className="nav-text">Chat History</span>
              <span className="nav-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`main-content ${isSidebarCollapsed ? 'expanded' : ''}`}>
          <div className="content-header">
            <h1 className="main-logo dashboard-main">
              <span className="logo-bold">
                d<span className="e-with-dash">e</span>
              </span>
            </h1>
            <p className="tagline">AI That Personalizes Policy Insights for You</p>
          </div>

          {/* Policy Cards - Only show when no chat messages */}
          {chatMessages.length === 0 && (
            <div className="policy-cards">
              {policyCards.map((card) => (
                <div key={card.id} className="policy-card">
                  <div className="card-icon">{card.icon}</div>
                  <p className="card-question">{card.question}</p>
                </div>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="chat-messages">
              {chatMessages.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-avatar">
                    {message.type === 'user' ? (
                      <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="User" />
                    ) : (
                      <div className="bot-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <rect x="7" y="7" width="10" height="10" rx="1" ry="1"/>
                          <line x1="7" y1="7" x2="17" y2="17"/>
                          <line x1="17" y1="7" x2="7" y2="17"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-sender">{message.type === 'user' ? 'You' : 'Chatbot'}</span>
                      <span className="message-time">{message.timestamp}</span>
                    </div>
                    <div className="message-bubble">
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Bottom Navigation */}
              <div className="chat-navigation">
                <div className="nav-controls">
                  <button className="nav-btn">‹</button>
                  <span className="nav-counter">1/2</span>
                  <button className="nav-btn">›</button>
                </div>
                <div className="nav-actions">
                  <button className="action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
                      <path d="M19.07,4.93a10,10,0,0,1,0,14.14M15.54,8.46a5,5,0,0,1,0,7.07"/>
                    </svg>
                  </button>
                  <button className="action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5,15H4a2,2,0,0,1-2-2V4a2,2,0,0,1,2-2H15"/>
                    </svg>
                  </button>
                  <button className="action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23,4 23,10 17,10"/>
                      <path d="M20.49,15a9,9,0,1,1-2.12-9.36L23,10"/>
                    </svg>
                  </button>
                  <button className="action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10,15v4a3,3,0,0,0,3,3l4-9V2H5.72a2,2,0,0,0-2,1.7l-1.38,9a2,2,0,0,0,2,2.3Zm7-13h2.67A2.31,2.31,0,0,1,22,4v7a2.31,2.31,0,0,1-2.33,2H17"/>
                    </svg>
                  </button>
                  <button className="action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12,20h9"/>
                      <path d="M16.5,3.5a2.121,2.121,0,0,1,3,3L7,19l-4,1,1-4L16.5,3.5Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Input Section */}
          <div className="chat-input-section">
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Enter a prompt here"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <div className="input-icons">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                    <line x1="17" y1="7" x2="21" y2="3"/>
                    <line x1="17" y1="3" x2="21" y2="7"/>
                  </svg>
                </span>
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </span>
                <span className="input-icon submit-icon" onClick={handlePromptSubmit}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                  </svg>
                </span>
              </div>
            </div>
            <p className="disclaimer">
              Dekleoptocracy may simplify or approximate data. Please verify details before making any decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
