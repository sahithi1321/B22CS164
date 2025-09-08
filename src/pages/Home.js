import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { urlService } from '../services/api';
import toast from 'react-hot-toast';
import {
  HeroSection,
  HeroContent,
  HeroTitle,
  HeroSubtitle,
  UrlShortenerForm,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormRow,
  FormCheckbox,
  CheckboxLabel,
  SubmitButton,
  FeaturesSection,
  FeatureGrid,
  FeatureCard,
  FeatureIcon,
  FeatureTitle,
  FeatureDescription,
  StatsSection,
  StatCard,
  StatNumber,
  StatLabel,
  CTA,
  CTAContent,
  CTAButton
} from '../styles/HomeStyles';

const Home = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    originalUrl: '',
    customCode: '',
    title: '',
    description: '',
    expiresAt: '',
    maxClicks: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.originalUrl) {
      toast.error('Please enter a URL to shorten');
      return;
    }

    setIsLoading(true);
    
    try {
      const urlData = {
        originalUrl: formData.originalUrl,
        customCode: formData.customCode || undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
        expiresAt: formData.expiresAt || undefined,
        maxClicks: formData.maxClicks ? parseInt(formData.maxClicks) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined
      };

      const response = await urlService.createShortUrl(urlData);
      
      if (response.data.success) {
        setShortenedUrl(response.data.data.url);
        toast.success('URL shortened successfully!');
        
        // Reset form
        setFormData({
          originalUrl: '',
          customCode: '',
          title: '',
          description: '',
          expiresAt: '',
          maxClicks: '',
          tags: ''
        });
      } else {
        toast.error(response.data.message || 'Failed to shorten URL');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to shorten URL';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <>
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            Shorten URLs, Track Analytics, 
            <span> Grow Your Business</span>
          </HeroTitle>
          <HeroSubtitle>
            Create short, memorable links and get detailed analytics on clicks, 
            geographic data, and more. Perfect for marketing campaigns, social media, 
            and business growth.
          </HeroSubtitle>
          
          <UrlShortenerForm onSubmit={handleSubmit}>
            <FormGroup>
              <FormLabel htmlFor="originalUrl">Enter your long URL</FormLabel>
              <FormInput
                type="url"
                id="originalUrl"
                name="originalUrl"
                value={formData.originalUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/very-long-url-that-needs-shortening"
                required
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <FormLabel htmlFor="customCode">Custom short code (optional)</FormLabel>
                <FormInput
                  type="text"
                  id="customCode"
                  name="customCode"
                  value={formData.customCode}
                  onChange={handleInputChange}
                  placeholder="my-custom-link"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel htmlFor="title">Title (optional)</FormLabel>
                <FormInput
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="My awesome link"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <FormLabel htmlFor="description">Description (optional)</FormLabel>
              <FormTextarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of your link"
                rows="3"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <FormLabel htmlFor="expiresAt">Expires at (optional)</FormLabel>
                <FormInput
                  type="datetime-local"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel htmlFor="maxClicks">Max clicks (optional)</FormLabel>
                <FormInput
                  type="number"
                  id="maxClicks"
                  name="maxClicks"
                  value={formData.maxClicks}
                  onChange={handleInputChange}
                  placeholder="1000"
                  min="1"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <FormLabel htmlFor="tags">Tags (comma-separated, optional)</FormLabel>
              <FormInput
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="marketing, social-media, campaign"
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? 'Shortening...' : 'Shorten URL'}
            </SubmitButton>
          </UrlShortenerForm>

          {shortenedUrl && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Your shortened URL:</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={shortenedUrl.shortUrl}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(shortenedUrl.shortUrl)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Copy
                </button>
              </div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                Original: {shortenedUrl.originalUrl}
              </p>
            </div>
          )}
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem', fontWeight: '700', color: '#1e293b' }}>
            Why Choose Our URL Shortener?
          </h2>
          <FeatureGrid>
            <FeatureCard>
              <FeatureIcon>📊</FeatureIcon>
              <FeatureTitle>Detailed Analytics</FeatureTitle>
              <FeatureDescription>
                Track clicks, geographic data, referrers, and device information 
                with comprehensive analytics dashboards.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🔗</FeatureIcon>
              <FeatureTitle>Custom Short Codes</FeatureTitle>
              <FeatureDescription>
                Create memorable, branded short links with your own custom codes 
                for better brand recognition.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>⏰</FeatureIcon>
              <FeatureTitle>Expiration Control</FeatureTitle>
              <FeatureDescription>
                Set expiration dates and click limits to control when your links 
                become inactive automatically.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🔒</FeatureIcon>
              <FeatureTitle>Secure & Reliable</FeatureTitle>
              <FeatureDescription>
                Enterprise-grade security with rate limiting, input validation, 
                and 99.9% uptime guarantee.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>📱</FeatureIcon>
              <FeatureTitle>Mobile Optimized</FeatureTitle>
              <FeatureDescription>
                Fully responsive design that works perfectly on all devices 
                and screen sizes.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🚀</FeatureIcon>
              <FeatureTitle>Fast & Scalable</FeatureTitle>
              <FeatureDescription>
                Lightning-fast URL shortening with global CDN and scalable 
                infrastructure for high traffic.
              </FeatureDescription>
            </FeatureCard>
          </FeatureGrid>
        </div>
      </FeaturesSection>

      <StatsSection>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem', fontWeight: '700', color: '#1e293b' }}>
            Trusted by Thousands
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <StatCard>
              <StatNumber>1M+</StatNumber>
              <StatLabel>URLs Shortened</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>50K+</StatNumber>
              <StatLabel>Active Users</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>99.9%</StatNumber>
              <StatLabel>Uptime</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>24/7</StatNumber>
              <StatLabel>Support</StatLabel>
            </StatCard>
          </div>
        </div>
      </StatsSection>

      {!user && (
        <CTA>
          <CTAContent>
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of users who trust our platform for their URL shortening needs.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <CTAButton as="a" href="/register">Get Started Free</CTAButton>
              <CTAButton as="a" href="/login" variant="outline">Sign In</CTAButton>
            </div>
          </CTAContent>
        </CTA>
      )}
    </>
  );
};

export default Home;