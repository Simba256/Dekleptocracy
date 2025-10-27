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
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
              <a href="#" className="footer-link">Copyright Policy</a>
              <a href="#" className="footer-link">Data Policy</a>
              <a href="#" className="footer-link">Accessibility</a>
              <a href="#" className="footer-link">Help</a>
            </div>
          </div>
          
          <div className="footer-right">
            <div className="footer-nav-links">
              <a href="/about" className="footer-nav-link">About Us</a>
              <a href="#" className="footer-nav-link">Services</a>
              <a href="#" className="footer-nav-link">Testimonials</a>
              <a href="/contact" className="footer-nav-link">Contact Us</a>
            </div>
          </div>
        </div>
        
        <div className="footer-copyright">
          © 2023 Dekleptocracy, All rights reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;

