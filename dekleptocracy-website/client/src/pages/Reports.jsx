import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import './Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('voter');
  const [selectedState, setSelectedState] = useState('');
  const [name, setName] = useState('');

  const roles = [
    {
      id: 'voter',
      label: 'Voter',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <path d="M9 16l2 2 4-4"/>
        </svg>
      )
    },
    {
      id: 'candidate',
      label: 'Candidate',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          <path d="M6 21v-2a4 4 0 0 1 4-4h.5"/>
        </svg>
      )
    },
    {
      id: 'advocate',
      label: 'Advocate',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      )
    }
  ];

  const states = [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'District of Columbia',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming'
  ];

  const handleGenerateReports = () => {
    // Navigate to state report with parameters
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (selectedState) params.append('state', selectedState);
    if (selectedRole) params.append('role', selectedRole);
    
    navigate(`/reports/state-report?${params.toString()}`);
  };

  return (
    <div className="reports-page">
      <SEO
        title="State Reports"
        description="Generate personalized reports showing how federal policies, tariffs, and economic changes impact your state. Get data-driven insights for voters, candidates, and advocates."
        url="/reports"
        keywords="state reports, policy impact, federal policy, state economics, tariff impact by state"
      />
      <div className="reports-container">
        {/* Top Banner */}
        <div className="reports-banner">
          FROM THE DEKLEPTOCRACY PLATFORM
        </div>

        {/* Main Title */}
        <h1 className="reports-title">Custom State Reports</h1>

        {/* Subtitle */}
        <div className="reports-subtitle">
          <div className="reports-subtitle-line1">Generate personalized reports showing how federal policies impact your community.</div>
          <div className="reports-subtitle-line2">Perfect for voters, advocates, candidates, and anyone who wants data-driven insights.</div>
        </div>

        {/* Main Card */}
        <div className="reports-card">
          <div className="reports-card-header">
            <h2 className="reports-card-title">Create Your State Report</h2>
            <p className="reports-card-subtitle">Choose your state and get started</p>
          </div>

          {/* I am a... Section */}
          <div className="reports-role-section">
            <label className="reports-section-label">I am a..</label>
            <div className="reports-role-cards">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`reports-role-card ${selectedRole === role.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className="reports-role-icon">
                    {role.icon}
                  </div>
                  {role.shortLabel && (
                    <div className="reports-role-short-label">{role.shortLabel}</div>
                  )}
                  <div className="reports-role-label">{role.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Your State Section */}
          <div className="reports-district-section">
            <label className="reports-section-label">Your State</label>
            <div className="reports-dropdown-wrapper">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="reports-dropdown"
              >
                <option value="">Select your state...</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <div className="reports-dropdown-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Name Section */}
          <div className="reports-name-section">
            <label className="reports-section-label">Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="reports-name-input"
            />
          </div>

          {/* Generate Button */}
          <button 
            className="reports-generate-button"
            onClick={handleGenerateReports}
          >
            Generate my reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;