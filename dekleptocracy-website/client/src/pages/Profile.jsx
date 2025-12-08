import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../utils/auth';
import './Profile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOPIC_OPTIONS = [
  'Household Costs',
  'Lobbying & Influence',
  'Taxes & Tariffs',
  'Healthcare & Education',
  'Environment & Climate'
];

const STYLE_OPTIONS = [
  'Casual And Friendly',
  'Professional And Formal',
  'Informative And Detailed',
  'Quick And To The Point',
  'Creative And Engaging'
];

const HOUSEHOLD_OPTIONS = ['Groceries', 'Rent / Mortgage', 'Utilities', 'Healthcare', 'Others'];

const getInitials = (name) => {
  if (!name) return 'UU';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || 'U';
  const second = parts[1]?.[0] || parts[0]?.[1] || 'U';
  return `${first}${second}`.toUpperCase();
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    profilePhoto: null,
    selectedTopics: [],
    selectedStyles: [],
    householdExpenseFocus: ''
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/chatbot/login', { state: { from: { pathname: '/profile' } } });
      return;
    }

    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      setUser(data.user);
      setFormData({
        fullName: data.user.fullName || '',
        profilePhoto: null,
        selectedTopics: data.user.preferences?.topicsOfInterest || [],
        selectedStyles: data.user.preferences?.conversationStyles || [],
        householdExpenseFocus: data.user.preferences?.householdExpenseFocus || ''
      });

      // Set preview if profile photo exists
      if (data.user.profilePhoto) {
        const photoUrl = data.user.profilePhoto.startsWith('http') 
          ? data.user.profilePhoto 
          : `${API_URL}/${data.user.profilePhoto}`;
        setPreview(photoUrl);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
      setSuccess('');
    }
  };

  const toggleSelection = (key, value) => {
    setFormData(prev => {
      const current = prev[key] || [];
      const exists = current.includes(value);
      const next = exists ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      if (formData.fullName) {
        formDataToSend.append('fullName', formData.fullName);
      }

      const preferences = {
        topicsOfInterest: formData.selectedTopics,
        conversationStyles: formData.selectedStyles,
        householdExpenseFocus: formData.householdExpenseFocus.trim()
      };

      formDataToSend.append('preferences', JSON.stringify(preferences));

      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setUser(data.user);
      setSuccess('Profile updated successfully!');
      
      // Update preview if new photo was uploaded
      if (data.user.profilePhoto) {
        const photoUrl = data.user.profilePhoto.startsWith('http') 
          ? data.user.profilePhoto 
          : `${API_URL}/${data.user.profilePhoto}`;
        setPreview(photoUrl);
      }

      // Clear file input
      setFormData(prev => ({
        ...prev,
        profilePhoto: null
      }));

      // Update localStorage user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        fullName: data.user.fullName,
        profilePhoto: data.user.profilePhoto
      }));
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/chatbot/login');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your account information</p>
        </div>

        <div className="profile-content">
          <form className="profile-form" onSubmit={handleSubmit}>
            {/* Profile Photo Section */}
            <div className="profile-photo-section">
              <div className="photo-container">
                {preview ? (
                  <img src={preview} alt="Profile" className="profile-photo" />
                ) : (
                  <div className="profile-photo-placeholder">
                    {getInitials(formData.fullName || user?.fullName || 'User')}
                  </div>
                )}
                <label htmlFor="profilePhoto" className="photo-upload-label">
                  <input
                    type="file"
                    id="profilePhoto"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="photo-input"
                  />
                  <span className="photo-upload-button">Change Photo</span>
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Topics of interest</label>
                <div className="chip-row">
                  {TOPIC_OPTIONS.map((topic) => (
                    <button
                      type="button"
                      key={topic}
                      className={`chip ${formData.selectedTopics.includes(topic) ? 'chip-selected' : ''}`}
                      onClick={() => toggleSelection('selectedTopics', topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Conversation styles</label>
                <div className="chip-row">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      type="button"
                      key={style}
                      className={`chip ${formData.selectedStyles.includes(style) ? 'chip-selected' : ''}`}
                      onClick={() => toggleSelection('selectedStyles', style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Household focus</label>
                <div className="chip-row">
                  {HOUSEHOLD_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`chip ${formData.householdExpenseFocus === option ? 'chip-selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, householdExpenseFocus: option }))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="form-input"
                  disabled
                />
                <p className="form-hint">Email cannot be changed</p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

