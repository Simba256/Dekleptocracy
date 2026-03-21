import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomepage, ALL_STATES } from '../../../context/HomepageContext';
import StateDropdown from '../../../components/common/StateDropdown';

export const HeroSection = memo(function HeroSection() {
  const navigate = useNavigate();
  const { state, actions } = useHomepage();
  const { searchQuery, dropdownStates, searchStates, selectedState, quickQuestions } = state;

  const handleAskAI = () => {
    navigate('/chatbot', { state: { initialQuery: searchQuery } });
  };

  const handleQuestionClick = (questionText) => {
    navigate('/chatbot', { state: { initialQuery: questionText } });
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* AI Capsule Bar */}
        <div className="ai-capsule-bar">
          <svg className="ai-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="8" width="16" height="12" rx="2" />
            <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <circle cx="9" cy="14" r="1" fill="currentColor" />
            <circle cx="15" cy="14" r="1" fill="currentColor" />
            <path d="M9 17h6" />
          </svg>
          <span className="ai-capsule-text">AI-Powered Policy Intelligence System</span>
        </div>

        <h1 className="hero-title">
          Discover how government decisions<br />
          impact your budget
        </h1>

        {/* AI Search Box */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Ask anything about prices, tariffs or your bills."
              value={searchQuery}
              onChange={(e) => actions.setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="search-tools">
              <button className="tool-btn" title="Attach file" aria-label="Attach file" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button className="tool-btn" title="Add emoji" aria-label="Add emoji" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                </svg>
              </button>
              <button className="tool-btn" title="Add image" aria-label="Add image" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <button className="tool-btn" title="Format text" aria-label="Format text" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </button>
            </div>
            <button className="ask-ai-btn" onClick={handleAskAI}>
              Ask AI
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>

          {/* Location Input */}
          <div className="location-section">
            <span className="location-label">Select Your State:</span>
            <StateDropdown
              value={selectedState}
              onChange={actions.setSelectedState}
              isOpen={dropdownStates.hero}
              onToggle={() => actions.toggleDropdown('hero')}
              onClose={actions.closeAllDropdowns}
              searchValue={searchStates.hero}
              onSearchChange={(v) => actions.setDropdownSearch('hero', v)}
              variant="hero"
            />
          </div>

          {/* Quick Question Cards */}
          <div className="quick-questions">
            {(quickQuestions.length > 0 ? quickQuestions : [
              { text: 'How does the new tax hit my grocery bill in my city?', category: 'taxes' },
              { text: 'Why is gas more expensive in my city than last year?', category: 'prices' },
              { text: 'Compare eggs and milk prices in my city than others?', category: 'comparison' }
            ]).map((question, index) => (
              <button
                key={index}
                className="question-card"
                onClick={() => handleQuestionClick(question.text)}
                type="button"
              >
                {index === 0 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                )}
                {index === 1 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                )}
                {index === 2 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                )}
                <span>{question.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;
