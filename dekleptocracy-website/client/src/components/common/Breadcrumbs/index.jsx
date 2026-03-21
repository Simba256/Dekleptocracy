import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

// Inline SVG icons to avoid lucide-react dependency
const HomeIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

HomeIcon.propTypes = {
  size: PropTypes.number,
};

HomeIcon.defaultProps = {
  size: 16,
};

const ChevronRightIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

ChevronRightIcon.propTypes = {
  size: PropTypes.number,
};

ChevronRightIcon.defaultProps = {
  size: 14,
};

/**
 * Breadcrumbs component for navigation hierarchy
 */
const Breadcrumbs = ({ items, showHome = true, className = '' }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumbs ${className}`.trim()}>
      <ol className="breadcrumbs__list">
        {showHome && (
          <li className="breadcrumbs__item">
            <Link to="/" className="breadcrumbs__link breadcrumbs__link--home" aria-label="Home">
              <HomeIcon size={16} />
            </Link>
            {breadcrumbItems.length > 0 && (
              <span className="breadcrumbs__separator">
                <ChevronRightIcon size={14} />
              </span>
            )}
          </li>
        )}

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.path || index} className="breadcrumbs__item">
              {isLast ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link to={item.path} className="breadcrumbs__link">
                    {item.label}
                  </Link>
                  <span className="breadcrumbs__separator">
                    <ChevronRightIcon size={14} />
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    }),
  ),
  showHome: PropTypes.bool,
  className: PropTypes.string,
};

Breadcrumbs.defaultProps = {
  items: null,
  showHome: true,
  className: '',
};

/**
 * Generate breadcrumb items from pathname
 * @param {string} pathname - Current route pathname
 * @returns {Array} Array of breadcrumb items
 */
function generateBreadcrumbs(pathname) {
  // Route label mappings
  const routeLabels = {
    about: 'About',
    contact: 'Contact',
    reports: 'Reports',
    'state-report': 'State Report',
    insights: 'Insights',
    chatbot: 'AI Assistant',
    login: 'Login',
    'create-account': 'Create Account',
    profile: 'Profile',
    articles: 'Articles',
    costs: 'Costs',
    budget: 'Budget Impact',
  };

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const items = [];
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;

    // Get label from mapping or format the segment
    const label = routeLabels[segment] || formatSegmentLabel(segment);

    items.push({
      label,
      path: currentPath,
    });
  });

  return items;
}

/**
 * Format a URL segment into a readable label
 * @param {string} segment - URL segment
 * @returns {string} Formatted label
 */
function formatSegmentLabel(segment) {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default Breadcrumbs;
