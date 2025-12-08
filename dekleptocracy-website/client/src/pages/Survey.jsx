import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadPreferences, savePreferences } from '../utils/preferences';
import './Survey.css';

const Survey = () => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const options = [
    "Casual And Friendly",
    "Professional And Formal", 
    "Informative And Detailed",
    "Quick And To The Point",
    "Creative And Engaging"
  ];

  useEffect(() => {
    const saved = loadPreferences();
    if (saved.conversationStyles.length) {
      setSelectedOptions(saved.conversationStyles);
    }
  }, []);

  const handleOptionToggle = (option) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleNext = () => {
    savePreferences({ conversationStyles: selectedOptions });
    window.location.href = '/topics';
  };

  return (
    <div className="survey-page">
      <div className="survey-container">
        <div className="survey-content">
          <h1 className="survey-question">
            What type of AI chat experience are you looking for?
          </h1>
          
          <p className="survey-instruction">
            You can select multiple options from the following list
          </p>

          <div className="options-container">
            {options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${selectedOptions.includes(option) ? 'selected' : ''}`}
                onClick={() => handleOptionToggle(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="navigation-buttons">
            <Link
              to="/topics"
              className="skip-button"
              onClick={() => savePreferences({ conversationStyles: selectedOptions })}
            >
              Skip
            </Link>
            <button 
              className="next-button"
              onClick={handleNext}
              disabled={selectedOptions.length === 0}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Survey;
