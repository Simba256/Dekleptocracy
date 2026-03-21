import SEO from '../components/common/SEO';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page">
      <SEO
        title="Privacy Policy"
        description="Learn how Dekleptocracy collects, uses, and protects your personal information. Our commitment to your privacy and data security."
        url="/privacy-policy"
        noindex={false}
      />
      <div className="privacy-policy-container">
        <h1 className="privacy-policy-title">Privacy Policy</h1>
        <p className="privacy-policy-date">Last Updated: December 8, 2025</p>

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Dekleptocracy. We are committed to protecting your privacy and ensuring the
            security of your personal information. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you visit our website and use our
            services.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide to us when you:</p>
          <ul>
            <li>Create an account on our platform</li>
            <li>Subscribe to our newsletter</li>
            <li>Contact us through our contact form</li>
            <li>Participate in surveys or provide feedback</li>
          </ul>
          <p>This information may include:</p>
          <ul>
            <li>Name and contact information (email address, phone number)</li>
            <li>Location data (state, city)</li>
            <li>Demographic information</li>
            <li>User preferences and interests</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>
            When you visit our website, we automatically collect certain information about your
            device, including:
          </p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Access times and pages viewed</li>
            <li>Referring website addresses</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for various purposes, including:</p>
          <ul>
            <li>Providing and maintaining our services</li>
            <li>Personalizing your experience on our platform</li>
            <li>Analyzing policy impacts specific to your location</li>
            <li>Sending you updates, newsletters, and marketing communications</li>
            <li>Improving our website and services</li>
            <li>Responding to your inquiries and support requests</li>
            <li>Detecting and preventing fraud or security issues</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Information Sharing and Disclosure</h2>
          <p>
            We do not sell your personal information to third parties. We may share your information
            in the following circumstances:
          </p>
          <ul>
            <li>
              <strong>Service Providers:</strong> We may share your information with third-party
              service providers who perform services on our behalf
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose your information if required by
              law or in response to valid requests by public authorities
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
              assets, your information may be transferred
            </li>
            <li>
              <strong>With Your Consent:</strong> We may share your information with your explicit
              consent
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction.
            However, no method of transmission over the Internet or electronic storage is 100%
            secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and
            hold certain information. You can instruct your browser to refuse all cookies or to
            indicate when a cookie is being sent. However, if you do not accept cookies, you may not
            be able to use some portions of our service.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Your Rights</h2>
          <p>
            Depending on your location, you may have the following rights regarding your personal
            information:
          </p>
          <ul>
            <li>Access to your personal information</li>
            <li>Correction of inaccurate or incomplete information</li>
            <li>Deletion of your personal information</li>
            <li>Objection to or restriction of processing</li>
            <li>Data portability</li>
            <li>Withdrawal of consent</li>
          </ul>
          <p>To exercise these rights, please contact us using the information provided below.</p>
        </section>

        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 13. We do not knowingly
            collect personal information from children under 13. If we become aware that we have
            collected personal information from a child under 13, we will take steps to delete such
            information.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the "Last Updated" date. You
            are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>Email: enquires@dekloptocracy.com</li>
            <li>Phone: 0432 740 160</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
