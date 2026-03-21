import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO, { generateFAQSchema } from '../components/common/SEO';
import './Help.css';

const Help = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is Dekleptocracy?',
      answer:
        'Dekleptocracy is a platform that tracks and analyzes how government policies and decisions impact your household budget. We provide real-time data on price changes, policy impacts, and lobbying activities that affect consumer costs.',
    },
    {
      question: 'How do I create an account?',
      answer:
        "Click on the profile icon in the top right corner and select 'Sign Up'. Fill in your information including name, email, and location. You can also sign up using your Google account for faster registration.",
    },
    {
      question: 'Is Dekleptocracy free to use?',
      answer:
        'Yes, Dekleptocracy offers free access to most of our features including price tracking, policy analysis, and our AI chatbot. Some premium features may require a subscription in the future.',
    },
    {
      question: 'How accurate is the data?',
      answer:
        'We source our data from reputable government databases, economic research institutions, and verified public records. Our team regularly reviews and updates the data to ensure accuracy. However, we recommend using our platform as one of several resources for making informed decisions.',
    },
    {
      question: 'How do I use the AI chatbot?',
      answer:
        'Navigate to the Chatbot page from the main menu. You can ask questions about policy impacts, price changes, or budget analysis. The AI will provide data-driven answers based on your location and the latest available information.',
    },
    {
      question: 'Can I customize my location?',
      answer:
        'Yes! You can set your location (state and city) when creating your account or update it later in your profile settings. This helps us provide more accurate and relevant data for your area.',
    },
    {
      question: 'What do the different reports show?',
      answer:
        'Our reports include: District Reports (local policy impacts), Price Trend Reports (commodity and service price changes), Budget Impact Analysis (how policies affect household budgets), and Lobbying Reports (tracking money in politics).',
    },
    {
      question: 'How often is the data updated?',
      answer:
        'We update our data continuously. Price data is updated daily, policy information is updated as changes occur, and lobbying data is updated quarterly based on official filings.',
    },
    {
      question: 'Can I download reports?',
      answer:
        'Yes, you can download PDF versions of our reports from the Reports page. This feature is available to all registered users.',
    },
    {
      question: 'How do I change my password?',
      answer:
        "Go to your Profile page, click on 'Account Settings', and select 'Change Password'. You'll need to enter your current password and your new password twice for confirmation.",
    },
    {
      question: 'What if I forget my password?',
      answer:
        "On the login page, click 'Forgot Password'. Enter your email address, and we'll send you instructions to reset your password.",
    },
    {
      question: 'Can I delete my account?',
      answer:
        'Yes, you can delete your account from the Profile Settings page. Please note that this action is permanent and will remove all your data from our system.',
    },
    {
      question: 'How do I contact support?',
      answer:
        'You can reach our support team via email at enquires@dekloptocracy.com or call us at 0432 740 160. We typically respond within 1-2 business days.',
    },
    {
      question: 'Is my personal information secure?',
      answer:
        'Yes, we take data security seriously. We use industry-standard encryption to protect your information. Please review our Privacy Policy and Data Policy for detailed information on how we handle your data.',
    },
    {
      question: 'Can I share reports with others?',
      answer:
        'Yes, you can share reports via social media or by copying the report URL. Some reports also have a direct share button for easy distribution.',
    },
    {
      question: 'What browsers does Dekleptocracy support?',
      answer:
        'We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, please keep your browser updated.',
    },
    {
      question: 'Can I access Dekleptocracy on mobile devices?',
      answer:
        "Yes, our website is fully responsive and works on smartphones and tablets. We're also working on dedicated mobile apps for iOS and Android.",
    },
    {
      question: 'How do I provide feedback?',
      answer:
        'We welcome your feedback! You can contact us through the Contact Us page, email us directly, or use the feedback form in your user profile.',
    },
  ];

  return (
    <div className="help-page">
      <SEO
        title="Help & FAQ"
        description="Find answers to common questions about Dekleptocracy. Learn how to track policy impacts, use our tools, and get the most from our platform."
        url="/help"
        structuredData={generateFAQSchema(faqs)}
      />
      <div className="help-hero">
        <div className="help-hero-content">
          <h1 className="help-title">How Can We Help You?</h1>
          <p className="help-subtitle">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>
      </div>

      <div className="help-container">
        {/* Quick Links Section */}
        <section className="quick-links-section">
          <h2 className="section-title">Quick Links</h2>
          <div className="quick-links-grid">
            <div className="quick-link-card" onClick={() => navigate('/chatbot')}>
              <div className="quick-link-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3>Ask AI</h3>
              <p>Get instant answers from our AI chatbot</p>
            </div>

            <div className="quick-link-card" onClick={() => navigate('/contact')}>
              <div className="quick-link-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3>Contact Support</h3>
              <p>Reach out to our support team</p>
            </div>

            <div className="quick-link-card" onClick={() => navigate('/about')}>
              <div className="quick-link-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <h3>About Us</h3>
              <p>Learn more about Dekleptocracy</p>
            </div>

            <div className="quick-link-card" onClick={() => navigate('/reports')}>
              <div className="quick-link-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>View Reports</h3>
              <p>Access detailed policy reports</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${openFaq === index ? 'active' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`faq-icon ${openFaq === index ? 'open' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="help-contact-section">
          <h2 className="section-title">Still Need Help?</h2>
          <p className="help-contact-text">
            Our support team is here to assist you. We typically respond within 1-2 business days.
          </p>
          <div className="help-contact-methods">
            <div className="contact-method">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <div>
                <h4>Email</h4>
                <p>enquires@dekloptocracy.com</p>
              </div>
            </div>
            <div className="contact-method">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <div>
                <h4>Phone</h4>
                <p>0432 740 160</p>
              </div>
            </div>
          </div>
          <button className="contact-button" onClick={() => navigate('/contact')}>
            Go to Contact Page
          </button>
        </section>
      </div>
    </div>
  );
};

export default Help;
