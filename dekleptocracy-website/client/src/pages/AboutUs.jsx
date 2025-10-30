import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  const navigate = useNavigate();
  return (
    <div className="about-us-page">
      <div className="about-us-container">
        <div className="about-us-content">
          {/* Left Column - Text Content */}
          <div className="about-text-column">
            <div className="about-subtitle">Where It All Started</div>
            <h1 className="about-title">About Us</h1>
            
            <div className="about-text-content">
              <p className="about-paragraph">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              
              <p className="about-paragraph">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              
              <p className="about-paragraph">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.
              </p>
            </div>

            <button className="ask-ai-button" onClick={() => navigate('/chatbot')}>
              Ask AI
            </button>
          </div>
          
          {/* Right Column - Image */}
          <div className="about-image-column">
            <div className="about-image-container">
              <img 
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1200&fit=crop"
                alt="Industrial infrastructure with fans and piping"
                className="about-image"
              />
            </div>
          </div>
        </div>

            {/* Mission & Vision Section */}
            <div className="mission-vision-section">
              <div className="mission-vision-container">
                <h2 className="mission-vision-title">Our Mission & Vision</h2>
                <p className="mission-vision-subtitle">
                  Guiding principles that drive our commitment to excellence and innovation..
                </p>

                <div className="mission-vision-grid">
                  {/* Mission Card */}
                  <div className="mission-vision-card">
                    <div className="card-image-wrapper">
                      <img
                        src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&h=300&fit=crop"
                        alt="Person in high-visibility vest with wind turbines"
                        className="card-image"
                      />
                      <div className="card-icon-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <circle cx="12" cy="12" r="9"/>
                          <circle cx="12" cy="12" r="5"/>
                          <circle cx="12" cy="12" r="1" fill="white"/>
                        </svg>
                      </div>
                    </div>
                    <div className="card-text-content">
                      <h3 className="card-title-text">Our Mission</h3>
                      <p className="card-description-text">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.
                      </p>
                    </div>
                  </div>

                  {/* Vision Card */}
                  <div className="mission-vision-card">
                    <div className="card-image-wrapper">
                      <img
                        src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=300&fit=crop"
                        alt="Hand holding multimeter with solar panel"
                        className="card-image"
                      />
                      <div className="card-icon-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M9 21h6"/>
                          <path d="M10 21v-2c0-.5.5-1 1-1h2c.5 0 1 .5 1 1v2"/>
                          <path d="M12 3C8.5 3 6 5.5 6 9c0 2.5 1.5 4.5 3 5.5V16c0 .5.5 1 1 1h4c.5 0 1-.5 1-1v-1.5c1.5-1 3-3 3-5.5 0-3.5-2.5-6-6-6z"/>
                          <path d="M8 8c1-1 3-1 4 0" strokeWidth="1.5"/>
                          <path d="M7 10c2-2 5-2 7 0" strokeWidth="1.5"/>
                          <path d="M6 12c3-3 7-3 10 0" strokeWidth="1.5"/>
                        </svg>
                      </div>
                    </div>
                    <div className="card-text-content">
                      <h3 className="card-title-text">Our Vision</h3>
                      <p className="card-description-text">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Values Section */}
            <div className="core-values-section">
              <div className="core-values-container">
                <h2 className="core-values-title">Our Core Values</h2>
                <p className="core-values-subtitle">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>

                <div className="core-values-grid">
                  {/* Integrity */}
                  <div className="core-value-card">
                    <div className="value-icon-container">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="9"/>
                      </svg>
                    </div>
                    <div className="value-content">
                      <h3 className="value-title">Integrity</h3>
                      <p className="value-description">
                        We do what's right, not what's easy upholding honesty, transparency, and accountability in every aspect of our work.
                      </p>
                    </div>
                  </div>

                  {/* Innovation */}
                  <div className="core-value-card">
                    <div className="value-icon-container">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                        <path d="M9 21h6"/>
                        <path d="M10 21v-2c0-.5.5-1 1-1h2c.5 0 1 .5 1 1v2"/>
                        <path d="M12 3C8.5 3 6 5.5 6 9c0 2.5 1.5 4.5 3 5.5V16c0 .5.5 1 1 1h4c.5 0 1-.5 1-1v-1.5c1.5-1 3-3 3-5.5 0-3.5-2.5-6-6-6z"/>
                      </svg>
                    </div>
                    <div className="value-content">
                      <h3 className="value-title">Innovation</h3>
                      <p className="value-description">
                        Driven by progress, we continuously adopt smarter technologies and creative solutions to meet evolving industry needs.
                      </p>
                    </div>
                  </div>

                  {/* Safety */}
                  <div className="core-value-card">
                    <div className="value-icon-container">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M12 8v4"/>
                        <path d="M12 16h.01"/>
                      </svg>
                    </div>
                    <div className="value-content">
                      <h3 className="value-title">Safety</h3>
                      <p className="value-description">
                        We champion a culture of safety, protecting our people, clients, and communities with rigorous standards and practices.
                      </p>
                    </div>
                  </div>

                  {/* Reliability */}
                  <div className="core-value-card">
                    <div className="value-icon-container">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        <path d="M12 11h4"/>
                        <path d="M12 16h4"/>
                        <path d="M8 11h.01"/>
                        <path d="M8 16h.01"/>
                      </svg>
                    </div>
                    <div className="value-content">
                      <h3 className="value-title">Reliability</h3>
                      <p className="value-description">
                        Our clients count on us to deliver consistent results on time, every time with uncompromising quality and reliability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Experts Section */}
            <div className="experts-section">
              <div className="experts-container">
                <h2 className="experts-title">Experts Behind Every Solution</h2>
                <p className="experts-subtitle">
                  Our team is made up of seasoned engineers, project managers, and technical specialists who bring decades of combined experience to every project.
                </p>

                <div className="experts-grid">
                  {/* John Smith */}
                  <div className="expert-card">
                    <div className="expert-image-container">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
                        alt="John Smith"
                        className="expert-image"
                      />
                    </div>
                    <h3 className="expert-name">John Smith</h3>
                    <p className="expert-title">Managing Director</p>
                  </div>

                  {/* Sarah Liu */}
                  <div className="expert-card">
                    <div className="expert-image-container">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop"
                        alt="Sarah Liu"
                        className="expert-image"
                      />
                    </div>
                    <h3 className="expert-name">Sarah Liu</h3>
                    <p className="expert-title">Head of Engineering</p>
                  </div>

                  {/* Emma Raynor */}
                  <div className="expert-card">
                    <div className="expert-image-container">
                      <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop"
                        alt="Emma Raynor"
                        className="expert-image"
                      />
                    </div>
                    <h3 className="expert-name">Emma Raynor</h3>
                    <p className="expert-title">Client Services Lead</p>
                  </div>
                </div>

                <div className="experts-cta">
                  <button className="ask-ai-button-experts" onClick={() => navigate('/chatbot')}>Ask AI</button>
                </div>
              </div>
            </div>

            {/* What Sets Us Apart Section */}
            <div className="what-sets-us-apart-section">
              <div className="what-sets-us-apart-container">
                <h2 className="what-sets-us-apart-title">What Sets Us Apart</h2>
                <div className="what-sets-us-apart-content">
                  <p className="what-sets-us-apart-paragraph">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                  <p className="what-sets-us-apart-paragraph">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                  </p>
                </div>
                <div className="what-sets-us-apart-cta">
                  <button className="ask-ai-button-what-sets" onClick={() => navigate('/chatbot')}>Ask AI</button>
                </div>
              </div>
            </div>

            {/* Testimonials Section */}
            <div className="testimonials-section">
              <div className="testimonials-container">
                <div className="testimonials-grid">
                  {/* Testimonial 1 */}
                  <div className="testimonial-card">
                    <div className="testimonial-stars">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    </div>
                    <p className="testimonial-text">
                      "The cold storage system designed and implemented by your team has transformed our operations. Not only are our perishables lasting longer, but our energy bills have significantly decreased."
                    </p>
                    <h4 className="testimonial-author">Sarah Mitchell</h4>
                    <p className="testimonial-title">Operations Manager</p>
                  </div>

                  {/* Testimonial 2 */}
                  <div className="testimonial-card">
                    <div className="testimonial-stars">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    </div>
                    <p className="testimonial-text">
                      "Exceptional service from start to finish. The team understood our facility's unique requirements and delivered a high-performance refrigeration system ahead of schedule."
                    </p>
                    <h4 className="testimonial-author">Mark Reynolds</h4>
                    <p className="testimonial-title">Operations Manager at FreshLogix</p>
                  </div>

                  {/* Testimonial 3 */}
                  <div className="testimonial-card">
                    <div className="testimonial-stars">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    </div>
                    <p className="testimonial-text">
                      "Reliable, knowledgeable, and always responsive. Their project management and compliance support made a huge difference for our national distribution upgrade."
                    </p>
                    <h4 className="testimonial-author">Sarah Mitchell</h4>
                    <p className="testimonial-title">Facilities Director at ColdChain Solutions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="about-cta-section">
              <div className="about-cta-container">
                <div className="about-cta-card">
                  <div className="about-cta-content">
                    <div className="about-cta-text">
                      <h2 className="about-cta-title">Ready to Track Policy Impacts on Your Budget?</h2>
                      <p className="about-cta-description">
                        Join thousands of users who are already making informed decisions about their finances based on real policy data.
                      </p>
                    </div>
                    <div className="about-cta-buttons">
                      <button className="about-cta-primary-button">Get Started</button>
                      <button className="about-cta-secondary-button">Learn More</button>
                    </div>
                  </div>
                  <div className="about-cta-decoration">
                    <svg className="about-chain-decoration" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 15l6-6"/>
                      <path d="M9 9l6 6"/>
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                    <svg className="about-chain-decoration" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 15l6-6"/>
                      <path d="M9 9l6 6"/>
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
};

export default AboutUs;