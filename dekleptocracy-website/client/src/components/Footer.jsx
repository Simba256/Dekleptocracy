import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <span className="logo-bold">
                d<span className="e-with-dash">e</span>
              </span>
              <span className="logo-light">kleptocracy</span>
            </div>
            <div className="footer-links">
              <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms-of-service" className="footer-link">Terms of Service</Link>
              <Link to="/copyright-policy" className="footer-link">Copyright Policy</Link>
              <Link to="/data-policy" className="footer-link">Data Policy</Link>
              <Link to="/accessibility" className="footer-link">Accessibility</Link>
              <Link to="/help" className="footer-link">Help</Link>
            </div>
          </div>
          
          <div className="footer-right">
            <div className="footer-nav-links">
              <Link to="/about" className="footer-nav-link">About Us</Link>
              <Link to="/services" className="footer-nav-link">Services</Link>
              <Link to="/contact" className="footer-nav-link">Contact Us</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-copyright">
          © 2025 Dekleptocracy, All rights reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;

