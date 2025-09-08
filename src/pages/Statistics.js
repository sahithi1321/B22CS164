import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../services/api';
import {
  StatsContainer,
  StatsHeader,
  StatsTitle,
  StatsSubtitle,
  OverviewCards,
  OverviewCard,
  CardTitle,
  CardValue,
  CardIcon,
  ChartsSection,
  ChartCard,
  ChartTitle,
  TopUrlsSection,
  TopUrlItem,
  UrlInfo,
  UrlClicks,
  CountryStats,
  CountryItem,
  CountryName,
  CountryClicks,
  LoadingSpinner,
  ErrorMessage,
  RefreshButton
} from '../styles/StatisticsStyles';

const Statistics = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [topUrls, setTopUrls] = useState([]);
  const [clicksByDay, setClicksByDay] = useState([]);
  const [clicksByCountry, setClicksByCountry] = useState([]);
  const [clicksByReferer, setClicksByReferer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await statsService.getOverview();
      
      if (response.data.success) {
        const data = response.data.data;
        setOverview(data.overview);
        setTopUrls(data.topUrls);
        setClicksByDay(data.clicksByDay);
        setClicksByCountry(data.clicksByCountry);
        setClicksByReferer(data.clicksByReferer);
      } else {
        setError('Failed to load statistics');
      }
    } catch (error) {
      setError('Failed to load statistics');
      console.error('Statistics error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateUrl = (url, maxLength = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <StatsContainer>
        <LoadingSpinner>Loading statistics...</LoadingSpinner>
      </StatsContainer>
    );
  }

  if (error) {
    return (
      <StatsContainer>
        <ErrorMessage>
          <h3>Error Loading Statistics</h3>
          <p>{error}</p>
          <RefreshButton onClick={loadStatistics}>Try Again</RefreshButton>
        </ErrorMessage>
      </StatsContainer>
    );
  }

  return (
    <StatsContainer>
      <StatsHeader>
        <StatsTitle>Analytics Dashboard</StatsTitle>
        <StatsSubtitle>Track your URL performance and user engagement</StatsSubtitle>
      </StatsHeader>

      {overview && (
        <OverviewCards>
          <OverviewCard>
            <CardIcon>🔗</CardIcon>
            <div>
              <CardTitle>Total URLs</CardTitle>
              <CardValue>{formatNumber(overview.totalUrls)}</CardValue>
            </div>
          </OverviewCard>
          <OverviewCard>
            <CardIcon>✅</CardIcon>
            <div>
              <CardTitle>Active URLs</CardTitle>
              <CardValue>{formatNumber(overview.activeUrls)}</CardValue>
            </div>
          </OverviewCard>
          <OverviewCard>
            <CardIcon>👆</CardIcon>
            <div>
              <CardTitle>Total Clicks</CardTitle>
              <CardValue>{formatNumber(overview.totalClicks)}</CardValue>
            </div>
          </OverviewCard>
          <OverviewCard>
            <CardIcon>📈</CardIcon>
            <div>
              <CardTitle>Recent Clicks (30d)</CardTitle>
              <CardValue>{formatNumber(overview.recentClicks)}</CardValue>
            </div>
          </OverviewCard>
        </OverviewCards>
      )}

      <ChartsSection>
        <ChartCard>
          <ChartTitle>Top Performing URLs</ChartTitle>
          {topUrls.length > 0 ? (
            <TopUrlsSection>
              {topUrls.map((url, index) => (
                <TopUrlItem key={url._id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      width: '2rem',
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      {index + 1}
                    </span>
                    <UrlInfo>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {url.title || url.shortCode}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {truncateUrl(url.originalUrl)}
                      </div>
                    </UrlInfo>
                  </div>
                  <UrlClicks>
                    <strong style={{ color: '#3b82f6', fontSize: '1.25rem' }}>
                      {formatNumber(url.clicks)}
                    </strong>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>clicks</span>
                  </UrlClicks>
                </TopUrlItem>
              ))}
            </TopUrlsSection>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No URLs found
            </div>
          )}
        </ChartCard>

        <ChartCard>
          <ChartTitle>Clicks by Country</ChartTitle>
          {clicksByCountry.length > 0 ? (
            <CountryStats>
              {clicksByCountry.map((country, index) => (
                <CountryItem key={country._id}>
                  <CountryName>
                    {country._id === 'Unknown' ? '🌍' : '🏳️'} {country._id}
                  </CountryName>
                  <CountryClicks>
                    <div style={{ 
                      background: '#3b82f6', 
                      height: '8px', 
                      borderRadius: '4px',
                      width: `${(country.clicks / clicksByCountry[0].clicks) * 100}%`,
                      marginBottom: '0.25rem'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {formatNumber(country.clicks)} clicks
                    </span>
                  </CountryClicks>
                </CountryItem>
              ))}
            </CountryStats>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No country data available
            </div>
          )}
        </ChartCard>

        <ChartCard>
          <ChartTitle>Traffic Sources</ChartTitle>
          {clicksByReferer.length > 0 ? (
            <CountryStats>
              {clicksByReferer.map((referer, index) => (
                <CountryItem key={referer._id}>
                  <CountryName>
                    {referer._id === 'Direct' ? '🔗' : '🌐'} {referer._id}
                  </CountryName>
                  <CountryClicks>
                    <div style={{ 
                      background: '#10b981', 
                      height: '8px', 
                      borderRadius: '4px',
                      width: `${(referer.clicks / clicksByReferer[0].clicks) * 100}%`,
                      marginBottom: '0.25rem'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {formatNumber(referer.clicks)} clicks
                    </span>
                  </CountryClicks>
                </CountryItem>
              ))}
            </CountryStats>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No referrer data available
            </div>
          )}
        </ChartCard>

        <ChartCard>
          <ChartTitle>Clicks Over Time (Last 30 Days)</ChartTitle>
          {clicksByDay.length > 0 ? (
            <div style={{ padding: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'end', 
                gap: '0.5rem', 
                height: '200px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1rem'
              }}>
                {clicksByDay.map((day, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <div style={{
                      background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                      height: `${(day.clicks / Math.max(...clicksByDay.map(d => d.clicks))) * 150}px`,
                      width: '100%',
                      borderRadius: '4px 4px 0 0',
                      marginBottom: '0.5rem',
                      minHeight: '4px'
                    }} />
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#64748b',
                      transform: 'rotate(-45deg)',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(day.date)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                <span>Total: {formatNumber(clicksByDay.reduce((sum, day) => sum + day.clicks, 0))} clicks</span>
                <span>Average: {formatNumber(Math.round(clicksByDay.reduce((sum, day) => sum + day.clicks, 0) / clicksByDay.length))} clicks/day</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No click data available for the last 30 days
            </div>
          )}
        </ChartCard>
      </ChartsSection>
    </StatsContainer>
  );
};

export default Statistics;
