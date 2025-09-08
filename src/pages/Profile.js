import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ProfileContainer,
  ProfileHeader,
  ProfileTitle,
  ProfileSubtitle,
  ProfileCard,
  ProfileForm,
  FormGroup,
  FormLabel,
  FormInput,
  SubmitButton,
  ProfileInfo,
  InfoItem,
  InfoLabel,
  InfoValue,
  DangerZone,
  DangerTitle,
  DangerDescription,
  DangerButton,
  LoadingSpinner,
  ErrorMessage
} from '../styles/ProfileStyles';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.email.trim()) {
      setError('All fields are required');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (!user) {
    return (
      <ProfileContainer>
        <LoadingSpinner>Loading profile...</LoadingSpinner>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <ProfileTitle>Profile Settings</ProfileTitle>
        <ProfileSubtitle>Manage your account information and preferences</ProfileSubtitle>
      </ProfileHeader>

      <ProfileCard>
        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.25rem', fontWeight: '600' }}>
          Account Information
        </h3>
        
        <ProfileInfo>
          <InfoItem>
            <InfoLabel>User ID</InfoLabel>
            <InfoValue>{user._id}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Member Since</InfoLabel>
            <InfoValue>
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Email Verified</InfoLabel>
            <InfoValue>
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                background: user.isEmailVerified ? '#dcfce7' : '#fef2f2',
                color: user.isEmailVerified ? '#166534' : '#dc2626'
              }}>
                {user.isEmailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </InfoValue>
          </InfoItem>
        </ProfileInfo>
      </ProfileCard>

      <ProfileCard>
        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.25rem', fontWeight: '600' }}>
          Update Profile
        </h3>
        
        <ProfileForm onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FormGroup>
            <FormLabel htmlFor="username">Username</FormLabel>
            <FormInput
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
              minLength="3"
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="email">Email Address</FormLabel>
            <FormInput
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </SubmitButton>
        </ProfileForm>
      </ProfileCard>

      <DangerZone>
        <DangerTitle>Danger Zone</DangerTitle>
        <DangerDescription>
          These actions are irreversible. Please be careful.
        </DangerDescription>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <DangerButton onClick={handleLogout} variant="warning">
            Logout
          </DangerButton>
        </div>
      </DangerZone>
    </ProfileContainer>
  );
};

export default Profile;
