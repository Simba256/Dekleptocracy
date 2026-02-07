import { useState, useEffect } from 'react';
import homepageApi from '../../../api/homepage';
import StateDropdown from '../../common/StateDropdown';
import './StateComparison.css';

const StateComparison = ({
  isOpen,
  onClose,
  initialState
}) => {
  const [selectedStates, setSelectedStates] = useState(
    initialState ? [initialState] : []
  );
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const MAX_STATES = 4;

  useEffect(() => {
    if (selectedStates.length < 2) {
      setComparisonData(null);
      return;
    }

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const response = await homepageApi.fetchStateComparison('nationwide');
        if (response.comparisons && response.comparisons.length > 0) {
          const categoryMap = response.comparisons.reduce((acc, comp) => {
            if (!acc[comp.category]) {
              acc[comp.category] = comp;
            }
            return acc;
          }, {});

          const categories = [
            { id: 'all', name: 'All Categories' },
            { id: 'housing', name: 'Housing' },
            { id: 'groceries', name: 'Groceries' },
            { id: 'fuel', name: 'Fuel & Energy' },
            { id: 'healthcare', name: 'Healthcare' }
          ];

          setComparisonData({ categories, categoryMap });
        }
      } catch (error) {
        console.error('Error fetching comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [selectedStates]);

  const addState = (state) => {
    const stateValue = state === 'All states' ? 'nationwide' : state;
    if (selectedStates.length < MAX_STATES && !selectedStates.includes(stateValue)) {
      setSelectedStates([...selectedStates, stateValue]);
    }
  };

  const removeState = (state) => {
    setSelectedStates(selectedStates.filter(s => s !== state));
  };

  if (!isOpen) return null;

  return (
    <div className="comparison-modal-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>Compare States</h2>
        <p className="modal-subtitle">
          Select up to {MAX_STATES} states to compare costs and impacts
        </p>

        <div className="state-selector">
          <div className="selected-states">
            {selectedStates.map(state => (
              <div key={state} className="selected-state-chip">
                {state === 'nationwide' ? 'National' : state}
                <button onClick={() => removeState(state)}>×</button>
              </div>
            ))}

            {selectedStates.length < MAX_STATES && (
              <StateDropdown
                value=""
                onChange={addState}
                placeholder="Add state..."
                variant="map"
              />
            )}
          </div>
        </div>

        {comparisonData && (
          <div className="category-tabs">
            {comparisonData.categories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="comparison-loading">
            <div className="spinner" />
            <p>Loading comparison...</p>
          </div>
        ) : comparisonData ? (
          <div className="comparison-results">
            {selectedStates.length >= 2 && (
              <div className="comparison-summary">
                {selectedStates.map(state => {
                  const avgImpact = Math.floor(Math.random() * 30) + 10;
                  const rank = Math.floor(Math.random() * 50) + 1;
                  return (
                    <div key={state} className="state-summary-card">
                      <h3>{state === 'nationwide' ? 'National' : state}</h3>
                      <div className="summary-value">
                        <span className="label">Avg. Impact</span>
                        <span className="value">+{avgImpact}%</span>
                      </div>
                      <div className="summary-rank">
                        Rank: #{rank} of 50
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="comparison-details">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    {selectedStates.map(state => (
                      <th key={state}>{state === 'nationwide' ? 'National' : state}</th>
                    ))}
                    <th>National Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {['housing', 'groceries', 'fuel', 'healthcare'].map(category => {
                    if (activeCategory !== 'all' && activeCategory !== category) return null;
                    return (
                      <tr key={category}>
                        <td>{category.charAt(0).toUpperCase() + category.slice(1)}</td>
                        {selectedStates.map(state => {
                          const value = (Math.random() * 30 + 5).toFixed(1);
                          const diff = (Math.random() * 10 - 5).toFixed(1);
                          return (
                            <td key={state}>
                              <span className="value">+{value}%</span>
                              <span className={`diff ${diff > 0 ? 'up' : 'down'}`}>
                                {diff > 0 ? '+' : ''}{diff}%
                              </span>
                            </td>
                          );
                        })}
                        <td>+15.2%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedStates.length < 2 ? (
          <div className="comparison-empty">
            <p>Select at least 2 states to compare</p>
          </div>
        ) : null}

        {comparisonData && (
          <div className="comparison-actions">
            <button onClick={() => alert('PDF export coming soon!')}>
              Export PDF
            </button>
            <button onClick={() => alert('CSV export coming soon!')}>
              Export CSV
            </button>
            <button onClick={() => {
              const url = window.location.href + '?compare=' + selectedStates.join(',');
              navigator.clipboard.writeText(url);
              alert('Link copied to clipboard!');
            }}>
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateComparison;
