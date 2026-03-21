import { useCallback, useMemo, useRef, useEffect } from 'react';
import { ALL_STATES } from '../../../context/HomepageContext';
import { ScreenReaderOnly } from '../ScreenReaderOnly';
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
 * @param {string} props.label - Optional label above dropdown
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
  sublabel,
}) {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const focusedIndexRef = useRef(-1);

  // Filter states based on search
  const filteredStates = useMemo(() => {
    if (!searchValue) return ALL_STATES;
    return ALL_STATES.filter((state) => state.toLowerCase().includes(searchValue.toLowerCase()));
  }, [searchValue]);

  // Get display value
  const displayValue = useMemo(() => {
    if (!value || value === 'nationwide') {
      return 'All States';
    }
    return value;
  }, [value]);

  // Find selected index for keyboard navigation
  const _selectedIndex = useMemo(() => {
    return filteredStates.findIndex((state) => {
      if (value === 'nationwide') return state === 'All states';
      return state === value;
    });
  }, [filteredStates, value]);

  const handleSelect = useCallback(
    (state) => {
      const stateValue = state === 'All states' ? 'nationwide' : state;
      onChange(stateValue);
      focusedIndexRef.current = -1;
      if (onClose) onClose();
      buttonRef.current?.focus();
    },
    [onChange, onClose],
  );

  const handleSearchChange = useCallback(
    (e) => {
      if (onSearchChange) {
        onSearchChange(e.target.value);
        focusedIndexRef.current = -1;
      }
    },
    [onSearchChange],
  );

  const handleOverlayClick = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          onToggle();
        }
        return;
      }

      const itemsCount = filteredStates.length;
      const currentIndex = focusedIndexRef.current;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusedIndexRef.current = currentIndex < itemsCount - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusedIndexRef.current = currentIndex > 0 ? currentIndex - 1 : itemsCount - 1;
          break;
        case 'Home':
          e.preventDefault();
          focusedIndexRef.current = 0;
          break;
        case 'End':
          e.preventDefault();
          focusedIndexRef.current = itemsCount - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndexRef.current >= 0 && focusedIndexRef.current < itemsCount) {
            handleSelect(filteredStates[focusedIndexRef.current]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          buttonRef.current?.focus();
          break;
        case 'Tab':
          e.preventDefault();
          onClose();
          break;
        default:
          return;
      }
    },
    [isOpen, filteredStates, onToggle, onClose, handleSelect],
  );

  // Focus management for menu items
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const items = menuRef.current.querySelectorAll('.state-dropdown-item');
      if (focusedIndexRef.current >= 0 && items[focusedIndexRef.current]) {
        items[focusedIndexRef.current].focus();
      }
    }
  }, [isOpen, filteredStates]);

  // Focus trap for dropdown
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Get button class based on variant
  const buttonClass = `state-dropdown-btn state-dropdown-btn--${variant}`;

  const dropdownId = `state-dropdown-${label?.replace(/\s+/g, '-') || 'default'}`;
  const menuId = `${dropdownId}-menu`;

  return (
    <div className="state-dropdown-wrapper">
      {label && (
        <label htmlFor={dropdownId} className="state-dropdown-label">
          {label}
        </label>
      )}
      <div className="state-dropdown">
        <button
          ref={buttonRef}
          id={dropdownId}
          className={buttonClass}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={label || 'Select state'}
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
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="state-dropdown-overlay"
              onClick={handleOverlayClick}
              aria-hidden="true"
            ></div>
            <div
              ref={menuRef}
              id={menuId}
              className="state-dropdown-menu"
              role="listbox"
              aria-labelledby={dropdownId}
              aria-activedescendant={
                focusedIndexRef.current >= 0
                  ? `${menuId}-item-${focusedIndexRef.current}`
                  : undefined
              }
            >
              <div className="state-dropdown-search">
                <input
                  type="text"
                  id={`${menuId}-search`}
                  className="state-dropdown-search-input"
                  placeholder="Search states..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  aria-label="Search states"
                  aria-controls={menuId}
                />
              </div>
              <div className="state-dropdown-items" role="presentation">
                {filteredStates.map((state, index) => {
                  const isSelected =
                    value === state || (value === 'nationwide' && state === 'All states');
                  return (
                    <div
                      key={state}
                      id={`${menuId}-item-${index}`}
                      className={`state-dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(state)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect(state);
                        }
                      }}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={-1}
                    >
                      {state}
                      {isSelected && <ScreenReaderOnly> (selected)</ScreenReaderOnly>}
                    </div>
                  );
                })}
                {filteredStates.length === 0 && (
                  <div className="state-dropdown-no-results" role="status" aria-live="polite">
                    No states found
                  </div>
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
