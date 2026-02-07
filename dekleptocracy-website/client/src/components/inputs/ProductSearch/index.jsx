import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import homepageApi from '../../../api/homepage';
import './ProductSearch.css';

const ProductSearch = ({
  onSearch,
  onSelect,
  placeholder = 'Search for a product...',
  trendingProducts = []
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await homepageApi.fetchProductImpact(searchQuery);
      const products = response.impacts || [];
      const suggestionsList = products.map(p => ({
        name: p.name,
        changePercent: p.priceChange?.percent || 0,
        trending: p.trending || false,
        category: p.category
      }));
      setSuggestions(suggestionsList);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery]);

  const handleKeyDown = (e) => {
    const items = query.length >= 2 ? suggestions : trendingProducts;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        } else if (query.trim()) {
          onSearch(query.trim());
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;

      default:
        break;
    }
  };

  const handleSelect = (product) => {
    setQuery(product.name || product);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(product);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayItems = query.length >= 2 ? suggestions : trendingProducts;
  const showTrending = query.length < 2 && trendingProducts.length > 0;

  return (
    <div className="product-search-container">
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="product-search-input"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls="product-suggestions"
          aria-expanded={isOpen}
        />

        {isLoading && <span className="search-spinner" />}

        <button
          className="search-submit-btn"
          onClick={() => query.trim() && onSearch(query.trim())}
          disabled={!query.trim()}
        >
          Show Impact
        </button>
      </div>

      {isOpen && displayItems.length > 0 && (
        <ul
          ref={listRef}
          id="product-suggestions"
          className="suggestions-list"
          role="listbox"
        >
          {showTrending && (
            <li className="suggestions-header">
              <span className="trending-icon">🔥</span> Trending searches
            </li>
          )}

          {displayItems.map((product, index) => (
            <li
              key={product.name || index}
              role="option"
              aria-selected={index === selectedIndex}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(product)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="product-name">{product.name || product}</span>
              {product.trending && (
                <span className="trending-badge">Trending</span>
              )}
              {product.changePercent !== undefined && (
                <span className={`change ${product.changePercent > 0 ? 'up' : 'down'}`}>
                  {product.changePercent > 0 ? '+' : ''}{product.changePercent.toFixed(1)}%
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isOpen && trendingProducts.length > 0 && query.length < 2 && (
        <div className="quick-suggestions">
          <span className="suggestions-label">Try these:</span>
          {trendingProducts.slice(0, 3).map((product, index) => (
            <button
              key={product.name || index}
              className="quick-suggestion-btn"
              onClick={() => handleSelect(product)}
            >
              {product.name || product}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
