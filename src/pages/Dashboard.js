import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { urlService } from '../services/api';
import toast from 'react-hot-toast';
import {
  DashboardContainer,
  DashboardHeader,
  DashboardTitle,
  DashboardSubtitle,
  UrlShortenerForm,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormRow,
  SubmitButton,
  UrlsSection,
  UrlsHeader,
  UrlsTable,
  TableHeader,
  TableRow,
  TableCell,
  UrlCell,
  ActionButton,
  ActionGroup,
  Pagination,
  PageButton,
  SearchInput,
  FilterSelect,
  EmptyState,
  LoadingSpinner
} from '../styles/DashboardStyles';

const Dashboard = () => {
  const { user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [formData, setFormData] = useState({
    originalUrl: '',
    customCode: '',
    title: '',
    description: '',
    expiresAt: '',
    maxClicks: '',
    tags: ''
  });

  // Load URLs
  const loadUrls = async (page = 1) => {
    try {
      setLoading(true);
      const response = await urlService.getMyUrls({
        page,
        limit: 10,
        search,
        sortBy,
        sortOrder
      });

      if (response.data.success) {
        setUrls(response.data.data.urls);
        setTotalPages(response.data.data.pagination.totalPages);
        setCurrentPage(page);
      }
    } catch (error) {
      toast.error('Failed to load URLs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUrls();
  }, [search, sortBy, sortOrder]);

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

    setSubmitting(true);
    
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
        toast.success('URL shortened successfully!');
        setFormData({
          originalUrl: '',
          customCode: '',
          title: '',
          description: '',
          expiresAt: '',
          maxClicks: '',
          tags: ''
        });
        loadUrls(currentPage);
      } else {
        toast.error(response.data.message || 'Failed to shorten URL');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to shorten URL';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const deleteUrl = async (urlId) => {
    if (!window.confirm('Are you sure you want to delete this URL?')) return;

    try {
      const response = await urlService.deleteUrl(urlId);
      if (response.data.success) {
        toast.success('URL deleted successfully');
        loadUrls(currentPage);
      }
    } catch (error) {
      toast.error('Failed to delete URL');
    }
  };

  const toggleUrlStatus = async (urlId, currentStatus) => {
    try {
      const response = await urlService.updateUrl(urlId, { isActive: !currentStatus });
      if (response.data.success) {
        toast.success(`URL ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        loadUrls(currentPage);
      }
    } catch (error) {
      toast.error('Failed to update URL status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateUrl = (url, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <div>
          <DashboardTitle>Welcome back, {user?.username}!</DashboardTitle>
          <DashboardSubtitle>Manage your shortened URLs and track their performance</DashboardSubtitle>
        </div>
      </DashboardHeader>

      <UrlShortenerForm onSubmit={handleSubmit}>
        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '600' }}>
          Create New Short URL
        </h3>
        
        <FormGroup>
          <FormLabel htmlFor="originalUrl">Long URL *</FormLabel>
          <FormInput
            type="url"
            id="originalUrl"
            name="originalUrl"
            value={formData.originalUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/very-long-url"
            required
          />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <FormLabel htmlFor="customCode">Custom Code</FormLabel>
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
            <FormLabel htmlFor="title">Title</FormLabel>
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
          <FormLabel htmlFor="description">Description</FormLabel>
          <FormTextarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of your link"
            rows="2"
          />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <FormLabel htmlFor="expiresAt">Expires At</FormLabel>
            <FormInput
              type="datetime-local"
              id="expiresAt"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleInputChange}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel htmlFor="maxClicks">Max Clicks</FormLabel>
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
          <FormLabel htmlFor="tags">Tags (comma-separated)</FormLabel>
          <FormInput
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="marketing, social-media, campaign"
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Short URL'}
        </SubmitButton>
      </UrlShortenerForm>

      <UrlsSection>
        <UrlsHeader>
          <h3 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '600' }}>
            Your URLs
          </h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <SearchInput
              type="text"
              placeholder="Search URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FilterSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">Sort by Date</option>
              <option value="clicks">Sort by Clicks</option>
              <option value="originalUrl">Sort by URL</option>
            </FilterSelect>
            <FilterSelect
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </FilterSelect>
          </div>
        </UrlsHeader>

        {loading ? (
          <LoadingSpinner>Loading URLs...</LoadingSpinner>
        ) : urls.length === 0 ? (
          <EmptyState>
            <h4>No URLs found</h4>
            <p>Create your first short URL using the form above.</p>
          </EmptyState>
        ) : (
          <>
            <UrlsTable>
              <TableHeader>
                <TableCell>Short URL</TableCell>
                <TableCell>Original URL</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Clicks</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableHeader>
              <tbody>
                {urls.map((url) => (
                  <TableRow key={url._id}>
                    <UrlCell>
                      <div>
                        <strong>{url.shortCode}</strong>
                        <br />
                        <small style={{ color: '#64748b' }}>{url.shortUrl}</small>
                      </div>
                    </UrlCell>
                    <TableCell>
                      <div title={url.originalUrl}>
                        {truncateUrl(url.originalUrl)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {url.title || '-'}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#3b82f6' }}>{url.clicks}</strong>
                    </TableCell>
                    <TableCell>
                      {formatDate(url.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: url.isActive ? '#dcfce7' : '#fef2f2',
                        color: url.isActive ? '#166534' : '#dc2626'
                      }}>
                        {url.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ActionGroup>
                        <ActionButton
                          onClick={() => copyToClipboard(url.shortUrl)}
                          style={{ background: '#3b82f6' }}
                        >
                          Copy
                        </ActionButton>
                        <ActionButton
                          onClick={() => toggleUrlStatus(url._id, url.isActive)}
                          style={{ background: url.isActive ? '#f59e0b' : '#10b981' }}
                        >
                          {url.isActive ? 'Deactivate' : 'Activate'}
                        </ActionButton>
                        <ActionButton
                          onClick={() => deleteUrl(url._id)}
                          style={{ background: '#ef4444' }}
                        >
                          Delete
                        </ActionButton>
                      </ActionGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </UrlsTable>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  onClick={() => loadUrls(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </PageButton>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <PageButton
                  onClick={() => loadUrls(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </PageButton>
              </Pagination>
            )}
          </>
        )}
      </UrlsSection>
    </DashboardContainer>
  );
};

export default Dashboard;