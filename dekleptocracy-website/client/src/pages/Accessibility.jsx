import SEO from '../components/common/SEO';
import './Accessibility.css';

const Accessibility = () => {
  return (
    <div className="accessibility-page">
      <SEO
        title="Accessibility Statement"
        description="Learn about Dekleptocracy's commitment to digital accessibility. We strive to ensure our platform is usable by everyone, including people with disabilities."
        url="/accessibility"
      />
      <div className="accessibility-container">
        <h1 className="accessibility-title">Accessibility Statement</h1>
        <p className="accessibility-date">Last Updated: December 8, 2025</p>

        <section className="accessibility-section">
          <h2>1. Our Commitment</h2>
          <p>
            At Dekleptocracy, we are committed to ensuring digital accessibility for people with
            disabilities. We are continually improving the user experience for everyone and applying
            the relevant accessibility standards to ensure we provide equal access to all of our
            users.
          </p>
        </section>

        <section className="accessibility-section">
          <h2>2. Conformance Status</h2>
          <p>
            We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
            These guidelines explain how to make web content more accessible for people with
            disabilities and user-friendly for everyone.
          </p>
          <p>
            Our website has been designed with accessibility in mind, following these standards:
          </p>
          <ul>
            <li>
              <strong>Perceivable:</strong> Information and user interface components are presented
              in ways that users can perceive
            </li>
            <li>
              <strong>Operable:</strong> User interface components and navigation are operable by
              all users
            </li>
            <li>
              <strong>Understandable:</strong> Information and operation of the user interface are
              understandable
            </li>
            <li>
              <strong>Robust:</strong> Content can be interpreted reliably by a wide variety of user
              agents, including assistive technologies
            </li>
          </ul>
        </section>

        <section className="accessibility-section">
          <h2>3. Accessibility Features</h2>
          <p>Our website includes the following accessibility features:</p>
          <ul>
            <li>Semantic HTML structure for better screen reader compatibility</li>
            <li>Keyboard navigation support for all interactive elements</li>
            <li>Alternative text for images and visual content</li>
            <li>Clear and consistent navigation throughout the site</li>
            <li>Sufficient color contrast for text and background</li>
            <li>Resizable text without loss of functionality</li>
            <li>Form labels and error messages for screen readers</li>
            <li>Skip navigation links for easy access to main content</li>
            <li>ARIA labels and landmarks for enhanced navigation</li>
            <li>Video captions and transcripts where applicable</li>
          </ul>
        </section>

        <section className="accessibility-section">
          <h2>4. Assistive Technology Compatibility</h2>
          <p>Our website is designed to be compatible with the following assistive technologies:</p>
          <ul>
            <li>Screen readers (JAWS, NVDA, VoiceOver)</li>
            <li>Screen magnification software</li>
            <li>Speech recognition software</li>
            <li>Alternative input devices</li>
            <li>Browser accessibility features</li>
          </ul>
        </section>

        <section className="accessibility-section">
          <h2>5. Browser Compatibility</h2>
          <p>
            Our website is optimized to work with the latest versions of the following browsers:
          </p>
          <ul>
            <li>Google Chrome</li>
            <li>Mozilla Firefox</li>
            <li>Safari</li>
            <li>Microsoft Edge</li>
          </ul>
          <p>
            We recommend keeping your browser updated to the latest version for the best
            accessibility experience.
          </p>
        </section>

        <section className="accessibility-section">
          <h2>6. Known Limitations</h2>
          <p>
            Despite our best efforts, some content on our website may not yet be fully accessible.
            We are actively working to address the following known limitations:
          </p>
          <ul>
            <li>Some third-party embedded content may not be fully accessible</li>
            <li>Complex data visualizations may require alternative text descriptions</li>
            <li>Some PDF documents may need additional accessibility improvements</li>
            <li>Certain interactive maps may have limited keyboard navigation</li>
          </ul>
          <p>
            We are committed to addressing these issues and improving accessibility across our
            platform.
          </p>
        </section>

        <section className="accessibility-section">
          <h2>7. Feedback and Assistance</h2>
          <p>
            We welcome your feedback on the accessibility of Dekleptocracy. If you encounter any
            accessibility barriers or have suggestions for improvement, please let us know:
          </p>
          <ul>
            <li>
              <strong>Email:</strong> enquires@dekloptocracy.com
            </li>
            <li>
              <strong>Phone:</strong> 0432 740 160
            </li>
            <li>
              <strong>Subject Line:</strong> "Accessibility Feedback"
            </li>
          </ul>
          <p>
            We aim to respond to accessibility feedback within 5 business days and will work with
            you to provide the information you need in an accessible format.
          </p>
        </section>

        <section className="accessibility-section">
          <h2>8. Alternative Formats</h2>
          <p>
            If you need information from our website in a different format, such as accessible PDF,
            large print, audio recording, or braille, please contact us. We will work with you to
            provide the content in a format that meets your needs.
          </p>
        </section>

        <section className="accessibility-section">
          <h2>9. Third-Party Content</h2>
          <p>
            Some content on our website may be provided by third parties. While we strive to ensure
            all content meets our accessibility standards, we may have limited control over the
            accessibility of third-party content. If you encounter accessibility issues with
            third-party content, please contact us, and we will work to address the issue.
          </p>
        </section>

        <section className="accessibility-section">
          <h2>10. Ongoing Efforts</h2>
          <p>Accessibility is an ongoing effort. We regularly:</p>
          <ul>
            <li>Conduct accessibility audits and testing</li>
            <li>Provide accessibility training to our team</li>
            <li>Review and update our content for accessibility</li>
            <li>Test our website with various assistive technologies</li>
            <li>Engage with the disability community for feedback</li>
            <li>Stay informed about the latest accessibility guidelines and best practices</li>
          </ul>
        </section>

        <section className="accessibility-section">
          <h2>11. Accessibility Resources</h2>
          <p>For more information about web accessibility, please visit:</p>
          <ul>
            <li>
              Web Content Accessibility Guidelines (WCAG) -{' '}
              <a
                href="https://www.w3.org/WAI/WCAG21/quickref/"
                target="_blank"
                rel="noopener noreferrer"
              >
                w3.org/WAI/WCAG21/quickref
              </a>
            </li>
            <li>
              Web Accessibility Initiative (WAI) -{' '}
              <a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer">
                w3.org/WAI
              </a>
            </li>
            <li>
              Americans with Disabilities Act (ADA) -{' '}
              <a href="https://www.ada.gov/" target="_blank" rel="noopener noreferrer">
                ada.gov
              </a>
            </li>
          </ul>
        </section>

        <section className="accessibility-section">
          <h2>12. Formal Complaints</h2>
          <p>
            If you are not satisfied with our response to your accessibility concerns, you have the
            right to file a formal complaint with the relevant authorities in your jurisdiction.
          </p>
        </section>

        <section className="accessibility-section">
          <p className="accessibility-commitment">
            We are committed to making our website accessible to all users and appreciate your
            patience as we continue to improve.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Accessibility;
