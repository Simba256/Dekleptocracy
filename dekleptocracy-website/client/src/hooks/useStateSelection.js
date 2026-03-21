import { useState, useCallback, useMemo } from 'react';
import { ALL_STATES } from '../context/HomepageContext';

/**
 * Hook for managing state selection with search filtering
 * @param {Object} options - Configuration options
 * @param {Function} options.onStateChange - Callback when state changes
 * @param {string} options.initialState - Initial selected state
 */
export function useStateSelection(options = {}) {
  const { onStateChange, initialState = null } = options;

  const [selectedState, setSelectedState] = useState(initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states based on search term
  const filteredStates = useMemo(() => {
    if (!searchTerm) return ALL_STATES;
    return ALL_STATES.filter((state) => state.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  // Handle state selection
  const selectState = useCallback(
    (state) => {
      const stateValue = state === 'All states' ? 'nationwide' : state;
      setSelectedState(stateValue);
      setIsOpen(false);
      setSearchTerm('');
      if (onStateChange) {
        onStateChange(stateValue);
      }
    },
    [onStateChange],
  );

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSearchTerm('');
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  // Handle search input
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Get display value for the current selection
  const displayValue = useMemo(() => {
    if (!selectedState || selectedState === 'nationwide') {
      return 'All States';
    }
    return selectedState;
  }, [selectedState]);

  return {
    selectedState,
    displayValue,
    isOpen,
    searchTerm,
    filteredStates,
    selectState,
    toggleDropdown,
    closeDropdown,
    handleSearch,
    setSelectedState,
  };
}

/**
 * Hook for managing multiple state dropdowns
 * Useful when you have several dropdowns on the same page
 * @param {string[]} dropdownNames - Names of the dropdowns
 * @param {Object} options - Configuration options
 */
export function useMultipleStateDropdowns(dropdownNames, options = {}) {
  const { onStateChange, initialState = null } = options;

  const [selectedState, setSelectedState] = useState(initialState);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerms, setSearchTerms] = useState(
    Object.fromEntries(dropdownNames.map((name) => [name, ''])),
  );

  // Get filtered states for a specific dropdown
  const getFilteredStates = useCallback(
    (dropdownName) => {
      const searchTerm = searchTerms[dropdownName] || '';
      if (!searchTerm) return ALL_STATES;
      return ALL_STATES.filter((state) => state.toLowerCase().includes(searchTerm.toLowerCase()));
    },
    [searchTerms],
  );

  // Toggle a specific dropdown
  const toggleDropdown = useCallback((dropdownName) => {
    setOpenDropdown((prev) => (prev === dropdownName ? null : dropdownName));
    // Reset search when opening
    setSearchTerms((prev) => ({ ...prev, [dropdownName]: '' }));
  }, []);

  // Close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    setOpenDropdown(null);
    setSearchTerms(Object.fromEntries(dropdownNames.map((name) => [name, ''])));
  }, [dropdownNames]);

  // Check if a specific dropdown is open
  const isDropdownOpen = useCallback(
    (dropdownName) => {
      return openDropdown === dropdownName;
    },
    [openDropdown],
  );

  // Set search term for a specific dropdown
  const setSearchTerm = useCallback((dropdownName, value) => {
    setSearchTerms((prev) => ({ ...prev, [dropdownName]: value }));
  }, []);

  // Get search term for a specific dropdown
  const getSearchTerm = useCallback(
    (dropdownName) => {
      return searchTerms[dropdownName] || '';
    },
    [searchTerms],
  );

  // Handle state selection from any dropdown
  const selectState = useCallback(
    (state, dropdownName) => {
      const stateValue = state === 'All states' ? 'nationwide' : state;
      setSelectedState(stateValue);
      setOpenDropdown(null);
      setSearchTerms((prev) => ({ ...prev, [dropdownName]: '' }));
      if (onStateChange) {
        onStateChange(stateValue);
      }
    },
    [onStateChange],
  );

  // Get display value
  const displayValue = useMemo(() => {
    if (!selectedState || selectedState === 'nationwide') {
      return 'All States';
    }
    return selectedState;
  }, [selectedState]);

  return {
    selectedState,
    displayValue,
    openDropdown,
    searchTerms,
    getFilteredStates,
    toggleDropdown,
    closeAllDropdowns,
    isDropdownOpen,
    setSearchTerm,
    getSearchTerm,
    selectState,
    setSelectedState,
  };
}

export default useStateSelection;
