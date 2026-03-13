import './ScreenReaderOnly.css';

/**
 * ScreenReaderOnly - Visually hidden content for screen readers
 * Content is hidden visually but accessible to assistive technologies.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content for screen readers
 * @param {React.ElementType} [props.as='span'] - HTML element to render
 * @returns {JSX.Element}
 */
export const ScreenReaderOnly = ({ children, as: Component = 'span' }) => (
  <Component className="sr-only">
    {children}
  </Component>
);

/**
 * LiveRegion - ARIA live region for dynamic announcements
 * Announces content changes to screen readers automatically.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to announce
 * @param {'polite'|'assertive'} [props.politeness='polite'] - Announcement urgency
 * @param {boolean} [props.atomic=true] - Whether to announce entire region on change
 * @param {React.ElementType} [props.as='div'] - HTML element to render
 * @returns {JSX.Element}
 */
export const LiveRegion = ({
  children,
  politeness = 'polite',
  atomic = true,
  as: Component = 'div'
}) => (
  <Component
    role="status"
    aria-live={politeness}
    aria-atomic={atomic}
    className="sr-only"
  >
    {children}
  </Component>
);

/**
 * SkipLink - Keyboard-accessible skip navigation link
 * Visible on focus, allows keyboard users to skip repetitive content.
 * @param {Object} props
 * @param {string} props.href - Target element ID (e.g., '#main')
 * @param {React.ReactNode} [props.children='Skip to main content'] - Link text
 * @returns {JSX.Element}
 */
export const SkipLink = ({ href, children = 'Skip to main content' }) => (
  <a
    href={href}
    className="skip-link"
  >
    {children}
  </a>
);

/**
 * HiddenText - Simple visually hidden text wrapper
 * Alias for ScreenReaderOnly with span element.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Text content
 * @returns {JSX.Element}
 */
export const HiddenText = ({ children }) => (
  <span className="sr-only">{children}</span>
);

export default ScreenReaderOnly;
