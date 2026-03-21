import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import './ContactUs.css';

const ContactUs = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    additionalInfo: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    alert('Thank you for your message! We will get back to you within 1-2 business days.');
    setFormData({ fullName: '', email: '', phoneNumber: '', subject: '', additionalInfo: '' });
  };

  return (
    <div className="contact-page">
      <SEO
        title="Contact Us"
        description="Get in touch with the Dekleptocracy team. Share feedback, report issues, or collaborate with us on policy transparency initiatives."
        url="/contact"
      />
      {/* Main Contact Section */}
      <section className="contact-main-section">
        <div className="contact-container">
          {/* Heading */}
          <div className="contact-header">
            <h1 className="contact-main-heading">Connect With Our Team</h1>
            <p className="contact-description">
              Whether you have data to share, feedback on our reports, or want to collaborate for
              change, we're here to listen and respond.
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="contact-content">
            {/* Left Column - Contact Information */}
            <div className="contact-info-column">
              <h2 className="contact-info-heading">Have an enquiry?</h2>
              <p className="contact-info-subtitle">Reach out in seconds</p>

              <div className="contact-details">
                <div className="contact-detail-item">
                  <span className="contact-label">Phone Number:</span>
                  <span className="contact-value">0432 740 160</span>
                </div>
                <div className="contact-detail-item">
                  <span className="contact-label">Email Address:</span>
                  <span className="contact-value">enquires@dekloptocracy.com</span>
                </div>
              </div>
            </div>

            {/* Right Column - Enquiry Form */}
            <div className="contact-form-column">
              <div className="enquiry-form-card">
                <h3 className="form-heading">Enquiry Form</h3>
                <p className="form-subtitle">
                  Reach out to us and we'll get back within 1-2 business days.
                </p>

                <form onSubmit={handleSubmit} className="enquiry-form">
                  <div className="form-row">
                    <div className="form-field">
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <input
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Phone Number"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="form-input form-select"
                      >
                        <option value="">Subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="data">Data Sharing</option>
                        <option value="feedback">Feedback</option>
                        <option value="collaboration">Collaboration</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <textarea
                      name="additionalInfo"
                      placeholder="Additional Information"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      rows="5"
                      required
                      className="form-input form-textarea"
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-button">
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Hours Section */}
      <section className="business-hours-section">
        <div className="business-hours-container">
          <h2 className="business-hours-title">Business Hours</h2>
          <p className="business-hours-intro">
            Our team is available to provide support and answer your questions during the following
            times:
          </p>

          <div className="hours-boxes">
            <div className="hours-box">
              <span className="hours-label">Monday - Friday:</span>
              <span className="hours-time">9:00 AM – 5:00 PM</span>
            </div>
            <div className="hours-box">
              <span className="hours-label">Saturday - Sunday:</span>
              <span className="hours-time">Closed</span>
            </div>
          </div>

          <p className="business-hours-text">
            We strive to respond to all enquiries within 1-2 business days. Whether you reach out
            via phone, email, or our contact form, rest assured your message is important to us.
          </p>
          <p className="business-hours-thanks">Thank you for your patience and understanding</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="contact-cta-section">
        <div className="contact-cta-container">
          <div className="contact-cta-card">
            <div className="cta-background-pattern">
              <svg
                className="cta-swirl"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M200 50 Q250 100 200 150 T200 250 T200 350"
                  stroke="rgba(123, 156, 123, 0.3)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M150 100 Q200 150 150 200 T150 300"
                  stroke="rgba(123, 156, 123, 0.25)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M250 100 Q300 150 250 200 T250 300"
                  stroke="rgba(123, 156, 123, 0.25)"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="100"
                  stroke="rgba(123, 156, 123, 0.2)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="50"
                  stroke="rgba(123, 156, 123, 0.2)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="50"
                  stroke="rgba(123, 156, 123, 0.2)"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>

            <div className="cta-content">
              <h2 className="cta-title">Ready to See How Policy Impacts Your Wallet?</h2>
              <p className="cta-description">
                Chat instantly with our AI or explore your local impact map to uncover the hidden
                costs behind rising bills.
              </p>
              <div className="cta-buttons">
                <button className="cta-btn-white" onClick={() => navigate('/chatbot')}>
                  Ask AI Now
                </button>
                <button className="cta-btn-orange" onClick={() => navigate('/#price-map')}>
                  Explore Local Impact
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
