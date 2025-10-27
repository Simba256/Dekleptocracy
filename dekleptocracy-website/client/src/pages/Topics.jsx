import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Topics.css';

const Topics = () => {
  const [selectedTopics, setSelectedTopics] = useState([]);

  const topics = [
    {
      id: 'household-costs',
      title: 'Household Costs',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop'
    },
    {
      id: 'lobbying-influence',
      title: 'Lobbying & Influence',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=300&h=200&fit=crop'
    },
    {
      id: 'taxes-tariffs',
      title: 'Taxes & Tariffs',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&h=200&fit=crop'
    },
    {
      id: 'lobbying-influence-2',
      title: 'Lobbying & Influence',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=300&h=200&fit=crop'
    },
    {
      id: 'healthcare-education',
      title: 'Healthcare & Education',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=200&fit=crop'
    },
    {
      id: 'environment-climate',
      title: 'Environment & Climate',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop'
    }
  ];

  const handleTopicToggle = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleNext = () => {
    // Handle topic selection submission here
    console.log('Selected topics:', selectedTopics);
    // Navigate to household expense page
    window.location.href = '/household-expense';
  };

  return (
    <div className="topics-page">
      <div className="topics-container">
        <div className="topics-content">
          <h1 className="topics-question">
            What specific topics would you like the AI to focus on during your interactions?
          </h1>
          
          <p className="topics-instruction">
            You can select multiple options from the following list
          </p>

          <div className="topics-grid">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`topic-card ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                onClick={() => handleTopicToggle(topic.id)}
              >
                <h3 className="topic-title">{topic.title}</h3>
                <div className="topic-image">
                  <img src={topic.image} alt={topic.title} />
                </div>
              </div>
            ))}
          </div>

          <div className="navigation-buttons">
            <Link to="/household-expense" className="skip-button">
              Skip
            </Link>
            <button 
              className="next-button"
              onClick={handleNext}
              disabled={selectedTopics.length === 0}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topics;
