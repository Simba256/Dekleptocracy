import './ScreenReaderOnly.css';

export const ScreenReaderOnly = ({ children, as: Component = 'span' }) => (
  <Component className="sr-only">
    {children}
  </Component>
);

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

export const SkipLink = ({ href, children = 'Skip to main content' }) => (
  <a
    href={href}
    className="skip-link"
  >
    {children}
  </a>
);

export const HiddenText = ({ children }) => (
  <span className="sr-only">{children}</span>
);

export default ScreenReaderOnly;
