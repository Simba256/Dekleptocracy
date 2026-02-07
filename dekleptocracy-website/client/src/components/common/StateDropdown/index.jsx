import { useCallback, useMemo } from 'react';
import { ALL_STATES } from '../../../context/HomepageContext';
import './StateDropdown.css';

/**
 * Reusable State Dropdown Component
 * @param {Object} props
 * @param {string} props.value - Currently selected state
 * @param {Function} props.onChange - Callback when state changes
 * @param {boolean} props.isOpen - Whether dropdown is open
 * @param {Function} props.onToggle - Toggle dropdown
 * @param {Function} props.onClose - Close dropdown
 * @param {string} props.searchValue - Current search value
 * @param {Function} props.onSearchChange - Search change handler
 * @param {string} props.variant - Style variant: 'default', 'hero', 'coral', 'map'
 * @param {string} props.label - Optional label above the dropdown
 * @param {string} props.sublabel - Optional sublabel (e.g., "Current Location")
 */
export function StateDropdown({
  value,
  onChange,
  isOpen = false,
  onToggle,
  onClose,
  searchValue = '',
  onSearchChange,
  variant = 'default',
  label,
  sublabel
}) {
  // Filter states based on search
  const filteredStates = useMemo(() => {
    if (!searchValue) return ALL_STATES;
    return ALL_STATES.filter(state =>
      state.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  // Get display value
  const displayValue = useMemo(() => {
    if (!value || value === 'nationwide') {
      return 'All States';
    }
    return value;
  }, [value]);

  const handleSelect = useCallback((state) => {
    const stateValue = state === 'All states' ? 'nationwide' : state;
    onChange(stateValue);
    if (onClose) onClose();
  }, [onChange, onClose]);

  const handleSearchChange = useCallback((e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  }, [onSearchChange]);

  const handleOverlayClick = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Get button class based on variant
  const buttonClass = `state-dropdown-btn state-dropdown-btn--${variant}`;

  return (
    <div className="state-dropdown-wrapper">
      {label && <label className="state-dropdown-label">{label}</label>}
      <div className="state-dropdown">
        <button
          className={buttonClass}
          onClick={onToggle}
          type="button"
        >
          {sublabel && <span className="state-dropdown-sublabel">{sublabel}</span>}
          <span className="state-dropdown-value">{displayValue}</span>
          <svg
            className={`state-dropdown-arrow ${isOpen ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="state-dropdown-overlay" onClick={handleOverlayClick}></div>
            <div className="state-dropdown-menu">
              <div className="state-dropdown-search">
                <input
                  type="text"
                  className="state-dropdown-search-input"
                  placeholder="Search states..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
              <div className="state-dropdown-items">
                {filteredStates.map((state, index) => (
                  <div
                    key={index}
                    className={`state-dropdown-item ${value === state || (value === 'nationwide' && state === 'All states') ? 'selected' : ''}`}
                    onClick={() => handleSelect(state)}
                  >
                    {state}
                  </div>
                ))}
                {filteredStates.length === 0 && (
                  <div className="state-dropdown-no-results">No states found</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StateDropdown;
